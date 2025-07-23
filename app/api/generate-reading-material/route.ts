import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

const readingMaterialSchema = z.object({
  material: z.object({
    title: z.string(),
    content: z.string(),
    difficulty: z.string(),
    tags: z.array(z.string()),
  }),
})

export async function POST(request: NextRequest) {
  try {
    const { topic, difficulty } = await request.json()

    const prompt = `Buatlah materi pembelajaran komprehensif tentang topik berikut:

Topik: ${topic}
Tingkat kesulitan: ${difficulty}

Persyaratan untuk materi pembelajaran:
- Konten harus informatif dan mudah dipahami
- Relevan dengan konteks logistik rumah sakit Indonesia
- Terstruktur dengan baik (gunakan heading, subheading, bullet points)
- Sertakan contoh praktis dan studi kasus
- Panjang konten sekitar 800-1200 kata
- Gunakan bahasa Indonesia yang profesional

Format yang diharapkan:
- title: judul materi yang menarik dan deskriptif (string)
- content: konten lengkap dalam format markdown (string)
- difficulty: tingkat kesulitan "${difficulty}" (string: "easy", "medium", atau "hard")
- tags: kategori untuk klasifikasi (array of strings)

Struktur konten yang disarankan:
1. Pendahuluan/Overview
2. Konsep Dasar
3. Implementasi Praktis
4. Studi Kasus
5. Best Practices
6. Kesimpulan

Pastikan konten mencakup aspek-aspek penting seperti:
- Definisi dan terminologi
- Prosedur standar
- Regulasi yang berlaku
- Teknologi yang digunakan
- Tantangan dan solusi
- Contoh implementasi di rumah sakit Indonesia`

    const result = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: readingMaterialSchema,
      prompt: prompt,
    })

    // Transform the response to match expected structure
    const readingMaterial = {
      title: result.object.material.title,
      content: result.object.material.content,
      difficulty: result.object.material.difficulty as "easy" | "medium" | "hard",
      tags: result.object.material.tags,
      topic: topic,
      createdAt: new Date(),
    }

    return NextResponse.json({ readingMaterial })
  } catch (error) {
    console.error("Error generating reading material:", error)
    return NextResponse.json({ error: "Failed to generate reading material" }, { status: 500 })
  }
}