import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const { question, userAnswer, correctAnswer, topic } = await request.json()

    const prompt = `Sebagai tutor AI untuk logistik rumah sakit, berikan penjelasan yang detail dan mudah dipahami untuk soal berikut:

Pertanyaan: "${question}"
Jawaban pengguna: "${userAnswer}"
Jawaban yang benar: "${correctAnswer}"
Topik: ${topic}

Tugas Anda:
1. Jelaskan mengapa jawaban yang benar adalah benar
2. Jika jawaban pengguna salah, jelaskan dengan lembut mengapa jawaban tersebut kurang tepat
3. Berikan konteks tambahan yang relevan dengan praktik logistik rumah sakit
4. Gunakan bahasa yang mudah dipahami dan profesional
5. Sertakan tips atau insight tambahan yang berguna untuk pembelajaran

Berikan penjelasan dalam bahasa Indonesia yang jelas dan terstruktur.`

    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: prompt,
    })

    return NextResponse.json({ explanation: result.text })
  } catch (error) {
    console.error("Error getting AI explanation:", error)
    return NextResponse.json({ error: "Failed to get explanation" }, { status: 500 })
  }
}
