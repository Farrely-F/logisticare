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
} from "@/lib/queries";
import { Question } from "@/lib/db";
import { toast } from "sonner";

const TOPICS = [
  'Manajemen Logistik Rumah Sakit',
  'Sistem Informasi Kesehatan',
  'Manajemen Persediaan Medis',
  'Distribusi Obat dan Alkes',
  'Keselamatan Pasien',
  'Manajemen Kualitas',
  'Regulasi Kesehatan',
  'Farmasi Rumah Sakit'
];

const DIFFICULTIES = [
  { value: 'beginner', label: 'Pemula' },
  { value: 'intermediate', label: 'Menengah' },
  { value: 'advanced', label: 'Lanjutan' },
  { value: 'mixed', label: 'Campuran' }
];

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("Manajemen Logistik Rumah Sakit");
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
  const [quizMode, setQuizMode] = useState<'generate' | 'existing'>('existing');
  const [quizPaused, setQuizPaused] = useState(false);
  const [hasResumedQuiz, setHasResumedQuiz] = useState(false);

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
  
  const { data: existingQuestions = [] } = useRandomQuestionsByTopic(selectedTopic, questionCount);
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
      toast.error("Tidak ada soal tersedia untuk topik ini. Silakan buat soal baru.");
      return;
    }
    
    setQuestions(existingQuestions);
    setUserAnswers(new Array(existingQuestions.length).fill(""));
    toast.success(`${existingQuestions.length} soal berhasil dimuat dari bank soal!`);
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
  }, [quizStarted, quizCompleted, questions, currentQuestion, userAnswers, timeLeft]);

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
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (question.type === "short-answer") {
        // Simple keyword matching for short answers
        const userAnswer = ((userAnswers[index] as string) || "").toLowerCase();
        const correctAnswer = question.correctAnswer.toString().toLowerCase();
        if (
          userAnswer.includes("verifikasi") &&
          userAnswer.includes("pemeriksaan") &&
          userAnswer.includes("pencatatan")
        ) {
          correctAnswers++;
        }
      } else {
        if (userAnswers[index] === question.correctAnswer) {
          correctAnswers++;
        }
      }
    });
    
    const finalScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(finalScore);
    setQuizCompleted(true);

    // Calculate time spent
    const timeSpent = quizStartTime ? Math.floor((new Date().getTime() - quizStartTime.getTime()) / 1000) : 0;

    try {
      // Save quiz session
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

      toast.success("Hasil kuis telah disimpan!");
    } catch (error) {
      console.error("Error saving quiz results:", error);
      toast.error("Gagal menyimpan hasil kuis.");
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
              <span className="font-semibold text-sm sm:text-base">Kembali ke Beranda</span>
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
                <Tabs value={quizMode} onValueChange={(value) => setQuizMode(value as 'generate' | 'existing')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="existing" className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Bank Soal ({questionCountData})
                    </TabsTrigger>
                    <TabsTrigger value="generate" className="flex items-center gap-2">
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
                              <SelectItem key={difficulty.value} value={difficulty.value}>
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
                          Tersedia {questionCountData} soal untuk topik "{selectedTopic}". 
                          Soal akan dipilih secara acak dari bank soal yang ada.
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
                          Soal akan dihasilkan secara otomatis oleh AI berdasarkan topik dan tingkat kesulitan yang dipilih.
                          Proses ini membutuhkan koneksi internet dan mungkin memakan waktu beberapa detik.
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
                <span className="text-center">Progress kuis otomatis tersimpan setiap 30 detik</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600 text-sm sm:text-base">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-center">Tutor AI siap membantu dengan penjelasan detail</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600 text-sm sm:text-base">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-center">Kuis dapat dijeda dan dilanjutkan kapan saja</span>
              </div>
            </div>

            {questions.length === 0 ? (
              <Button
                size="lg"
                onClick={quizMode === 'existing' ? loadExistingQuestions : generateQuestions}
                disabled={
                  (quizMode === 'existing' && questionCountData === 0) ||
                  (quizMode === 'generate' && generateQuestionsMutation.isPending)
                }
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto"
              >
                {quizMode === 'existing' ? (
                  questionCountData === 0 ? (
                    <>
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span>Tidak Ada Soal Tersedia</span>
                    </>
                  ) : (
                    <>
                      <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      <span className="hidden sm:inline">Muat Soal dari Bank Soal</span>
                      <span className="sm:hidden">Muat Soal</span>
                    </>
                  )
                ) : generateQuestionsMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Menghasilkan Soal AI...</span>
                    <span className="sm:hidden">Menghasilkan...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">Hasilkan Soal dengan AI</span>
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
                      {questions.length} soal berhasil {quizMode === 'existing' ? 'dimuat' : 'dihasilkan'}!
                    </span>
                  </div>
                  <p className="text-green-700 mt-1 text-sm sm:text-base">
                    Topik: {selectedTopic} | Kesulitan: {DIFFICULTIES.find(d => d.value === selectedDifficulty)?.label} | Waktu: 30 menit
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

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4 py-8 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
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

            <Card className="mb-8">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  {score}%
                </div>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6">
                  {score >= 80
                    ? "Excellent! Anda siap menghadapi ujian!"
                    : score >= 60
                    ? "Good job! Terus berlatih untuk hasil yang lebih baik."
                    : "Keep practicing! Anda bisa melakukan lebih baik lagi."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                      {Math.round((score / 100) * questions.length)}/
                      {questions.length}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600">Benar</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                      +{score * 10}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600">XP Earned</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">
                      {formatTime(1800 - timeLeft)}
                    </div>
                    <div className="text-sm sm:text-base text-gray-600">Waktu</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-600 to-green-600 w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Coba Lagi
              </Button>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
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
                <span className="font-mono text-xs sm:text-sm">{formatTime(timeLeft)}</span>
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
                <Badge variant="secondary" className="self-start text-xs sm:text-sm">{currentQ.topic}</Badge>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getAIHint}
                    disabled={getHintMutation.isPending}
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
                    disabled={regenerateQuestionMutation.isPending}
                    className="text-xs sm:text-sm"
                  >
                    <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${regenerateQuestionMutation.isPending ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">
                      {regenerateQuestionMutation.isPending ? "Meregenerasi..." : "Regenerasi"}
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
                    disabled={getExplanationMutation.isPending}
                    variant="outline"
                    className="mb-4 bg-transparent"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {getExplanationMutation.isPending ? "Memuat Penjelasan..." : "Minta Penjelasan AI"}
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
              disabled={currentQuestion === 0}
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
              disabled={!selectedAnswer && !shortAnswer}
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
