import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

const questionSchema = z.object({
  question: z.object({
    type: z.string(),
    topic: z.string(),
    difficulty: z.string(),
    question: z.string(),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string(),
    explanation: z.string(),
    aiHint: z.string(),
    tags: z.array(z.string()),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const { originalQuestion, topic, difficulty, type } = await request.json()

    const prompt = `Buatlah variasi baru dari soal berikut dengan tetap mempertahankan topik dan tingkat kesulitan yang sama:

Soal asli: "${originalQuestion}"
Topik: ${topic}
Tingkat kesulitan: ${difficulty}
Jenis soal: ${type}

Persyaratan untuk variasi baru:
- Pertanyaan harus berbeda dari soal asli tetapi masih dalam topik yang sama
- Tingkat kesulitan harus konsisten
- Jenis soal harus sama (${type})
- Gunakan konteks atau skenario yang berbeda
- Tetap relevan dengan logistik rumah sakit Indonesia
- Berikan penjelasan yang komprehensif
- Sertakan petunjuk AI yang membantu

Format yang diharapkan:
- type: harus berupa "${type}" (string)
- difficulty: harus berupa "${difficulty}" (string: "easy", "medium", atau "hard")
- correctAnswer: jawaban yang benar (string)
- options: untuk pilihan ganda saja, array 4 opsi (array of strings, optional)
- tags: kategori untuk klasifikasi (array of strings)

${type === "multiple-choice" ? "Sediakan 4 opsi pilihan dengan 1 jawaban benar. correctAnswer harus berupa string index (contoh: '0', '1', '2', atau '3')." : ""}
${type === "true-false" ? "Buat pernyataan yang dapat dinilai benar atau salah. correctAnswer harus berupa 'true' atau 'false'." : ""}
${type === "short-answer" ? "Buat pertanyaan yang membutuhkan jawaban 2-3 kalimat. correctAnswer berupa string jawaban yang diharapkan." : ""}`

    const result = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: questionSchema,
      prompt: prompt,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error("Error regenerating question:", error)
    return NextResponse.json({ error: "Failed to regenerate question" }, { status: 500 })
  }
}
