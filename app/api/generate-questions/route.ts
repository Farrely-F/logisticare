import { type NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const questionSchema = z.object({
  questions: z.array(
    z.object({
      id: z.number(),
      type: z.string(),
      topic: z.string(),
      difficulty: z.string(),
      question: z.string(),
      options: z.array(z.string()).optional(),
      correctAnswer: z.string(),
      explanation: z.string(),
      aiHint: z.string(),
      tags: z.array(z.string()),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const { topic, count, difficulty } = await request.json();

    const prompt = `Buatlah ${count} soal ujian untuk topik "${topic}" dalam konteks logistik rumah sakit Indonesia. 

Persyaratan:
- Campuran jenis soal: pilihan ganda (4 opsi), benar/salah, dan jawaban singkat
- Tingkat kesulitan: ${
      difficulty === "mixed" ? "campuran (mudah, sedang, sulit)" : difficulty
    }
- Sesuai dengan standar dan regulasi rumah sakit Indonesia
- Gunakan terminologi medis dan logistik yang tepat
- Berikan penjelasan yang detail dan mudah dipahami
- Sertakan petunjuk AI yang membantu tanpa memberikan jawaban langsung

Topik spesifik untuk "${topic}":
${getTopicGuidelines(topic)}

Format setiap soal harus mencakup:
- id: nomor urut soal (number)
- type: jenis soal (string: "multiple-choice", "true-false", atau "short-answer")
- topic: topik soal (string)
- difficulty: tingkat kesulitan (string: "easy", "medium", atau "hard")
- question: pertanyaan yang jelas dan spesifik (string)
- options: untuk pilihan ganda saja, array 4 opsi (array of strings, optional)
- correctAnswer: jawaban yang benar (string)
- explanation: penjelasan komprehensif mengapa jawaban tersebut benar (string)
- aiHint: petunjuk AI yang mengarahkan pemikiran tanpa spoiler (string)
- tags: kategori untuk klasifikasi (array of strings)

Untuk pilihan ganda: 4 opsi dengan 1 jawaban benar
Untuk benar/salah: pernyataan yang dapat dinilai, correctAnswer harus "true" atau "false"
Untuk jawaban singkat: pertanyaan yang membutuhkan penjelasan 2-3 kalimat`;

    const result = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: questionSchema,
      prompt: prompt,
    });

    return NextResponse.json(result.object);
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}

function getTopicGuidelines(topic: string): string {
  const guidelines = {
    "Manajemen Inventori": `
- Sistem FIFO, FEFO, dan LIFO
- ABC Analysis dan kategorisasi obat
- Stock opname dan cycle counting
- Minimum-maximum stock levels
- Cold chain management
- Expired drug management
- Inventory turnover ratio
- Storage requirements dan kondisi penyimpanan`,

    "Pengadaan Medis": `
- Proses tender dan e-procurement
- Vendor qualification dan evaluation
- Purchase requisition dan purchase order
- Good Receipt Process
- Quality control dan incoming inspection
- Contract management
- Budget planning dan cost control
- Regulatory compliance (BPOM, ISO)`,

    "SOP Logistik": `
- Standard Operating Procedures
- Receiving dan put-away process
- Pick, pack, dan dispatch procedures
- Documentation dan record keeping
- Safety procedures dan handling
- Emergency procedures
- Quality assurance protocols
- Audit trails dan traceability`,

    "Distribusi Obat": `
- Unit Dose Dispensing (UDD)
- Floor stock management
- Medication distribution systems
- Controlled substance handling
- Patient-specific medication
- Automated dispensing systems
- Medication reconciliation
- Distribution scheduling dan routing`,
  };

  return guidelines[topic as keyof typeof guidelines] || "";
}
