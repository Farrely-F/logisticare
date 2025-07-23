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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Home className="w-5 h-5" />
                <span className="font-semibold">LogistiCare Prep</span>
              </Link>
              <Badge variant="secondary">Bank Soal</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/quiz">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600">
                  <Brain className="w-4 h-4 mr-2" />
                  Mulai Kuis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Soal Logistik Rumah Sakit</h1>
          <p className="text-gray-600">Koleksi lengkap soal-soal untuk persiapan ujian dengan fitur AI</p>
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
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Cari soal atau kata kunci..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Topik" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
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
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              Menampilkan {filteredQuestions.length} dari {questions.length} soal
            </p>
            <Button
              onClick={() => generateMoreQuestions(selectedTopic === "all" ? "Manajemen Inventori" : selectedTopic)}
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Hasilkan Soal Baru
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
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">Semua Soal</TabsTrigger>
              <TabsTrigger value="bookmarked">Favorit</TabsTrigger>
              <TabsTrigger value="by-topic">Per Topik</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredQuestions.map((question) => {
                const TypeIcon = getTypeIcon(question.type)
                const isAnswerShown = showAnswers.includes(question.id)

                return (
                  <Card key={question.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 mb-2">
                          <TypeIcon className="w-4 h-4 text-gray-500" />
                          <Badge variant="outline">{question.topic}</Badge>
                          <Badge className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty === "easy"
                              ? "Mudah"
                              : question.difficulty === "medium"
                                ? "Sedang"
                                : "Sulit"}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => toggleBookmark(question.id)}>
                            <Star
                              className={`w-4 h-4 ${question.bookmarked ? "fill-yellow-400 text-yellow-400" : ""}`}
                            />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => generateVariation(question.id)}>
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {question.type === "multiple-choice" && question.options && (
                        <div className="space-y-2 mb-4">
                          {question.options.map((option, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border ${
                                isAnswerShown && index === question.correctAnswer
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                              {option}
                              {isAnswerShown && index === question.correctAnswer && (
                                <Badge className="ml-2 bg-green-100 text-green-800">Benar</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "true-false" && (
                        <div className="space-y-2 mb-4">
                          <div
                            className={`p-3 rounded-lg border ${
                              isAnswerShown && question.correctAnswer === "true"
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <span className="font-medium mr-2">A.</span>
                            Benar
                            {isAnswerShown && question.correctAnswer === "true" && (
                              <Badge className="ml-2 bg-green-100 text-green-800">Benar</Badge>
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-lg border ${
                              isAnswerShown && question.correctAnswer === "false"
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <span className="font-medium mr-2">B.</span>
                            Salah
                            {isAnswerShown && question.correctAnswer === "false" && (
                              <Badge className="ml-2 bg-green-100 text-green-800">Benar</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {question.type === "short-answer" && isAnswerShown && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-semibold text-green-900 mb-1">Jawaban:</h4>
                          <p className="text-green-800">{question.correctAnswer}</p>
                        </div>
                      )}

                      {isAnswerShown && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-blue-900 mb-1">Penjelasan:</h4>
                              <p className="text-blue-800">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {question.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => toggleAnswer(question.id)}>
                          {isAnswerShown ? "Sembunyikan" : "Lihat"} Jawaban
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="bookmarked" className="space-y-4">
              {filteredQuestions.filter((q) => q.bookmarked).length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Soal Favorit</h3>
                    <p className="text-gray-600">Tandai soal sebagai favorit untuk akses cepat</p>
                  </CardContent>
                </Card>
              ) : (
                filteredQuestions
                  .filter((q) => q.bookmarked)
                  .map((question) => {
                    const TypeIcon = getTypeIcon(question.type)
                    const isAnswerShown = showAnswers.includes(question.id)

                    return (
                      <Card key={question.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2 mb-2">
                              <TypeIcon className="w-4 h-4 text-gray-500" />
                              <Badge variant="outline">{question.topic}</Badge>
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty === "easy"
                                  ? "Mudah"
                                  : question.difficulty === "medium"
                                    ? "Sedang"
                                    : "Sulit"}
                              </Badge>
                            </div>
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          </div>
                          <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {question.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => toggleAnswer(question.id)}>
                              {isAnswerShown ? "Sembunyikan" : "Lihat"} Jawaban
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
              )}
            </TabsContent>

            <TabsContent value="by-topic" className="space-y-6">
              {topics
                .filter((t) => t.value !== "all")
                .map((topic) => {
                  const topicQuestions = filteredQuestions.filter((q) => q.topic === topic.value)
                  if (topicQuestions.length === 0) return null

                  return (
                    <Card key={topic.value}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <topic.icon className="w-5 h-5 mr-2" />
                          {topic.label}
                          <Badge variant="secondary" className="ml-2">
                            {topicQuestions.length} soal
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {topicQuestions.map((question, index) => (
                            <div
                              key={question.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm mb-1">
                                  {index + 1}. {question.question.substring(0, 100)}...
                                </p>
                                <div className="flex items-center space-x-2">
                                  <Badge className={getDifficultyColor(question.difficulty)} variant="secondary">
                                    {question.difficulty === "easy"
                                      ? "Mudah"
                                      : question.difficulty === "medium"
                                        ? "Sedang"
                                        : "Sulit"}
                                  </Badge>
                                  <Badge variant="outline">
                                    {question.type === "multiple-choice"
                                      ? "Pilihan Ganda"
                                      : question.type === "true-false"
                                        ? "Benar/Salah"
                                        : "Jawaban Singkat"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {question.bookmarked && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
                                <Button variant="ghost" size="sm">
                                  <BookOpen className="w-4 h-4" />
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
