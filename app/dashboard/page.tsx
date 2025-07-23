"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, BookOpen, Brain, Zap, Calendar, Home, Users, Clock, Award } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const [userStats] = useState({
    level: 12,
    xp: 2450,
    xpToNext: 550,
    totalQuizzes: 47,
    averageScore: 87,
    timeSpent: 24.5,
    streak: 7,
    badges: 8,
    rank: 23,
  })

  const [recentQuizzes] = useState([
    { topic: "Manajemen Inventori", score: 92, date: "2024-01-20", questions: 15 },
    { topic: "Pengadaan Medis", score: 85, date: "2024-01-19", questions: 12 },
    { topic: "SOP Logistik", score: 78, date: "2024-01-18", questions: 20 },
    { topic: "Distribusi Obat", score: 94, date: "2024-01-17", questions: 18 },
  ])

  const [badges] = useState([
    { name: "Pemula", description: "Menyelesaikan kuis pertama", earned: true, icon: "🎯" },
    { name: "Konsisten", description: "Streak 7 hari berturut-turut", earned: true, icon: "🔥" },
    { name: "Ahli Inventori", description: "Skor 90+ di Manajemen Inventori", earned: true, icon: "📦" },
    { name: "Perfectionist", description: "Skor 100% dalam satu kuis", earned: false, icon: "⭐" },
    { name: "Speedster", description: "Menyelesaikan kuis dalam 5 menit", earned: true, icon: "⚡" },
    { name: "Scholar", description: "Menyelesaikan 50 kuis", earned: false, icon: "🎓" },
  ])

  const [topicProgress] = useState([
    { topic: "Manajemen Inventori", progress: 85, total: 50, completed: 42 },
    { topic: "Pengadaan Medis", progress: 72, total: 40, completed: 29 },
    { topic: "SOP Logistik", progress: 60, total: 35, completed: 21 },
    { topic: "Distribusi Obat", progress: 90, total: 45, completed: 40 },
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <Home className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="font-semibold text-sm sm:text-base">LogistiCare Prep</span>
              </Link>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs sm:text-sm">
                Level {userStats.level}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/quiz">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 text-xs sm:text-sm px-3 sm:px-4 py-2">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Mulai Kuis</span>
                  <span className="sm:hidden">Kuis</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Selamat Datang Kembali! 👋</h1>
          <p className="text-sm sm:text-base text-gray-600">Lanjutkan perjalanan belajar Anda untuk menguasai ujian logistik rumah sakit.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">{userStats.totalQuizzes}</div>
              <div className="text-xs sm:text-sm text-gray-600">Kuis Selesai</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">{userStats.averageScore}%</div>
              <div className="text-xs sm:text-sm text-gray-600">Rata-rata Skor</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600 mb-1">{userStats.timeSpent}h</div>
              <div className="text-xs sm:text-sm text-gray-600">Waktu Belajar</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">#{userStats.rank}</div>
              <div className="text-xs sm:text-sm text-gray-600">Peringkat</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Ringkasan</TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm py-2">Progress</TabsTrigger>
            <TabsTrigger value="badges" className="text-xs sm:text-sm py-2">Lencana</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm py-2">Riwayat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Level Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500" />
                    Progress Level
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xl sm:text-2xl font-bold">Level {userStats.level}</span>
                      <Badge variant="outline" className="text-xs sm:text-sm">{userStats.xp} XP</Badge>
                    </div>
                    <Progress value={(userStats.xp / (userStats.xp + userStats.xpToNext)) * 100} className="h-2 sm:h-3" />
                    <p className="text-xs sm:text-sm text-gray-600">
                      {userStats.xpToNext} XP lagi untuk mencapai Level {userStats.level + 1}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Streak */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-orange-500" />
                    Streak Harian
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-orange-500 mb-2">🔥 {userStats.streak}</div>
                    <p className="text-sm sm:text-base text-gray-600">Hari berturut-turut</p>
                    <Button variant="outline" size="sm" className="mt-3 sm:mt-4 bg-transparent text-xs sm:text-sm">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Lihat Kalender
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Aksi Cepat</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Lanjutkan pembelajaran Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <Link href="/quiz">
                    <Button variant="outline" className="w-full h-16 sm:h-20 flex-col bg-transparent">
                      <Brain className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                      <span className="text-xs sm:text-sm">Kuis Baru</span>
                    </Button>
                  </Link>
                  <Link href="/question-bank">
                    <Button variant="outline" className="w-full h-16 sm:h-20 flex-col bg-transparent">
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                      <span className="text-xs sm:text-sm">Bank Soal</span>
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full h-16 sm:h-20 flex-col bg-transparent">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 mb-1 sm:mb-2" />
                    <span className="text-xs sm:text-sm">Leaderboard</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Progress Topik</CardTitle>
                <CardDescription>Kemajuan pembelajaran berdasarkan topik</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {topicProgress.map((topic, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">{topic.topic}</h3>
                        <span className="text-sm text-gray-600">
                          {topic.completed}/{topic.total} soal
                        </span>
                      </div>
                      <Progress value={topic.progress} className="h-2" />
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{topic.progress}% selesai</span>
                        <span>{topic.total - topic.completed} tersisa</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Koleksi Lencana</CardTitle>
                <CardDescription>Pencapaian yang telah Anda raih</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {badges.map((badge, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 text-center ${
                        badge.earned ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <h3 className="font-semibold mb-1">{badge.name}</h3>
                      <p className="text-sm text-gray-600">{badge.description}</p>
                      {badge.earned && <Badge className="mt-2 bg-green-100 text-green-800">Diraih</Badge>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Kuis Terbaru</CardTitle>
                <CardDescription>Performa kuis dalam 7 hari terakhir</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentQuizzes.map((quiz, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{quiz.topic}</h3>
                        <p className="text-sm text-gray-600">
                          {quiz.questions} soal • {quiz.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            quiz.score >= 90 ? "text-green-600" : quiz.score >= 80 ? "text-yellow-600" : "text-red-600"
                          }`}
                        >
                          {quiz.score}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {quiz.score >= 90 ? "Excellent" : quiz.score >= 80 ? "Good" : "Needs Improvement"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
