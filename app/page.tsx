"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  Trophy,
  Target,
  BookOpen,
  Zap,
  ArrowRight,
  Hospital,
  Package,
  ClipboardList,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const [stats] = useState({
    totalUsers: 2847,
    questionsGenerated: 15420,
    averageScore: 87,
    completionRate: 94,
  })

  const features = [
    {
      icon: Brain,
      title: "Generator Soal AI",
      description: "Soal otomatis menggunakan Google Gemini untuk topik logistik rumah sakit",
      color: "bg-blue-500",
    },
    {
      icon: Target,
      title: "Tutor AI Interaktif",
      description: "Penjelasan jawaban, petunjuk, dan umpan balik dari AI Agent",
      color: "bg-green-500",
    },
    {
      icon: Trophy,
      title: "Sistem Gamifikasi",
      description: "XP, level, lencana, dan papan peringkat untuk motivasi belajar",
      color: "bg-yellow-500",
    },
    {
      icon: BookOpen,
      title: "Bank Soal Lengkap",
      description: "Filter berdasarkan topik, tingkat kesulitan, dan pencarian kata kunci",
      color: "bg-purple-500",
    },
  ]

  const topics = [
    { name: "Manajemen Inventori", questions: 245, icon: Package },
    { name: "Pengadaan Medis", questions: 189, icon: ClipboardList },
    { name: "SOP Logistik", questions: 156, icon: BookOpen },
    { name: "Distribusi Obat", questions: 203, icon: Hospital },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Hospital className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-900">LogistiCare Prep</h1>
                <p className="text-xs text-gray-600 hidden sm:block">Persiapan Ujian Logistik RS</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Panel</span>
                </Button>
              </Link>
              <Link href="/quiz">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2">
                  <span className="hidden sm:inline">Mulai Kuis</span>
                  <span className="sm:hidden">Kuis</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs sm:text-sm">
              🚀 Platform Pembelajaran AI Terdepan
            </Badge>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Persiapan Ujian
              <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent block">
                Logistik Rumah Sakit
              </span>
              dengan AI
            </h1>
            <p className="text-base sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto px-4 sm:px-0">
              Platform pembelajaran interaktif yang menggunakan kecerdasan buatan untuk membantu Anda menguasai ujian
              lingkup kerja logistik rumah sakit dengan cara yang menyenangkan dan efektif.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
              <Link href="/quiz" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-sm sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto"
                >
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Mulai Belajar Sekarang
                </Button>
              </Link>
              <Link href="/question-bank" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="text-sm sm:text-lg px-6 sm:px-8 py-3 bg-transparent w-full sm:w-auto">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Jelajahi Bank Soal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs sm:text-base text-gray-600">Pengguna Aktif</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">{stats.questionsGenerated.toLocaleString()}</div>
              <div className="text-xs sm:text-base text-gray-600">Soal Dihasilkan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">{stats.averageScore}%</div>
              <div className="text-xs sm:text-base text-gray-600">Rata-rata Skor</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">{stats.completionRate}%</div>
              <div className="text-xs sm:text-base text-gray-600">Tingkat Penyelesaian</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Fitur Unggulan Platform</h2>
            <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
              Teknologi AI terdepan untuk pengalaman belajar yang personal dan efektif
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature: { icon: any; title: string; description: string; color: string }, index: number) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="text-center pb-3 sm:pb-4">
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}
                  >
                    <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 text-sm sm:text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Topik Pembelajaran</h2>
            <p className="text-base sm:text-xl text-gray-600 px-4 sm:px-0">Materi lengkap sesuai kurikulum ujian logistik rumah sakit</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {topics.map((topic: { name: string; questions: number; icon: any }, index: number) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <CardHeader className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <topic.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">{topic.name}</CardTitle>
                  <CardDescription className="text-sm sm:text-base">{topic.questions} soal tersedia</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 px-4 sm:px-0">Siap Menghadapi Ujian dengan Percaya Diri?</h2>
            <p className="text-base sm:text-xl mb-6 sm:mb-8 opacity-90 px-4 sm:px-0">
              Bergabunglah dengan ribuan profesional kesehatan yang telah berhasil lulus ujian dengan bantuan platform
              AI kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="text-sm sm:text-lg px-6 sm:px-8 py-2 sm:py-3 w-full sm:w-auto">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Lihat Progress Saya
                </Button>
              </Link>
              <Link href="/quiz" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-sm sm:text-lg px-6 sm:px-8 py-2 sm:py-3 text-white border-white hover:bg-white hover:text-blue-600 bg-transparent w-full sm:w-auto"
                >
                  Mulai Kuis Sekarang
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <Hospital className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">LogistiCare Prep</span>
              </div>
              <p className="text-gray-400">Platform pembelajaran AI untuk persiapan ujian logistik rumah sakit.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Fitur</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Generator Soal AI</li>
                <li>Tutor Interaktif</li>
                <li>Bank Soal</li>
                <li>Gamifikasi</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Topik</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Manajemen Inventori</li>
                <li>Pengadaan Medis</li>
                <li>SOP Logistik</li>
                <li>Distribusi Obat</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Dukungan</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Panduan Pengguna</li>
                <li>FAQ</li>
                <li>Kontak Support</li>
                <li>Komunitas</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LogistiCare Prep. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
