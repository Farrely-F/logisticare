"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Question {
  id: number;
  type: "multiple-choice" | "true-false" | "short-answer";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  aiHint: string;
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("Manajemen Inventori");
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

  const generateQuestions = async () => {
    setIsGeneratingQuestions(true);
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: selectedTopic,
          count: questionCount,
          difficulty: "mixed",
        }),
      });

      console.log(response);

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();

      console.log(data);
      setQuestions(data.questions);
      setUserAnswers(new Array(data.questions.length).fill(""));
    } catch (error) {
      console.error("Error generating questions:", error);
      alert("Gagal menghasilkan soal. Silakan coba lagi.");
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (quizStarted && !quizCompleted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleQuizComplete();
    }
  }, [quizStarted, quizCompleted, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setUserAnswers(new Array(questions.length).fill(""));
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
      setSelectedAnswer("");
      setShortAnswer("");
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
      setShowExplanation(false);
      setShowHint(false);
    }
  };

  const handleQuizComplete = () => {
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
    setScore(Math.round((correctAnswers / questions.length) * 100));
    setQuizCompleted(true);
  };

  const generateNewQuestion = async () => {
    if (currentQuestion >= 0 && currentQuestion < questions.length) {
      try {
        const response = await fetch("/api/regenerate-question", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            originalQuestion: questions[currentQuestion].question,
            topic: questions[currentQuestion].topic,
            difficulty: questions[currentQuestion].difficulty,
            type: questions[currentQuestion].type,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to regenerate question");
        }

        const data = await response.json();
        const newQuestions = [...questions];
        newQuestions[currentQuestion] = {
          ...data.question,
          id: questions[currentQuestion].id,
        };
        setQuestions(newQuestions);

        // Reset current question state
        setSelectedAnswer("");
        setShortAnswer("");
        setShowExplanation(false);
        setShowHint(false);
      } catch (error) {
        console.error("Error regenerating question:", error);
        alert("Gagal meregenerasi soal. Silakan coba lagi.");
      }
    }
  };

  const getAIExplanation = async () => {
    try {
      const userAnswer =
        questions[currentQuestion].type === "short-answer"
          ? shortAnswer
          : selectedAnswer;

      const response = await fetch("/api/get-explanation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: questions[currentQuestion].question,
          userAnswer: userAnswer,
          correctAnswer: questions[currentQuestion].correctAnswer,
          topic: questions[currentQuestion].topic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI explanation");
      }

      const data = await response.json();

      // Update the current question with AI explanation
      const newQuestions = [...questions];
      newQuestions[currentQuestion].explanation = data.explanation;
      setQuestions(newQuestions);
      setShowExplanation(true);
    } catch (error) {
      console.error("Error getting AI explanation:", error);
      setShowExplanation(true); // Show default explanation as fallback
    }
  };

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Home className="w-5 h-5" />
              <span className="font-semibold">Kembali ke Beranda</span>
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Kuis Logistik Rumah Sakit
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Soal akan dihasilkan secara otomatis oleh AI berdasarkan topik
              yang Anda pilih
            </p>

            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="space-y-6">
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
                        <SelectItem value="Manajemen Inventori">
                          Manajemen Inventori
                        </SelectItem>
                        <SelectItem value="Pengadaan Medis">
                          Pengadaan Medis
                        </SelectItem>
                        <SelectItem value="SOP Logistik">
                          SOP Logistik
                        </SelectItem>
                        <SelectItem value="Distribusi Obat">
                          Distribusi Obat
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <Target className="w-5 h-5" />
                <span>Soal dihasilkan AI berdasarkan kurikulum terkini</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <Lightbulb className="w-5 h-5" />
                <span>Tutor AI siap membantu dengan penjelasan detail</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <Zap className="w-5 h-5" />
                <span>Regenerasi soal otomatis untuk variasi pembelajaran</span>
              </div>
            </div>

            {questions.length === 0 ? (
              <Button
                size="lg"
                onClick={generateQuestions}
                disabled={isGeneratingQuestions}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg px-8 py-3"
              >
                {isGeneratingQuestions ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Menghasilkan Soal AI...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Hasilkan Soal dengan AI
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">
                      {questions.length} soal berhasil dihasilkan!
                    </span>
                  </div>
                  <p className="text-green-700 mt-1">
                    Topik: {selectedTopic} | Waktu: 30 menit
                  </p>
                </div>
                <div className="flex space-x-4 justify-center">
                  <Button
                    size="lg"
                    onClick={handleStartQuiz}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg px-8 py-3"
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Mulai Kuis
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setQuestions([]);
                      setUserAnswers([]);
                    }}
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
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
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                score >= 80
                  ? "bg-green-500"
                  : score >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            >
              {score >= 80 ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : (
                <XCircle className="w-10 h-10 text-white" />
              )}
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Kuis Selesai!
            </h1>

            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  {score}%
                </div>
                <p className="text-xl text-gray-600 mb-6">
                  {score >= 80
                    ? "Excellent! Anda siap menghadapi ujian!"
                    : score >= 60
                    ? "Good job! Terus berlatih untuk hasil yang lebih baik."
                    : "Keep practicing! Anda bisa melakukan lebih baik lagi."}
                </p>

                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {Math.round((score / 100) * questions.length)}/
                      {questions.length}
                    </div>
                    <div className="text-gray-600">Benar</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      +{score * 10}
                    </div>
                    <div className="text-gray-600">XP Earned</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      {formatTime(1800 - timeLeft)}
                    </div>
                    <div className="text-gray-600">Waktu</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-blue-600 to-green-600"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Coba Lagi
              </Button>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                Soal {currentQuestion + 1} dari {questions.length}
              </Badge>
              <Badge
                className={`${
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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{currentQ.topic}</Badge>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHint(!showHint)}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Petunjuk AI
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateNewQuestion}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerasi
                  </Button>
                </div>
              </div>
              <CardTitle className="text-xl leading-relaxed">
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
                    variant="outline"
                    className="mb-4 bg-transparent"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Minta Penjelasan AI
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
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sebelumnya
            </Button>

            <div className="text-sm text-gray-600">
              {currentQuestion + 1} dari {questions.length}
            </div>

            <Button
              onClick={handleNextQuestion}
              disabled={!selectedAnswer && !shortAnswer}
              className="bg-gradient-to-r from-blue-600 to-green-600"
            >
              {currentQuestion === questions.length - 1
                ? "Selesai"
                : "Selanjutnya"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
