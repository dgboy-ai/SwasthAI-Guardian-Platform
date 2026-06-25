import Navbar from '../components/Navbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-3">About Us</p>
        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-8">SwasthAI Guardian</h1>

        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-600 leading-relaxed">
            SwasthAI Guardian is an AI-powered rural health connectivity platform built for Bharat's 600M+ rural population. We bridge the gap between village-level ASHA workers, district health officials, and state-level policymakers using a real-time, offline-first, multi-modal AI stack.
          </p>

          <h2 className="text-2xl font-black text-slate-900 mt-12 mb-4">The Problem</h2>
          <p className="text-slate-600 leading-relaxed">
            Over 70% of India's healthcare infrastructure is concentrated in urban areas, yet 65% of the population lives in rural villages. ASHA workers — the frontline health warriors — operate with paper registers, no real-time data, and zero AI assistance. Outbreaks go undetected, maternal deaths go unreported, and preventable diseases spread silently.
          </p>

          <h2 className="text-2xl font-black text-slate-900 mt-12 mb-4">Our Solution</h2>
          <p className="text-slate-600 leading-relaxed">
            SwasthAI Guardian provides a unified AI-powered platform connecting villagers, ASHA workers, NGOs, and district health officials. Key capabilities include:
          </p>
          <ul className="list-disc pl-6 text-slate-600 space-y-2 mt-4">
            <li><strong>AI Symptom Checker</strong> — Offline-first ML model (101 diseases, 64.8% accuracy, 7 languages)</li>
            <li><strong>Sakhi AI</strong> — Women's health chatbot with RAG over WHO/MoHFW protocols</li>
            <li><strong>Outbreak Monitor</strong> — Autonomous agent scanning for disease clusters and outbreak detection</li>
            <li><strong>Ambulance Dispatch</strong> — Real-time emergency geolocation and routing</li>
            <li><strong>Maternal & Child Health</strong> — High-risk pregnancy tracking, nutrition monitoring</li>
            <li><strong>Offline-First PWA</strong> — Full functionality on 2G networks with IndexedDB sync queues</li>
          </ul>

          <h2 className="text-2xl font-black text-slate-900 mt-12 mb-4">Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {[
              { cat: 'Frontend', tech: 'React 18 + Vite + Tailwind + PWA' },
              { cat: 'Backend', tech: 'Node.js + Express + WebSockets' },
              { cat: 'Database', tech: 'AWS DynamoDB + Aurora PostgreSQL' },
              { cat: 'AI/ML', tech: 'FastAPI + scikit-learn + Groq LLM' },
              { cat: 'Deployment', tech: 'Vercel (frontend) + Render (backend)' },
              { cat: 'Security', tech: 'JWT + Bcrypt + DI SHA consent + Audit logs' },
            ].map(({ cat, tech }) => (
              <div key={cat} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[8px] font-black uppercase tracking-wider text-emerald-600 mb-1">{cat}</p>
                <p className="text-xs font-semibold text-slate-800">{tech}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
