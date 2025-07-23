import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

const quizEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  performance: z.object({
    excellent: z.array(z.string()),
    good: z.array(z.string()),
    needsImprovement: z.array(z.string()),
  }),
  learningRecommendations: z.object({
    priorityTopics: z.array(z.string()),
    studyPlan: z.array(z.string()),
    resources: z.array(z.string()),
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  nextSteps: z.string(),
  motivationalMessage: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const { 
      questions, 
      userAnswers, 
      evaluations, 
      topic, 
      difficulty, 
      timeSpent,
      totalQuestions 
    } = await request.json()

    // Calculate performance by topic/concept
    const topicPerformance = questions.map((q: any, index: number) => ({
      question: q.question,
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      userAnswer: userAnswers[index],
      correctAnswer: q.correctAnswer,
      evaluation: evaluations[index],
    }))

    const prompt = `Sebagai mentor AI untuk logistik rumah sakit, berikan evaluasi komprehensif untuk kuis yang telah diselesaikan:

INFORMASI KUIS:
- Topik utama: ${topic}
- Tingkat kesulitan: ${difficulty}
- Total soal: ${totalQuestions}
- Waktu yang digunakan: ${Math.floor(timeSpent / 60)} menit ${timeSpent % 60} detik

DETAIL PERFORMA PER SOAL:
${topicPerformance.map((item: any, index: number) => `
Soal ${index + 1}:
- Pertanyaan: ${item.question}
- Tipe: ${item.type}
- Tingkat: ${item.difficulty}
- Jawaban pengguna: ${item.userAnswer}
- Jawaban benar: ${item.correctAnswer}
- Skor: ${item.evaluation?.score || 0}/100
- Feedback: ${item.evaluation?.feedback || 'Tidak ada evaluasi'}
`).join('')}

Tugas Anda:
1. Hitung skor keseluruhan berdasarkan rata-rata skor per soal
2. Kategorikan performa berdasarkan area/konsep:
   - Excellent (skor 90-100): Area yang dikuasai dengan sangat baik
   - Good (skor 70-89): Area yang dikuasai dengan baik
   - Needs Improvement (skor <70): Area yang perlu diperbaiki
3. Berikan rekomendasi pembelajaran yang spesifik dan actionable
4. Identifikasi kekuatan dan kelemahan utama
5. Buat rencana belajar yang terstruktur
6. Berikan pesan motivasi yang personal

Fokus pada:
- Analisis mendalam tentang pemahaman konsep logistik rumah sakit
- Rekomendasi topik prioritas untuk dipelajari
- Strategi belajar yang efektif
- Sumber daya pembelajaran yang relevan
- Langkah konkret untuk perbaikan

Gunakan bahasa Indonesia yang profesional namun ramah dan memotivasi.`

    const result = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: quizEvaluationSchema,
      prompt: prompt,
    })

    return NextResponse.json({ evaluation: result.object })
  } catch (error) {
    console.error("Error evaluating quiz:", error)
    return NextResponse.json({ error: "Failed to evaluate quiz" }, { status: 500 })
  }
}