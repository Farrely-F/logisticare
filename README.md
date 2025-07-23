# 🏥 LogistiCare Prep - AI-Powered Hospital Logistics Exam Preparation

Platform pembelajaran berbasis AI untuk persiapan ujian lingkup kerja logistik rumah sakit dengan integrasi Google Gemini.

## 🚀 Features

### 🤖 AI-Powered Learning
- **Dynamic Question Generation**: Soal dibuat otomatis oleh Google Gemini berdasarkan topik yang dipilih
- **Interactive AI Tutor**: Penjelasan detail dan petunjuk dari AI untuk setiap soal
- **Question Regeneration**: Variasi soal otomatis untuk pembelajaran yang beragam
- **Adaptive Explanations**: Penjelasan yang disesuaikan dengan jawaban pengguna

### 📚 Comprehensive Content
- **4 Main Topics**: Manajemen Inventori, Pengadaan Medis, SOP Logistik, Distribusi Obat
- **Multiple Question Types**: Pilihan ganda, benar/salah, jawaban singkat
- **Difficulty Levels**: Mudah, sedang, sulit
- **Indonesian Content**: Semua konten dalam bahasa Indonesia

### 🎮 Gamification
- **XP System**: Earn points untuk motivasi belajar
- **Level Progression**: Sistem level dengan visual progress
- **Badges & Achievements**: Unlock berbagai pencapaian
- **Streak Tracking**: Konsistensi belajar harian
- **Leaderboard**: Kompetisi sehat antar pengguna

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **AI Integration**: Vercel AI SDK + Google Gemini
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

1. **Google AI Studio API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create a new project and get your API key
   - Enable Gemini API access

2. **Node.js 18+**
3. **npm/yarn/pnpm**

## 🚀 Quick Start

1. **Clone & Install**
   \`\`\`bash
   git clone <repository-url>
   cd hospital-logistics-exam-prep
   npm install
   \`\`\`

2. **Environment Setup**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Add your Google AI Studio API key:
   \`\`\`env
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   \`\`\`

3. **Run Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open Application**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### AI Model Settings
The application uses Google Gemini 1.5 Pro for:
- Question generation
- Answer explanations
- Hint generation
- Question variations

### Customization Options
- **Question Count**: 5, 10, 15, or 20 questions per quiz
- **Topics**: Fully customizable topic areas
- **Difficulty**: Automatic mixed difficulty or specific levels
- **Question Types**: Configurable question type distribution

## 📖 Usage Guide

### For Students
1. **Start Quiz**: Select topic and question count
2. **AI Generation**: Wait for AI to generate personalized questions
3. **Interactive Learning**: Use AI hints and explanations
4. **Track Progress**: Monitor XP, levels, and achievements

### For Administrators
1. **Content Management**: Questions are generated dynamically
2. **Topic Customization**: Modify topics in API routes
3. **Difficulty Tuning**: Adjust AI prompts for difficulty levels
4. **Analytics**: Track user progress and performance

## 🔌 API Endpoints

- `POST /api/generate-questions` - Generate new questions for a topic
- `POST /api/regenerate-question` - Create question variations
- `POST /api/get-explanation` - Get AI explanations for answers
- `POST /api/get-hint` - Get AI hints for questions

## 🎯 AI Integration Details

### Question Generation
\`\`\`typescript
// Example API call
const response = await fetch('/api/generate-questions', {
  method: 'POST',
  body: JSON.stringify({
    topic: 'Manajemen Inventori',
    count: 10,
    difficulty: 'mixed'
  })
})
\`\`\`

### AI Tutoring
- **Contextual Hints**: AI provides guidance without giving away answers
- **Detailed Explanations**: Comprehensive explanations for correct and incorrect answers
- **Adaptive Learning**: Explanations adapt based on user's answer

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- Ensure Node.js 18+ support
- Set environment variables
- Build with `npm run build`
- Start with `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Offline mode capability
- [ ] Advanced question types (drag-drop, matching)
- [ ] Integration with hospital systems
- [ ] Mobile app development

---

**Built with ❤️ for Indonesian healthcare professionals**
\`\`\`

Now the application has full AI integration! Here's what's been implemented:

## 🤖 **Real AI Integration Features:**

### ✅ **Dynamic Question Generation**
- Questions are generated in real-time by Google Gemini[^1]
- Topic-specific prompts with Indonesian hospital logistics context
- Mixed difficulty levels and question types
- Structured output using Zod schemas

### ✅ **AI Tutoring System**
- **Smart Hints**: AI provides guidance without spoilers
- **Adaptive Explanations**: Explanations based on user's actual answer
- **Question Regeneration**: Create variations of existing questions
- **Contextual Learning**: AI understands the specific topic and provides relevant insights

### ✅ **API Architecture**
- `/api/generate-questions` - Bulk question generation
- `/api/regenerate-question` - Single question variations  
- `/api/get-explanation` - Personalized explanations
- `/api/get-hint` - Intelligent hints

### ✅ **AI SDK Integration**
- Uses `generateObject()` for structured question generation[^1]
- Uses `generateText()` for explanations and hints[^1]
- Proper error handling and fallbacks
- Type-safe responses with Zod validation

The application now truly leverages AI capabilities with Google Gemini to create a personalized, adaptive learning experience! 🚀
