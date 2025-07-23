import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dbHelpers, Question } from './db';

// Types for API requests
interface GenerateQuestionsRequest {
  topic: string;
  count: number;
  difficulty: string;
}

interface RegenerateQuestionRequest {
  originalQuestion: string;
  topic: string;
  difficulty: string;
  type: string;
}

interface GetExplanationRequest {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  topic: string;
}

interface GetHintRequest {
  question: string;
  topic: string;
}

// API functions
const api = {
  async generateQuestions(params: GenerateQuestionsRequest): Promise<{ questions: Question[] }> {
    const response = await fetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate questions');
    }
    
    return response.json();
  },

  async regenerateQuestion(params: RegenerateQuestionRequest): Promise<{ question: Question }> {
    const response = await fetch('/api/regenerate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error('Failed to regenerate question');
    }
    
    return response.json();
  },

  async getExplanation(params: GetExplanationRequest): Promise<{ explanation: string }> {
    const response = await fetch('/api/get-explanation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get explanation');
    }
    
    return response.json();
  },

  async getHint(params: GetHintRequest): Promise<{ hint: string }> {
    const response = await fetch('/api/get-hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get hint');
    }
    
    return response.json();
  },
};

// React Query hooks
export function useGenerateQuestions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.generateQuestions,
    onSuccess: async (data, variables) => {
      // Cache questions in IndexedDB (remove id to let database auto-generate)
      const questionsToSave = data.questions.map(q => {
        const { id, ...questionWithoutId } = q;
        return {
          ...questionWithoutId,
          topic: variables.topic,
          bookmarked: 0,
          tags: []
        };
      });
      
      await dbHelpers.saveQuestions(questionsToSave);
      
      // Update React Query cache
      queryClient.setQueryData(['questions', variables.topic], data.questions);
    },
  });
}

export function useRegenerateQuestion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.regenerateQuestion,
    onSuccess: async (data, variables) => {
      // Save the new question to IndexedDB (remove id to let database auto-generate)
      const { id, ...questionWithoutId } = data.question;
      await dbHelpers.saveQuestions([{
        ...questionWithoutId,
        topic: variables.topic,
        bookmarked: 0,
        tags: []
      }]);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['questions', variables.topic] });
    },
  });
}

export function useGetExplanation() {
  return useMutation({
    mutationFn: async (params: GetExplanationRequest & { questionId?: number }) => {
      // Check cache first
      if (params.questionId) {
        const cached = await dbHelpers.getCachedExplanation(params.questionId, params.userAnswer);
        if (cached) {
          return { explanation: cached.explanation };
        }
      }
      
      // Fetch from API
      const result = await api.getExplanation(params);
      
      // Cache the result
      if (params.questionId) {
        await dbHelpers.saveCachedExplanation(params.questionId, params.userAnswer, result.explanation);
      }
      
      return result;
    },
  });
}

export function useGetHint() {
  return useMutation({
    mutationFn: async (params: GetHintRequest & { questionId?: number }) => {
      // Check cache first
      if (params.questionId) {
        const cached = await dbHelpers.getCachedHint(params.questionId);
        if (cached) {
          return { hint: cached.hint };
        }
      }
      
      // Fetch from API
      const result = await api.getHint(params);
      
      // Cache the result
      if (params.questionId) {
        await dbHelpers.saveCachedHint(params.questionId, result.hint);
      }
      
      return result;
    },
  });
}

export function useQuestionsByTopic(topic: string) {
  return useQuery({
    queryKey: ['questions', topic],
    queryFn: () => dbHelpers.getQuestionsByTopic(topic),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useBookmarkedQuestions() {
  return useQuery({
    queryKey: ['questions', 'bookmarked'],
    queryFn: () => dbHelpers.getBookmarkedQuestions(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useUserProgress() {
  return useQuery({
    queryKey: ['userProgress'],
    queryFn: () => dbHelpers.getUserProgress(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRecentQuizSessions() {
  return useQuery({
    queryKey: ['quizSessions', 'recent'],
    queryFn: () => dbHelpers.getRecentQuizSessions(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Utility hooks
export function useToggleBookmark() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useSaveQuizSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.saveQuizSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizSessions'] });
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ topic, correct, total, timeSpent }: {
      topic: string;
      correct: number;
      total: number;
      timeSpent: number;
    }) => dbHelpers.updateUserProgress(topic, correct, total, timeSpent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    },
  });
}