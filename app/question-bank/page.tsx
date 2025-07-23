"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Filter,
  BookOpen,
  Brain,
  Star,
  Clock,
  Target,
  Home,
  RefreshCw,
  Lightbulb,
  Package,
  ClipboardList,
  Hospital,
  FileText,
} from "lucide-react"
import Link from "next/link"

interface Question {
  id: number
  type: "multiple-choice" | "true-false" | "short-answer"
  topic: string
  difficulty: "easy" | "medium" | "hard"
  question: string
  options?: string[]
  correctAnswer: string | number
  explanation: string
  tags: string[]
  bookmarked: boolean
}

export default function QuestionBankPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [showAnswers, setShowAnswers] = useState<number[]>([])

  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    setIsLoading(true)
    try {
      // Load questions for all topics
      const topics = ["Manajemen Inventori", "Pengadaan Medis", "SOP Logistik", "Distribusi Obat"]
      const allQuestions: Question[] = []

      for (const topic of topics) {
        const response = await fetch("/api/generate-questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: topic,
            count: 5,
            difficulty: "mixed",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          allQuestions.push(
            ...data.questions.map((q: any, index: number) => ({
              ...q,
              id: allQuestions.length + index + 1,
              bookmarked: Math.random() > 0.7, // Random bookmarks for demo
            })),
          )
        }
      }

      setQuestions(allQuestions)
    } catch (error) {
      console.error("Error loading questions:", error)
      // Fallback to empty array
      setQuestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const generateMoreQuestions = async (topic: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic,
          count: 3,
          difficulty: "mixed",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newQuestions = data.questions.map((q: any, index: number) => ({
          ...q,
          id: questions.length + index + 1,
          bookmarked: false,
        }))
        setQuestions((prev) => [...prev, ...newQuestions])
      }
    } catch (error) {
      console.error("Error generating more questions:", error)
      alert("Gagal menghasilkan soal baru. Silakan coba lagi.")
    } finally {
      setIsGenerating(false)
    }
  }

  const topics = [
    { value: "all", label: "Semua Topik", icon: BookOpen },
    { value: "Manajemen Inventori", label: "Manajemen Inventori", icon: Package },
    { value: "Pengadaan Medis", label: "Pengadaan Medis", icon: ClipboardList },
    { value: "SOP Logistik", label: "SOP Logistik", icon: FileText },
    { value: "Distribusi Obat", label: "Distribusi Obat", icon: Hospital },
  ]

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesTopic = selectedTopic === "all" || question.topic === selectedTopic
    const matchesDifficulty = selectedDifficulty === "all" || question.difficulty === selectedDifficulty
    const matchesType = selectedType === "all" || question.type === selectedType

    return matchesSearch && matchesTopic && matchesDifficulty && matchesType
  })

  const bookmarkedQuestions = questions.filter((question) => question.bookmarked)

  const toggleAnswer = (questionId: number) => {
    setShowAnswers((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
  }

  const toggleBookmark = (questionId: number) => {
    // In a real app, this would update the backend
    console.log(`Toggling bookmark for question ${questionId}`)
  }

  const generateVariation = async (questionId: number) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return

    try {
      const response = await fetch("/api/regenerate-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalQuestion: question.question,
          topic: question.topic,
          difficulty: question.difficulty,
          type: question.type,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to regenerate question")
      }

      const data = await response.json()
      
      // Update the question in the list
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...data.question, id: questionId, bookmarked: q.bookmarked }
          : q
      ))
      
      alert("Variasi soal berhasil dihasilkan! 🤖")
    } catch (error) {
      console.error("Error generating question variation:", error)
      alert("Gagal menghasilkan variasi soal. Silakan coba lagi.")
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "multiple-choice":
        return Target
      case "true-false":
        return Clock
      case "short-answer":
        return FileText
      default:
        return BookOpen
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-semibold text-sm sm:text-base">LogistiCare Prep</span>
              </Link>
              <Badge variant="secondary" className="hidden sm:inline-flex">Bank Soal</Badge>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/quiz">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 text-xs sm:text-sm px-3 sm:px-4 py-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Mulai Kuis</span>
                  <span className="sm:hidden">Kuis</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Bank Soal Logistik Rumah Sakit</h1>
          <p className="text-sm sm:text-base text-gray-600">Koleksi lengkap soal-soal untuk persiapan ujian dengan fitur AI</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Cari soal atau kata kunci..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>

              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Topik" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic: { value: string; label: string; icon: any }) => (
                    <SelectItem key={topic.value} value={topic.value}>
                      <div className="flex items-center space-x-2">
                        <topic.icon className="w-4 h-4" />
                        <span>{topic.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Tingkat Kesulitan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkat</SelectItem>
                  <SelectItem value="easy">Mudah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="hard">Sulit</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Jenis Soal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="multiple-choice">Pilihan Ganda</SelectItem>
                  <SelectItem value="true-false">Benar/Salah</SelectItem>
                  <SelectItem value="short-answer">Jawaban Singkat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <p className="text-sm sm:text-base text-gray-600">
              Menampilkan {filteredQuestions.length} dari {questions.length} soal
            </p>
            <Button
              onClick={() => generateMoreQuestions(selectedTopic === "all" ? "Manajemen Inventori" : selectedTopic)}
              disabled={isGenerating}
              variant="outline"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                  <span className="sm:hidden">Membuat...</span>
                </>
              ) : (
                <>
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Hasilkan Soal Baru</span>
                  <span className="sm:hidden">Buat Soal</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Menghasilkan Bank Soal dengan AI</h3>
            <p className="text-gray-600">Mohon tunggu, AI sedang membuat soal-soal berkualitas untuk Anda...</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm py-2">Semua Soal</TabsTrigger>
              <TabsTrigger value="bookmarked" className="text-xs sm:text-sm py-2">Favorit</TabsTrigger>
              <TabsTrigger value="by-topic" className="text-xs sm:text-sm py-2">Per Topik</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 sm:space-y-4">
              {filteredQuestions.map((question: Question) => {
                const TypeIcon = getTypeIcon(question.type)
                const isAnswerShown = showAnswers.includes(question.id)

                return (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                          <TypeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                          <Badge variant="outline" className="text-xs">{question.topic}</Badge>
                          <Badge className={`${getDifficultyColor(question.difficulty)} text-xs`}>
                            {question.difficulty === "easy"
                              ? "Mudah"
                              : question.difficulty === "medium"
                                ? "Sedang"
                                : "Sulit"}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => toggleBookmark(question.id)} className="p-1 sm:p-2">
                            <Star
                              className={`w-3 h-3 sm:w-4 sm:h-4 ${question.bookmarked ? "fill-yellow-400 text-yellow-400" : ""}`}
                            />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => generateVariation(question.id)} className="p-1 sm:p-2">
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-sm sm:text-base lg:text-lg leading-relaxed">{question.question}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {question.type === "multiple-choice" && question.options && (
                        <div className="space-y-2 mb-4">
                          {question.options.map((option: string, index: number) => (
                            <div
                              key={index}
                              className={`p-2 sm:p-3 rounded-lg border text-sm sm:text-base ${
                                isAnswerShown && index === question.correctAnswer
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                              {option}
                              {isAnswerShown && index === question.correctAnswer && (
                                <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Benar</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "true-false" && (
                        <div className="space-y-2 mb-4">
                          <div
                            className={`p-2 sm:p-3 rounded-lg border text-sm sm:text-base ${
                              isAnswerShown && question.correctAnswer === "true"
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <span className="font-medium mr-2">A.</span>
                            Benar
                            {isAnswerShown && question.correctAnswer === "true" && (
                              <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Benar</Badge>
                            )}
                          </div>
                          <div
                            className={`p-2 sm:p-3 rounded-lg border text-sm sm:text-base ${
                              isAnswerShown && question.correctAnswer === "false"
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <span className="font-medium mr-2">B.</span>
                            Salah
                            {isAnswerShown && question.correctAnswer === "false" && (
                              <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Benar</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {question.type === "short-answer" && isAnswerShown && (
                        <div className="mb-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-1 text-sm sm:text-base">Jawaban:</h4>
                          <p className="text-green-800 text-sm sm:text-base">{question.correctAnswer}</p>
                        </div>
                      )}

                      {isAnswerShown && (
                        <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Penjelasan:</h4>
                              <p className="text-blue-800 text-sm sm:text-base">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-1">
                          {question.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => toggleAnswer(question.id)} className="text-xs sm:text-sm w-full sm:w-auto">
                          <span className="hidden sm:inline">{isAnswerShown ? "Sembunyikan" : "Lihat"} Jawaban</span>
                          <span className="sm:hidden">{isAnswerShown ? "Tutup" : "Jawaban"}</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="bookmarked" className="space-y-3 sm:space-y-4">
              {bookmarkedQuestions.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Star className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Belum ada soal favorit</h3>
                  <p className="text-sm sm:text-base text-gray-600">Tandai soal sebagai favorit untuk melihatnya di sini</p>
                </div>
              ) : (
                bookmarkedQuestions.map((question: Question) => {
                  const TypeIcon = getTypeIcon(question.type)
                  const isAnswerShown = showAnswers.includes(question.id)

                  return (
                    <Card key={question.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                            <TypeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                            <Badge variant="outline" className="text-xs">{question.topic}</Badge>
                            <Badge className={`${getDifficultyColor(question.difficulty)} text-xs`}>
                              {question.difficulty === "easy"
                                ? "Mudah"
                                : question.difficulty === "medium"
                                  ? "Sedang"
                                  : "Sulit"}
                            </Badge>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => toggleBookmark(question.id)} className="p-1 sm:p-2">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => generateVariation(question.id)} className="p-1 sm:p-2">
                              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                        <CardTitle className="text-sm sm:text-base lg:text-lg leading-relaxed">{question.question}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {question.type === "multiple-choice" && question.options && (
                          <div className="space-y-2 mb-4">
                            {question.options.map((option: string, index: number) => (
                              <div
                                key={index}
                                className={`p-2 sm:p-3 rounded-lg border text-sm sm:text-base ${
                                  isAnswerShown && index === question.correctAnswer
                                    ? "bg-green-50 border-green-200"
                                    : "bg-gray-50 border-gray-200"
                                }`}
                              >
                                <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                                {option}
                                {isAnswerShown && index === question.correctAnswer && (
                                  <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Benar</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.type === "true-false" && (
                          <div className="space-y-2 mb-4">
                            <div
                              className={`p-2 sm:p-3 rounded-lg border text-sm sm:text-base ${
                                isAnswerShown && question.correctAnswer === "true"
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <span className="font-medium mr-2">A.</span>
                              Benar
                              {isAnswerShown && question.correctAnswer === "true" && (
                                <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Benar</Badge>
                              )}
                            </div>
                            <div
                              className={`p-2 sm:p-3 rounded-lg border text-sm sm:text-base ${
                                isAnswerShown && question.correctAnswer === "false"
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <span className="font-medium mr-2">B.</span>
                              Salah
                              {isAnswerShown && question.correctAnswer === "false" && (
                                <Badge className="ml-2 bg-green-100 text-green-800 text-xs">Benar</Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {question.type === "short-answer" && isAnswerShown && (
                          <div className="mb-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-green-900 mb-1 text-sm sm:text-base">Jawaban:</h4>
                            <p className="text-green-800 text-sm sm:text-base">{question.correctAnswer}</p>
                          </div>
                        )}

                        {isAnswerShown && (
                          <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Penjelasan:</h4>
                                <p className="text-blue-800 text-sm sm:text-base">{question.explanation}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-1">
                            {question.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => toggleAnswer(question.id)} className="text-xs sm:text-sm w-full sm:w-auto">
                            <span className="hidden sm:inline">{isAnswerShown ? "Sembunyikan" : "Lihat"} Jawaban</span>
                            <span className="sm:hidden">{isAnswerShown ? "Tutup" : "Jawaban"}</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            <TabsContent value="by-topic" className="space-y-4 sm:space-y-6">
              {topics
                .filter((t) => t.value !== "all")
                .map((topic: { value: string; label: string; icon: any }) => {
                  const topicQuestions = filteredQuestions.filter((q) => q.topic === topic.value)
                  if (topicQuestions.length === 0) return null

                  return (
                    <Card key={topic.value}>
                      <CardHeader>
                        <CardTitle className="flex items-center text-sm sm:text-base">
                          <topic.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          {topic.label}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {topicQuestions.length} soal
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 sm:space-y-3">
                          {topicQuestions.map((question: Question, index: number) => (
                            <div
                              key={question.id}
                              className="flex items-center justify-between p-2 sm:p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-xs sm:text-sm mb-1 truncate">
                                  {index + 1}. {question.question.substring(0, 80)}...
                                </p>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                  <Badge className={`${getDifficultyColor(question.difficulty)} text-xs`} variant="secondary">
                                    {question.difficulty === "easy"
                                      ? "Mudah"
                                      : question.difficulty === "medium"
                                        ? "Sedang"
                                        : "Sulit"}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {question.type === "multiple-choice"
                                      ? "Pilihan Ganda"
                                      : question.type === "true-false"
                                        ? "Benar/Salah"
                                        : "Jawaban Singkat"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                {question.bookmarked && <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />}
                                <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
