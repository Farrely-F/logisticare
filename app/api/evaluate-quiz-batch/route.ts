import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

const answerEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  isCorrect: z.boolean(),
  feedback: z.string(),
  keyPoints: z.array(z.string()),
  suggestions: z.string().optional(),
})

const batchQuizEvaluationSchema = z.object({
  answerEvaluations: z.array(answerEvaluationSchema),
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
  let questions: any[] = [];
  let userAnswers: (string | number)[] = [];
  let topic = "";
  let difficulty = "";
  let timeSpent = 0;
  let totalQuestions = 0;

  try {
    const requestData = await request.json();
    questions = requestData.questions;
    userAnswers = requestData.userAnswers;
    topic = requestData.topic;
    difficulty = requestData.difficulty;
    timeSpent = requestData.timeSpent;
    totalQuestions = requestData.totalQuestions;

    // Format questions and answers for batch evaluation
    const questionAnswerPairs = questions.map((q: any, index: number) => {
      let formattedUserAnswer = "";
      if (q.type === "multiple-choice" && q.options) {
        const answerIndex = parseInt(userAnswers[index]?.toString() || "-1");
        formattedUserAnswer = answerIndex >= 0 && answerIndex < q.options.length
          ? q.options[answerIndex]
          : userAnswers[index]?.toString() || "";
      } else {
        formattedUserAnswer = userAnswers[index]?.toString() || "";
      }

      return {
        questionNumber: index + 1,
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        topic: q.topic,
        userAnswer: formattedUserAnswer,
        correctAnswer: q.correctAnswer.toString(),
        options: q.options || []
      }
    })

    const prompt = `Sebagai evaluator AI untuk ujian logistik rumah sakit, evaluasi seluruh kuis berikut dalam satu analisis komprehensif:

INFORMASI KUIS:
- Topik utama: ${topic}
- Tingkat kesulitan: ${difficulty}
- Total soal: ${totalQuestions}
- Waktu yang digunakan: ${Math.floor(timeSpent / 60)} menit ${timeSpent % 60} detik

SOAL DAN JAWABAN:
${questionAnswerPairs.map((item: any) => `
Soal ${item.questionNumber}:
- Pertanyaan: ${item.question}
- Tipe: ${item.type}
- Tingkat: ${item.difficulty}
- Topik: ${item.topic}
- Jawaban pengguna: ${item.userAnswer}
- Jawaban benar: ${item.correctAnswer}
${item.options.length > 0 ? `- Pilihan: ${item.options.join(', ')}` : ''}
`).join('')}

Tugas Anda:
1. EVALUASI INDIVIDUAL: Untuk setiap soal, berikan:
   - Skor 0-100 berdasarkan keakuratan dan kelengkapan
   - Status benar/salah (skor >= 70 dianggap benar)
   - Feedback konstruktif dalam bahasa Indonesia
   - Poin-poin kunci yang dijawab dengan benar
   - Saran perbaikan jika diperlukan

2. EVALUASI KESELURUHAN:
   - Hitung skor keseluruhan berdasarkan rata-rata skor per soal
   - Kategorikan performa berdasarkan area/konsep:
     * Excellent (skor 90-100): Area yang dikuasai dengan sangat baik
     * Good (skor 70-89): Area yang dikuasai dengan baik
     * Needs Improvement (skor <70): Area yang perlu diperbaiki
   - Berikan rekomendasi pembelajaran yang spesifik dan actionable
   - Identifikasi kekuatan dan kelemahan utama
   - Buat rencana belajar yang terstruktur
   - Berikan pesan motivasi yang personal

Kriteria penilaian per soal:
- Keakuratan konsep (40%)
- Kelengkapan jawaban (30%)
- Penggunaan terminologi yang tepat (20%)
- Struktur dan kejelasan (10%)

Untuk soal pilihan ganda: skor 100 jika benar, 0 jika salah.
Untuk soal essay/short answer: evaluasi berdasarkan kriteria di atas.

Fokus pada analisis mendalam tentang pemahaman konsep logistik rumah sakit dan berikan rekomendasi yang actionable.`

    const result = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: batchQuizEvaluationSchema,
      prompt: prompt,
    })

    return NextResponse.json({ 
      answerEvaluations: result.object.answerEvaluations,
      quizEvaluation: {
        overallScore: result.object.overallScore,
        performance: result.object.performance,
        learningRecommendations: result.object.learningRecommendations,
        strengths: result.object.strengths,
        weaknesses: result.object.weaknesses,
        nextSteps: result.object.nextSteps,
        motivationalMessage: result.object.motivationalMessage,
      }
    })
  } catch (error) {
    console.error("Error evaluating quiz batch:", error)
    
    // Fallback: Simple scoring system
    const fallbackEvaluations = questions.map((q: any, index: number) => {
      const userAnswer = userAnswers[index]?.toString() || "";
      const correctAnswer = q.correctAnswer.toString();
      
      let isCorrect = false;
      let score = 0;
      
      if (q.type === "multiple-choice") {
        const answerIndex = parseInt(userAnswer);
        const correctIndex = parseInt(correctAnswer);
        isCorrect = answerIndex === correctIndex;
        score = isCorrect ? 100 : 0;
      } else {
        // Simple text comparison for short answers
        isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        score = isCorrect ? 100 : 0;
      }
      
      return {
        score,
        isCorrect,
        feedback: isCorrect ? "Jawaban benar!" : "Jawaban kurang tepat. Silakan pelajari kembali materi terkait.",
        keyPoints: isCorrect ? ["Jawaban sesuai dengan kunci"] : [],
        suggestions: isCorrect ? undefined : "Pelajari kembali konsep dasar pada topik ini."
      };
    });
    
    const correctCount = fallbackEvaluations.filter(e => e.isCorrect).length;
    const overallScore = Math.round((correctCount / questions.length) * 100);
    
    return NextResponse.json({ 
      answerEvaluations: fallbackEvaluations,
      quizEvaluation: {
        overallScore,
        performance: {
          excellent: [],
          good: overallScore >= 70 ? [topic] : [],
          needsImprovement: overallScore < 70 ? [topic] : [],
        },
        learningRecommendations: {
          priorityTopics: overallScore < 70 ? [topic] : [],
          studyPlan: ["Pelajari kembali materi dasar", "Latihan soal tambahan"],
          resources: ["Baca materi pembelajaran", "Diskusi dengan mentor"],
        },
        strengths: overallScore >= 70 ? ["Pemahaman dasar baik"] : [],
        weaknesses: overallScore < 70 ? ["Perlu penguatan konsep"] : [],
        nextSteps: overallScore >= 70 ? "Lanjutkan ke topik berikutnya" : "Pelajari kembali materi dasar",
        motivationalMessage: "Terus semangat belajar! Setiap usaha akan membuahkan hasil."
      }
    })
  }
}