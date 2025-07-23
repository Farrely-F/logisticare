import Dexie, { Table } from 'dexie';

export interface Question {
  id?: number;
  type: "multiple-choice" | "true-false" | "short-answer";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  aiHint: string;
  bookmarked?: number; // Use number instead of boolean for IndexedDB compatibility
  tags?: string[];
  createdAt: Date;
  lastUsed?: Date;
}

export interface QuizSession {
  id?: number;
  topic: string;
  difficulty: string;
  questionCount: number;
  questions: Question[];
  userAnswers: (string | number)[];
  score?: number;
  timeSpent?: number;
  completedAt?: Date;
  createdAt: Date;
}

export interface UserProgress {
  id?: number;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  averageScore: number;
  timeSpent: number;
  lastStudied: Date;
  streakDays: number;
}

export interface CachedExplanation {
  id?: number;
  questionId: number;
  userAnswer: string;
  explanation: string;
  createdAt: Date;
}

export interface CachedHint {
  id?: number;
  questionId: number;
  hint: string;
  createdAt: Date;
}

export class AppDatabase extends Dexie {
  questions!: Table<Question>;
  quizSessions!: Table<QuizSession>;
  userProgress!: Table<UserProgress>;
  cachedExplanations!: Table<CachedExplanation>;
  cachedHints!: Table<CachedHint>;

  constructor() {
    super('LogistiCareDB');
    
    // Version 1: Initial schema
    this.version(1).stores({
      questions: '++id, topic, difficulty, type, createdAt, lastUsed, bookmarked',
      quizSessions: '++id, topic, createdAt, completedAt',
      userProgress: '++id, topic, lastStudied',
      cachedExplanations: '++id, questionId, createdAt',
      cachedHints: '++id, questionId, createdAt'
    });

    // Version 2: Add compound index for cachedExplanations
    this.version(2).stores({
      questions: '++id, topic, difficulty, type, createdAt, lastUsed, bookmarked',
      quizSessions: '++id, topic, createdAt, completedAt',
      userProgress: '++id, topic, lastStudied',
      cachedExplanations: '++id, questionId, createdAt, [questionId+userAnswer]',
      cachedHints: '++id, questionId, createdAt'
    });
  }
}

export const db = new AppDatabase();

// Database initialization and error handling
export const initializeDatabase = async (): Promise<void> => {
  try {
    await db.open();
  } catch (error) {
    console.error('Database initialization failed:', error);
    // If schema migration fails, we can optionally clear the database
    // This is a last resort for development/testing
    if (error instanceof Error && error.message.includes('Schema')) {
      console.warn('Schema error detected. Consider clearing IndexedDB data.');
    }
    throw error;
  }
};

// Helper functions for database operations
export const dbHelpers = {
  // Questions
  async saveQuestions(questions: Omit<Question, 'id'>[]): Promise<any[]> {
    const questionsWithTimestamp = questions.map(q => ({
      ...q,
      createdAt: new Date(),
      lastUsed: new Date()
    }));
    const result = await db.questions.bulkAdd(questionsWithTimestamp);
    return Array.isArray(result) ? result : [result];
  },

  async getQuestionsByTopic(topic: string, limit = 50): Promise<Question[]> {
    return await db.questions
      .where('topic')
      .equals(topic)
      .limit(limit)
      .toArray();
  },

  async getBookmarkedQuestions(): Promise<Question[]> {
    return await db.questions
      .where('bookmarked')
      .equals(1)
      .toArray();
  },

  async updateQuestionLastUsed(questionId: number): Promise<void> {
    await db.questions.update(questionId, { lastUsed: new Date() });
  },

  async toggleBookmark(questionId: number): Promise<void> {
    const question = await db.questions.get(questionId);
    if (question) {
      await db.questions.update(questionId, { bookmarked: question.bookmarked ? 0 : 1 });
    }
  },

  // Quiz Sessions
  async saveQuizSession(session: Omit<QuizSession, 'id'>): Promise<any> {
    return await db.quizSessions.add({
      ...session,
      createdAt: new Date()
    });
  },

  async getRecentQuizSessions(limit = 10): Promise<QuizSession[]> {
    return await db.quizSessions
      .orderBy('createdAt')
      .reverse()
      .limit(limit)
      .toArray();
  },

  // User Progress
  async updateUserProgress(topic: string, correct: number, total: number, timeSpent: number): Promise<void> {
    const existing = await db.userProgress.where('topic').equals(topic).first();
    
    if (existing) {
      const newTotal = existing.totalQuestions + total;
      const newCorrect = existing.correctAnswers + correct;
      const newTimeSpent = existing.timeSpent + timeSpent;
      const newAverageScore = (newCorrect / newTotal) * 100;
      
      await db.userProgress.update(existing.id!, {
        totalQuestions: newTotal,
        correctAnswers: newCorrect,
        averageScore: newAverageScore,
        timeSpent: newTimeSpent,
        lastStudied: new Date()
      });
    } else {
      await db.userProgress.add({
        topic,
        totalQuestions: total,
        correctAnswers: correct,
        averageScore: (correct / total) * 100,
        timeSpent,
        lastStudied: new Date(),
        streakDays: 1
      });
    }
  },

  async getUserProgress(): Promise<UserProgress[]> {
    return await db.userProgress.toArray();
  },

  // Cached Explanations
  async getCachedExplanation(questionId: number, userAnswer: string): Promise<CachedExplanation | undefined> {
    return await db.cachedExplanations
      .where('[questionId+userAnswer]')
      .equals([questionId, userAnswer])
      .first();
  },

  async saveCachedExplanation(questionId: number, userAnswer: string, explanation: string): Promise<void> {
    await db.cachedExplanations.add({
      questionId,
      userAnswer,
      explanation,
      createdAt: new Date()
    });
  },

  // Cached Hints
  async getCachedHint(questionId: number): Promise<CachedHint | undefined> {
    return await db.cachedHints
      .where('questionId')
      .equals(questionId)
      .first();
  },

  async saveCachedHint(questionId: number, hint: string): Promise<void> {
    await db.cachedHints.add({
      questionId,
      hint,
      createdAt: new Date()
    });
  },

  // Cleanup old data
  async cleanupOldData(): Promise<void> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Clean old cached explanations and hints
    await db.cachedExplanations.where('createdAt').below(oneWeekAgo).delete();
    await db.cachedHints.where('createdAt').below(oneWeekAgo).delete();
    
    // Clean old unused questions (keep bookmarked ones)
    await db.questions
      .where('lastUsed')
      .below(oneWeekAgo)
      .and(q => !q.bookmarked || q.bookmarked === 0)
      .delete();
  }
};