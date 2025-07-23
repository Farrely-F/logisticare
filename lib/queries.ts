import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dbHelpers, Question, ReadingMaterial, QuizProgress } from './db';

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

interface GenerateReadingMaterialRequest {
  topic: string;
  difficulty: string;
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

  async evaluateAnswer(data: { 
    question: string; 
    userAnswer: string; 
    correctAnswer: string; 
    topic: string; 
    questionType: string 
  }): Promise<any> {
    const response = await fetch('/api/evaluate-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to evaluate answer');
    return response.json();
  },

  async evaluateQuiz(data: {
    questions: any[];
    userAnswers: (string | number)[];
    evaluations: any[];
    topic: string;
    difficulty: string;
    timeSpent: number;
    totalQuestions: number;
  }): Promise<any> {
    const response = await fetch('/api/evaluate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to evaluate quiz');
    return response.json();
  },

  async generateReadingMaterial(params: GenerateReadingMaterialRequest): Promise<{ readingMaterial: ReadingMaterial }> {
    const response = await fetch('/api/generate-reading-material', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate reading material');
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

// Reading Materials hooks
export function useGenerateReadingMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.generateReadingMaterial,
    onSuccess: async (data, variables) => {
      // Save to IndexedDB
      await dbHelpers.saveReadingMaterial({
        title: data.readingMaterial.title,
        content: data.readingMaterial.content,
        topic: data.readingMaterial.topic,
        difficulty: data.readingMaterial.difficulty,
        tags: data.readingMaterial.tags,
        bookmarked: 0,
        createdAt: new Date(),
        lastRead: undefined
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['readingMaterials'] });
    },
  });
}

export function useReadingMaterialsByTopic(topic: string) {
  return useQuery({
    queryKey: ['readingMaterials', topic],
    queryFn: () => dbHelpers.getReadingMaterialsByTopic(topic),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllReadingMaterials() {
  return useQuery({
    queryKey: ['readingMaterials', 'all'],
    queryFn: () => dbHelpers.getAllReadingMaterials(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useBookmarkedReadingMaterials() {
  return useQuery({
    queryKey: ['readingMaterials', 'bookmarked'],
    queryFn: () => dbHelpers.getBookmarkedReadingMaterials(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useUpdateReadingMaterialLastRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.updateReadingMaterialLastRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingMaterials'] });
    },
  });
}

export function useToggleReadingMaterialBookmark() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.toggleReadingMaterialBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingMaterials'] });
    },
  });
}

export function useDeleteReadingMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.deleteReadingMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readingMaterials'] });
    },
  });
}

// Quiz Progress hooks
export function useSaveQuizProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.saveQuizProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizProgress'] });
    },
  });
}

export function useGetQuizProgress(topic: string) {
  return useQuery({
    queryKey: ['quizProgress', topic],
    queryFn: async () => {
      const progress = await dbHelpers.getQuizProgress(topic);
      return progress || null; // Return null instead of undefined
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useUpdateQuizProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ progressId, updates }: { progressId: number; updates: Partial<QuizProgress> }) => 
      dbHelpers.updateQuizProgress(progressId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizProgress'] });
    },
  });
}

export function useDeleteQuizProgress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.deleteQuizProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizProgress'] });
    },
  });
}

export function useAllQuizProgress() {
  return useQuery({
    queryKey: ['quizProgress', 'all'],
    queryFn: () => dbHelpers.getAllQuizProgress(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Data Management hooks
export function useClearAllData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.resetAllData,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useResetAllData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.resetAllData,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useDeleteTopicData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.resetTopicData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['readingMaterials'] });
      queryClient.invalidateQueries({ queryKey: ['quizProgress'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    },
  });
}

export function useResetTopicData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dbHelpers.resetTopicData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['readingMaterials'] });
      queryClient.invalidateQueries({ queryKey: ['quizProgress'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    },
  });
}

// Enhanced question selection hooks
export function useRandomQuestionsByTopic(topic: string, count: number) {
  return useQuery({
    queryKey: ['questions', 'random', topic, count],
    queryFn: () => dbHelpers.getRandomQuestionsByTopic(topic, count),
    staleTime: 0, // Always fresh for random selection
  });
}

export function useQuestionCount(topic?: string) {
  return useQuery({
    queryKey: ['questions', 'count', topic],
    queryFn: () => topic ? dbHelpers.getQuestionCount(topic) : Promise.resolve(0),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// AI Evaluation hooks
export function useEvaluateAnswer() {
  return useMutation({
    mutationFn: api.evaluateAnswer,
  });
}

export function useEvaluateQuiz() {
  return useMutation({
    mutationFn: api.evaluateQuiz,
  });
}