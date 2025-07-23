"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Brain,
  RefreshCw,
  HelpCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Home,
  Lightbulb,
  Target,
  Zap,
  Play,
  Pause,
  Database,
  Shuffle,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGenerateQuestions,
  useRegenerateQuestion,
  useGetExplanation,
  useGetHint,
  useSaveQuizSession,
  useUpdateProgress,
  useRandomQuestionsByTopic,
  useQuestionCount,
  useSaveQuizProgress,
  useGetQuizProgress,
  useUpdateQuizProgress,
  useDeleteQuizProgress,
  useEvaluateAnswer,
  useEvaluateQuiz,
} from "@/lib/queries";
import { Question } from "@/lib/db";
import { toast } from "sonner";

const TOPICS = [
  "Manajemen Logistik Rumah Sakit",
  "Sistem Informasi Kesehatan",
  "Manajemen Persediaan Medis",
  "Distribusi Obat dan Alkes",
  "Keselamatan Pasien",
  "Manajemen Kualitas",
  "Regulasi Kesehatan",
  "Farmasi Rumah Sakit",
];

const DIFFICULTIES = [
  { value: "beginner", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Lanjutan" },
  { value: "mixed", label: "Campuran" },
];

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTopic, setSelectedTopic] = useState(
    "Manajemen Logistik Rumah Sakit"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState("mixed");
  const [questionCount, setQuestionCount] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [shortAnswer, setShortAnswer] = useState("");
  const [showExplanation, setShowExplanation] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(string | number)[]>([]);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [quizMode, setQuizMode] = useState<"generate" | "existing">("existing");
  const [quizPaused, setQuizPaused] = useState(false);
  const [hasResumedQuiz, setHasResumedQuiz] = useState(false);
  const [answerEvaluations, setAnswerEvaluations] = useState<any[]>([]);
  const [quizEvaluation, setQuizEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCompletingQuiz, setIsCompletingQuiz] = useState(false);

  // React Query hooks
  const generateQuestionsMutation = useGenerateQuestions();
  const regenerateQuestionMutation = useRegenerateQuestion();
  const getExplanationMutation = useGetExplanation();
  const getHintMutation = useGetHint();
  const saveQuizSessionMutation = useSaveQuizSession();
  const updateProgressMutation = useUpdateProgress();
  const saveQuizProgressMutation = useSaveQuizProgress();
  const updateQuizProgressMutation = useUpdateQuizProgress();
  const deleteQuizProgressMutation = useDeleteQuizProgress();
  const evaluateAnswerMutation = useEvaluateAnswer();
  const evaluateQuizMutation = useEvaluateQuiz();

  const { data: existingQuestions = [] } = useRandomQuestionsByTopic(
    selectedTopic,
    questionCount
  );
  const { data: questionCountData = 0 } = useQuestionCount(selectedTopic);
  const { data: savedProgress } = useGetQuizProgress(selectedTopic);

  // Load saved progress on component mount
  useEffect(() => {
    if (savedProgress && !hasResumedQuiz) {
      const shouldResume = confirm(
        `Ditemukan kuis yang belum selesai untuk topik "${selectedTopic}". Apakah Anda ingin melanjutkan?`
      );

      if (shouldResume) {
        setQuestions(savedProgress.questions);
        setCurrentQuestion(savedProgress.currentQuestionIndex);
        setUserAnswers(savedProgress.userAnswers);
        setTimeLeft(savedProgress.timeLeft);
        setQuizStartTime(new Date(savedProgress.createdAt));
        setQuizStarted(true);
        setHasResumedQuiz(true);
        toast.success("Kuis berhasil dilanjutkan!");
      } else {
        // Delete the saved progress if user chooses not to resume
        if (savedProgress.id) {
          deleteQuizProgressMutation.mutate(selectedTopic);
        }
      }
    }
  }, [savedProgress, hasResumedQuiz]);

  const generateQuestions = async () => {
    try {
      const result = await generateQuestionsMutation.mutateAsync({
        topic: selectedTopic,
        count: questionCount,
        difficulty: selectedDifficulty,
      });

      setQuestions(result.questions);
      setUserAnswers(new Array(result.questions.length).fill(""));
      toast.success("Soal berhasil dibuat!");
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error("Gagal menghasilkan soal. Silakan coba lagi.");
    }
  };

  const loadExistingQuestions = () => {
    if (existingQuestions.length === 0) {
      toast.error(
        "Tidak ada soal tersedia untuk topik ini. Silakan buat soal baru."
      );
      return;
    }

    setQuestions(existingQuestions);
    setUserAnswers(new Array(existingQuestions.length).fill(""));
    toast.success(
      `${existingQuestions.length} soal berhasil dimuat dari bank soal!`
    );
  };

  // Timer effect
  useEffect(() => {
    if (quizStarted && !quizCompleted && !quizPaused && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleQuizComplete();
    }
  }, [quizStarted, quizCompleted, quizPaused, timeLeft]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (quizStarted && !quizCompleted && questions.length > 0) {
      const autoSave = setInterval(() => {
        saveQuizProgress();
      }, 30000); // Save every 30 seconds

      return () => clearInterval(autoSave);
    }
  }, [
    quizStarted,
    quizCompleted,
    questions,
    currentQuestion,
    userAnswers,
    timeLeft,
  ]);

  const saveQuizProgress = async () => {
    if (!quizStartTime || questions.length === 0) return;

    try {
      const progressData = {
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        questionCount: questions.length,
        questions,
        userAnswers,
        currentQuestionIndex: currentQuestion,
        timeLeft,
        createdAt: new Date(),
        lastUpdated: new Date(),
      };

      if (savedProgress?.id) {
        await updateQuizProgressMutation.mutateAsync({
          progressId: savedProgress.id,
          updates: progressData,
        });
      } else {
        await saveQuizProgressMutation.mutateAsync(progressData);
      }
    } catch (error) {
      console.error("Error saving quiz progress:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setQuizStartTime(new Date());
    setUserAnswers(new Array(questions.length).fill(""));
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setShortAnswer("");
  };

  const handlePauseQuiz = async () => {
    setQuizPaused(!quizPaused);
    if (!quizPaused) {
      await saveQuizProgress();
      toast.success("Kuis dijeda dan progress disimpan");
    } else {
      toast.success("Kuis dilanjutkan");
    }
  };

  const handleAnswerSelect = (answer: string | number) => {
    if (questions[currentQuestion].type === "short-answer") {
      setShortAnswer(answer as string);
    } else {
      setSelectedAnswer(answer as string);
    }

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer((userAnswers[currentQuestion + 1] as string) || "");
      setShortAnswer((userAnswers[currentQuestion + 1] as string) || "");
      setShowExplanation(false);
      setShowHint(false);
    } else {
      handleQuizComplete();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedAnswer((userAnswers[currentQuestion - 1] as string) || "");
      setShortAnswer((userAnswers[currentQuestion - 1] as string) || "");
      setShowExplanation(false);
      setShowHint(false);
    }
  };

  const handleQuizComplete = async () => {
    setIsCompletingQuiz(true);
    setIsEvaluating(true);

    try {
      // Evaluate each answer using AI
      const evaluations = [];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const userAnswer = userAnswers[i];

        // Convert user answer to proper format for AI evaluation
        let formattedUserAnswer = "";
        if (question.type === "multiple-choice" && question.options) {
          // Convert index to actual option text
          const answerIndex = parseInt(userAnswer?.toString() || "-1");
          formattedUserAnswer =
            answerIndex >= 0 && answerIndex < question.options.length
              ? question.options[answerIndex]
              : userAnswer?.toString() || "";
        } else {
          formattedUserAnswer = userAnswer?.toString() || "";
        }

        const evaluation = await evaluateAnswerMutation.mutateAsync({
          question: question.question,
          userAnswer: formattedUserAnswer,
          correctAnswer: question.correctAnswer.toString(),
          topic: question.topic,
          questionType: question.type,
        });

        evaluations.push(evaluation.evaluation);
      }

      setAnswerEvaluations(evaluations);

      // Calculate overall score from AI evaluations
      const totalScore = evaluations.reduce(
        (sum, evaluation) => sum + evaluation.score,
        0
      );
      const finalScore = Math.round(totalScore / evaluations.length);
      setScore(finalScore);

      // Calculate time spent
      const timeSpent = quizStartTime
        ? Math.floor((new Date().getTime() - quizStartTime.getTime()) / 1000)
        : 0;

      // Get comprehensive quiz evaluation
      const quizEval = await evaluateQuizMutation.mutateAsync({
        questions,
        userAnswers,
        evaluations,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        timeSpent,
        totalQuestions: questions.length,
      });

      setQuizEvaluation(quizEval.evaluation);
      setQuizCompleted(true);

      // Count correct answers for progress tracking
      const correctAnswers = evaluations.filter(
        (evaluation) => evaluation.isCorrect
      ).length;

      // Save quiz session with AI evaluations
      await saveQuizSessionMutation.mutateAsync({
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        questionCount: questions.length,
        questions,
        userAnswers,
        score: finalScore,
        timeSpent,
        createdAt: new Date(),
        completedAt: new Date(),
      });

      // Update user progress
      await updateProgressMutation.mutateAsync({
        topic: selectedTopic,
        correct: correctAnswers,
        total: questions.length,
        timeSpent,
      });

      // Delete saved progress since quiz is completed
      if (savedProgress?.id) {
        await deleteQuizProgressMutation.mutateAsync(selectedTopic);
      }

      toast.success("Kuis selesai! Evaluasi AI telah dibuat.");
    } catch (error) {
      console.error("Error evaluating quiz:", error);
      toast.error("Gagal mengevaluasi kuis. Silakan coba lagi.");
    } finally {
      setIsEvaluating(false);
      setIsCompletingQuiz(false);
    }
  };

  const generateNewQuestion = async () => {
    if (currentQuestion >= 0 && currentQuestion < questions.length) {
      try {
        const result = await regenerateQuestionMutation.mutateAsync({
          originalQuestion: questions[currentQuestion].question,
          topic: questions[currentQuestion].topic,
          difficulty: questions[currentQuestion].difficulty,
          type: questions[currentQuestion].type,
        });

        const newQuestions = [...questions];
        newQuestions[currentQuestion] = {
          ...result.question,
          id: questions[currentQuestion].id,
        };
        setQuestions(newQuestions);

        // Reset current question state
        setSelectedAnswer("");
        setShortAnswer("");
        setShowExplanation(false);
        setShowHint(false);

        toast.success("Soal berhasil diregenerasi!");
      } catch (error) {
        console.error("Error regenerating question:", error);
        toast.error("Gagal meregenerasi soal. Silakan coba lagi.");
      }
    }
  };

  const getAIExplanation = async () => {
    try {
      const userAnswer =
        questions[currentQuestion].type === "short-answer"
          ? shortAnswer
          : selectedAnswer;

      const result = await getExplanationMutation.mutateAsync({
        question: questions[currentQuestion].question,
        userAnswer,
        correctAnswer: questions[currentQuestion].correctAnswer.toString(),
        topic: questions[currentQuestion].topic,
        questionId: questions[currentQuestion].id,
      });

      // Update the question with the new explanation
      const newQuestions = [...questions];
      newQuestions[currentQuestion] = {
        ...newQuestions[currentQuestion],
        explanation: result.explanation,
      };
      setQuestions(newQuestions);
      setShowExplanation(true);

      toast.success("Penjelasan AI berhasil dimuat!");
    } catch (error) {
      console.error("Error getting AI explanation:", error);
      toast.error("Gagal mendapatkan penjelasan AI.");
    }
  };

  const getAIHint = async () => {
    try {
      const result = await getHintMutation.mutateAsync({
        question: questions[currentQuestion].question,
        topic: questions[currentQuestion].topic,
        questionId: questions[currentQuestion].id,
      });

      // Update the question with the new hint
      const newQuestions = [...questions];
      newQuestions[currentQuestion] = {
        ...newQuestions[currentQuestion],
        aiHint: result.hint,
      };
      setQuestions(newQuestions);
      setShowHint(true);

      toast.success("Petunjuk AI berhasil dimuat!");
    } catch (error) {
      console.error("Error getting AI hint:", error);
      toast.error("Gagal mendapatkan petunjuk AI.");
    }
  };

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold text-sm sm:text-base">
                Kembali ke Beranda
              </span>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Kuis Logistik Rumah Sakit
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8">
              Pilih soal dari bank soal yang ada atau buat soal baru dengan AI
            </p>

            <Card className="mb-8">
              <CardContent className="p-6">
                <Tabs
                  value={quizMode}
                  onValueChange={(value) =>
                    setQuizMode(value as "generate" | "existing")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger
                      value="existing"
                      className="flex items-center gap-2"
                    >
                      <Database className="w-4 h-4" />
                      Bank Soal ({questionCountData})
                    </TabsTrigger>
                    <TabsTrigger
                      value="generate"
                      className="flex items-center gap-2"
                    >
                      <Brain className="w-4 h-4" />
                      Buat Baru
                    </TabsTrigger>
                  </TabsList>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pilih Topik
                        </label>
                        <Select
                          value={selectedTopic}
                          onValueChange={setSelectedTopic}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TOPICS.map((topic) => (
                              <SelectItem key={topic} value={topic}>
                                {topic}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tingkat Kesulitan
                        </label>
                        <Select
                          value={selectedDifficulty}
                          onValueChange={setSelectedDifficulty}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DIFFICULTIES.map((difficulty) => (
                              <SelectItem
                                key={difficulty.value}
                                value={difficulty.value}
                              >
                                {difficulty.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jumlah Soal
                      </label>
                      <Select
                        value={questionCount.toString()}
                        onValueChange={(value) =>
                          setQuestionCount(Number.parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Soal</SelectItem>
                          <SelectItem value="10">10 Soal</SelectItem>
                          <SelectItem value="15">15 Soal</SelectItem>
                          <SelectItem value="20">20 Soal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <TabsContent value="existing" className="mt-0">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-800 mb-2">
                          <Database className="w-5 h-5" />
                          <span className="font-semibold">Bank Soal</span>
                        </div>
                        <p className="text-blue-700 text-sm">
                          Tersedia {questionCountData} soal untuk topik "
                          {selectedTopic}". Soal akan dipilih secara acak dari
                          bank soal yang ada.
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="generate" className="mt-0">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-green-800 mb-2">
                          <Brain className="w-5 h-5" />
                          <span className="font-semibold">AI Generator</span>
                        </div>
                        <p className="text-green-700 text-sm">
                          Soal akan dihasilkan secara otomatis oleh AI
                          berdasarkan topik dan tingkat kesulitan yang dipilih.
                          Proses ini membutuhkan koneksi internet dan mungkin
                          memakan waktu beberapa detik.
                        </p>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            <div className="space-y-3 sm:space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2 text-gray-600 text-sm sm:text-base">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-center">
                  Progress kuis otomatis tersimpan setiap 30 detik
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600 text-sm sm:text-base">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-center">
                  Tutor AI siap membantu dengan penjelasan detail
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600 text-sm sm:text-base">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-center">
                  Kuis dapat dijeda dan dilanjutkan kapan saja
                </span>
              </div>
            </div>

            {questions.length === 0 ? (
              <Button
                size="lg"
                onClick={
                  quizMode === "existing"
                    ? loadExistingQuestions
                    : generateQuestions
                }
                disabled={
                  (quizMode === "existing" && questionCountData === 0) ||
                  (quizMode === "generate" &&
                    generateQuestionsMutation.isPending)
                }
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto"
              >
                {quizMode === "existing" ? (
                  questionCountData === 0 ? (
                    <>
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span>Tidak Ada Soal Tersedia</span>
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="hidden sm:inline">
                        Muat Soal dari Bank Soal
                      </span>
                      <span className="sm:hidden">Muat Soal</span>
                    </>
                  )
                ) : generateQuestionsMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    <span className="hidden sm:inline">
                      Menghasilkan Soal AI...
                    </span>
                    <span className="sm:hidden">Menghasilkan...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">
                      Hasilkan Soal dengan AI
                    </span>
                    <span className="sm:hidden">Hasilkan Soal</span>
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-semibold text-sm sm:text-base">
                      {questions.length} soal berhasil{" "}
                      {quizMode === "existing" ? "dimuat" : "dihasilkan"}!
                    </span>
                  </div>
                  <p className="text-green-700 mt-1 text-sm sm:text-base">
                    Topik: {selectedTopic} | Kesulitan:{" "}
                    {
                      DIFFICULTIES.find((d) => d.value === selectedDifficulty)
                        ?.label
                    }{" "}
                    | Waktu: 30 menit
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
                  <Button
                    size="lg"
                    onClick={handleStartQuiz}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto"
                  >
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Mulai Kuis
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setQuestions([]);
                      setUserAnswers([]);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Buat Ulang
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (quizCompleted || isCompletingQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                  score >= 80
                    ? "bg-green-500"
                    : score >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              >
                {score >= 80 ? (
                  <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                ) : (
                  <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Kuis Selesai!
              </h1>

              {(isEvaluating || (isCompletingQuiz && !quizCompleted)) && (
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-blue-800 font-semibold text-lg">
                        AI sedang mengevaluasi jawaban Anda...
                      </span>
                    </div>
                    <div className="text-center text-gray-600">
                      Mohon tunggu sebentar, proses ini biasanya memakan waktu
                      beberapa detik
                    </div>
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-blue-700 text-center">
                        💡 AI sedang menganalisis setiap jawaban Anda untuk
                        memberikan feedback yang akurat dan personal
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* AI Evaluation Results */}
            {quizEvaluation && (
              <>
                {/* Score Overview */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                        {score}%
                      </div>
                      {quizEvaluation && (
                        <p className="text-lg text-gray-600 mb-4">
                          {quizEvaluation.motivationalMessage}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                          {
                            answerEvaluations.filter(
                              (evaluation) => evaluation.isCorrect
                            ).length
                          }
                          /{questions.length}
                        </div>
                        <div className="text-sm sm:text-base text-gray-600">
                          Benar
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                          +{score * 10}
                        </div>
                        <div className="text-sm sm:text-base text-gray-600">
                          XP Earned
                        </div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">
                          {formatTime(1800 - timeLeft)}
                        </div>
                        <div className="text-sm sm:text-base text-gray-600">
                          Waktu
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Performance Analysis */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <span>Analisis Performa AI</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Strengths and Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Kekuatan Anda
                        </h4>
                        <ul className="space-y-2">
                          {quizEvaluation.strengths.map(
                            (strength: string, index: number) => (
                              <li
                                key={index}
                                className="text-sm text-green-700 flex items-start"
                              >
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {strength}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          Area Perbaikan
                        </h4>
                        <ul className="space-y-2">
                          {quizEvaluation.weaknesses.map(
                            (weakness: string, index: number) => (
                              <li
                                key={index}
                                className="text-sm text-red-700 flex items-start"
                              >
                                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {weakness}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Performance by Category */}
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-4">
                        Performa per Kategori
                      </h4>
                      <div className="space-y-3">
                        {quizEvaluation.performance.excellent.length > 0 && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h5 className="font-medium text-green-800 mb-2">
                              Excellent (90-100%)
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {quizEvaluation.performance.excellent.map(
                                (topic: string, index: number) => (
                                  <Badge
                                    key={index}
                                    className="bg-green-100 text-green-800"
                                  >
                                    {topic}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}
                        {quizEvaluation.performance.good.length > 0 && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h5 className="font-medium text-yellow-800 mb-2">
                              Good (70-89%)
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {quizEvaluation.performance.good.map(
                                (topic: string, index: number) => (
                                  <Badge
                                    key={index}
                                    className="bg-yellow-100 text-yellow-800"
                                  >
                                    {topic}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}
                        {quizEvaluation.performance.needsImprovement.length >
                          0 && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <h5 className="font-medium text-red-800 mb-2">
                              Needs Improvement (&lt;70%)
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {quizEvaluation.performance.needsImprovement.map(
                                (topic: string, index: number) => (
                                  <Badge
                                    key={index}
                                    className="bg-red-100 text-red-800"
                                  >
                                    {topic}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Recommendations */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      <span>Rekomendasi Pembelajaran</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Topik Prioritas
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {quizEvaluation.learningRecommendations.priorityTopics.map(
                          (topic: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="border-blue-300 text-blue-700"
                            >
                              {topic}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Rencana Belajar
                      </h4>
                      <ul className="space-y-2">
                        {quizEvaluation.learningRecommendations.studyPlan.map(
                          (step: string, index: number) => (
                            <li
                              key={index}
                              className="text-sm text-gray-700 flex items-start"
                            >
                              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                {index + 1}
                              </span>
                              {step}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">
                        Sumber Belajar
                      </h4>
                      <ul className="space-y-2">
                        {quizEvaluation.learningRecommendations.resources.map(
                          (resource: string, index: number) => (
                            <li
                              key={index}
                              className="text-sm text-gray-700 flex items-start"
                            >
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {resource}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Langkah Selanjutnya
                      </h4>
                      <p className="text-blue-800">
                        {quizEvaluation.nextSteps}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Detailed Answer Review */}
            {answerEvaluations.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span>Review Jawaban Detail</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {questions.map((question, index) => {
                      const evaluation = answerEvaluations[index];
                      if (!evaluation) return null;

                      return (
                        <div
                          key={index}
                          className={`p-4 border rounded-lg ${
                            evaluation.isCorrect
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium text-gray-900 flex-1">
                              {index + 1}. {question.question}
                            </h5>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge
                                className={
                                  evaluation.isCorrect
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {evaluation.score}/100
                              </Badge>
                              {evaluation.isCorrect ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">
                                Jawaban Anda:{" "}
                              </span>
                              <span className="text-gray-600">
                                {(() => {
                                  const userAnswer = userAnswers[index];
                                  if (!userAnswer && userAnswer !== 0)
                                    return "Tidak dijawab";

                                  if (
                                    question.type === "multiple-choice" &&
                                    question.options
                                  ) {
                                    const answerIndex = parseInt(
                                      userAnswer.toString()
                                    );
                                    return answerIndex >= 0 &&
                                      answerIndex < question.options.length
                                      ? question.options[answerIndex]
                                      : userAnswer.toString();
                                  }

                                  return userAnswer.toString();
                                })()}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Jawaban Benar:{" "}
                              </span>
                              <span className="text-gray-600">
                                {question.correctAnswer.toString()}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Feedback AI:{" "}
                              </span>
                              <span className="text-gray-600">
                                {evaluation.feedback}
                              </span>
                            </div>
                            {evaluation.keyPoints &&
                              evaluation.keyPoints.length > 0 && (
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Poin Kunci:{" "}
                                  </span>
                                  <ul className="list-disc list-inside text-gray-600 ml-4">
                                    {evaluation.keyPoints.map(
                                      (point: string, pointIndex: number) => (
                                        <li key={pointIndex}>{point}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => window.location.reload()}
                disabled={isEvaluating || isCompletingQuiz}
                className="bg-gradient-to-r from-blue-600 to-green-600 w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Coba Lagi
              </Button>
              <Link href="/reading-materials">
                <Button
                  size="lg"
                  variant="outline"
                  disabled={isEvaluating || isCompletingQuiz}
                  className="w-full sm:w-auto"
                >
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Baca Materi
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  disabled={isEvaluating || isCompletingQuiz}
                  className="w-full sm:w-auto"
                >
                  Kembali ke Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
              <Badge variant="outline" className="text-xs sm:text-sm">
                Soal {currentQuestion + 1} dari {questions.length}
              </Badge>
              <Badge
                className={`text-xs sm:text-sm ${
                  currentQ.difficulty === "easy"
                    ? "bg-green-100 text-green-800"
                    : currentQ.difficulty === "medium"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {currentQ.difficulty === "easy"
                  ? "Mudah"
                  : currentQ.difficulty === "medium"
                  ? "Sedang"
                  : "Sulit"}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-mono text-xs sm:text-sm">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <Progress value={progress} className="h-1.5 sm:h-2" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <Badge
                  variant="secondary"
                  className="self-start text-xs sm:text-sm"
                >
                  {currentQ.topic}
                </Badge>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getAIHint}
                    disabled={getHintMutation.isPending || isCompletingQuiz}
                    className="text-xs sm:text-sm"
                  >
                    <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">
                      {getHintMutation.isPending ? "Memuat..." : "Petunjuk AI"}
                    </span>
                    <span className="sm:hidden">
                      {getHintMutation.isPending ? "..." : "Petunjuk"}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateNewQuestion}
                    disabled={
                      regenerateQuestionMutation.isPending || isCompletingQuiz
                    }
                    className="text-xs sm:text-sm"
                  >
                    <RefreshCw
                      className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${
                        regenerateQuestionMutation.isPending
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    <span className="hidden sm:inline">
                      {regenerateQuestionMutation.isPending
                        ? "Meregenerasi..."
                        : "Regenerasi"}
                    </span>
                    <span className="sm:hidden">
                      {regenerateQuestionMutation.isPending ? "..." : "Regen"}
                    </span>
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg sm:text-xl leading-relaxed">
                {currentQ.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showHint && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">
                        Petunjuk AI:
                      </h4>
                      <p className="text-blue-800">{currentQ.aiHint}</p>
                    </div>
                  </div>
                </div>
              )}

              {currentQ.type === "multiple-choice" && (
                <RadioGroup
                  value={selectedAnswer}
                  onValueChange={handleAnswerSelect}
                >
                  <div className="space-y-3">
                    {currentQ.options?.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={index.toString()}
                          id={`option-${index}`}
                        />
                        <Label
                          htmlFor={`option-${index}`}
                          className="flex-1 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentQ.type === "true-false" && (
                <RadioGroup
                  value={selectedAnswer}
                  onValueChange={handleAnswerSelect}
                >
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="true" />
                      <Label
                        htmlFor="true"
                        className="flex-1 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
                      >
                        Benar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="false" />
                      <Label
                        htmlFor="false"
                        className="flex-1 cursor-pointer p-3 rounded-lg hover:bg-gray-50"
                      >
                        Salah
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              )}

              {currentQ.type === "short-answer" && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Ketik jawaban Anda di sini..."
                    value={shortAnswer}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-gray-600">
                    Tip: Berikan jawaban yang jelas dan spesifik
                  </p>
                </div>
              )}

              {(selectedAnswer || shortAnswer) && (
                <div className="mt-6">
                  <Button
                    onClick={getAIExplanation}
                    disabled={
                      getExplanationMutation.isPending || isCompletingQuiz
                    }
                    variant="outline"
                    className="mb-4 bg-transparent"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {getExplanationMutation.isPending
                      ? "Memuat Penjelasan..."
                      : "Minta Penjelasan AI"}
                  </Button>

                  {showExplanation && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">
                        Penjelasan:
                      </h4>
                      <p className="text-green-800">{currentQ.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <Button
              variant="outline"
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0 || isCompletingQuiz}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">Sebelumnya</span>
            </Button>

            <div className="text-xs sm:text-sm text-gray-600 order-1 sm:order-2">
              {currentQuestion + 1} dari {questions.length}
            </div>

            <Button
              onClick={handleNextQuestion}
              disabled={
                (!selectedAnswer && !shortAnswer) ||
                isEvaluating ||
                isCompletingQuiz
              }
              className="bg-gradient-to-r from-blue-600 to-green-600 w-full sm:w-auto order-3"
            >
              <span className="text-sm sm:text-base">
                {currentQuestion === questions.length - 1
                  ? "Selesai"
                  : "Selanjutnya"}
              </span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
