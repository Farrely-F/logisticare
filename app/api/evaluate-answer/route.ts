import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

const evaluationSchema = z.object({
  score: z.number().min(0).max(100),
  isCorrect: z.boolean(),
  feedback: z.string(),
  keyPoints: z.array(z.string()),
  suggestions: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { question, userAnswer, correctAnswer, topic, questionType } = await request.json()

    const prompt = `Sebagai evaluator AI untuk ujian logistik rumah sakit, evaluasi jawaban pengguna berikut:

Pertanyaan: "${question}"
Jawaban pengguna: "${userAnswer}"
Jawaban yang benar/referensi: "${correctAnswer}"
Topik: ${topic}
Tipe soal: ${questionType}

Tugas Anda:
1. Berikan skor dari 0-100 berdasarkan keakuratan dan kelengkapan jawaban
2. Tentukan apakah jawaban benar (skor >= 70 dianggap benar)
3. Berikan feedback konstruktif dalam bahasa Indonesia
4. Identifikasi poin-poin kunci yang dijawab dengan benar
5. Berikan saran perbaikan jika diperlukan

Kriteria penilaian:
- Keakuratan konsep (40%)
- Kelengkapan jawaban (30%)
- Penggunaan terminologi yang tepat (20%)
- Struktur dan kejelasan (10%)

Untuk soal pilihan ganda, berikan skor 100 jika benar dan 0 jika salah.
Untuk soal essay/short answer, evaluasi berdasarkan kriteria di atas.`

    const result = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: evaluationSchema,
      prompt: prompt,
    })

    return NextResponse.json({ evaluation: result.object })
  } catch (error) {
    console.error("Error evaluating answer:", error)
    return NextResponse.json({ error: "Failed to evaluate answer" }, { status: 500 })
  }
}