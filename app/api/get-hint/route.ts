import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const { question, topic } = await request.json()

    const prompt = `Sebagai tutor AI yang membantu, berikan petunjuk untuk soal berikut tanpa memberikan jawaban langsung:

Pertanyaan: "${question}"
Topik: ${topic}

Petunjuk yang baik harus:
1. Mengarahkan pemikiran ke arah yang benar
2. Memberikan konteks atau framework berpikir
3. Tidak memberikan jawaban secara langsung
4. Membantu pengguna memahami konsep dasar
5. Menggunakan analogi atau contoh jika membantu

Berikan petunjuk dalam bahasa Indonesia yang mendorong pemikiran kritis.`

    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: prompt,
    })

    return NextResponse.json({ hint: result.text })
  } catch (error) {
    console.error("Error getting AI hint:", error)
    return NextResponse.json({ error: "Failed to get hint" }, { status: 500 })
  }
}
