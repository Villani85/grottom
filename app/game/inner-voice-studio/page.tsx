"use client"

import { useState, useEffect } from "react"
import {
  Brain,
  Zap,
  Smile,
  Frown,
  ArrowRight,
  CheckCircle,
  BarChart2,
  RefreshCcw,
  Shield,
  Play,
  AlertTriangle,
  Clock,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

// --- DATA: THOUGHTS, DISTORTIONS, REFRAMES ---

const CONTEXTS = [
  { id: "work", label: "Lavoro / Studio", icon: "💼" },
  { id: "social", label: "Relazioni / Sociale", icon: "🗣️" },
  { id: "self", label: "Io / Identità", icon: "🪞" },
  { id: "future", label: "Futuro / Incertezza", icon: "🔮" },
]

const THOUGHTS = {
  work: [
    "Non ce la farò mai in tempo",
    "Ho rovinato tutto il progetto",
    "Tutti noteranno il mio errore",
    "Se non è perfetto, fa schifo",
  ],
  social: [
    "Ce l'hanno tutti con me",
    "Se dico questo, mi giudicheranno",
    "Non sono abbastanza interessante",
    "Mi stanno escludendo apposta",
  ],
  self: ["Sono un impostore", "Non imparerò mai", "Sono fatto così, non cambio", "Non merito questo successo"],
  future: [
    "Andrà sicuramente male",
    "Non riuscirò a gestire l'imprevisto",
    "Resterò bloccato qui per sempre",
    "È troppo tardi per iniziare",
  ],
}

const DISTORTIONS = [
  { id: "all_nothing", title: "Tutto o Niente", desc: "Vedi solo bianco o nero, senza sfumature." },
  { id: "catastrophizing", title: "Catastrofismo", desc: "Prevedi il peggior scenario possibile." },
  { id: "mind_reading", title: "Lettura del Pensiero", desc: "Credi di sapere cosa pensano gli altri (male)." },
  { id: "labeling", title: "Etichettamento", desc: 'Ti definisci con un giudizio globale ("Sono un fallito").' },
  { id: "filtering", title: "Filtro Negativo", desc: "Ignori i successi e vedi solo i difetti." },
  { id: "personalization", title: "Personalizzazione", desc: "Ti dai la colpa di eventi fuori dal tuo controllo." },
]

const REFRAMES = [
  {
    id: "evidence",
    title: "Avvocato del Diavolo",
    prompt: "Qual è una prova concreta che smentisce questo pensiero?",
    icon: "⚖️",
  },
  { id: "scale", title: "Prospettiva 1-10", prompt: "Tra 6 mesi, quanto conterà davvero questo problema?", icon: "📏" },
  { id: "friend", title: "Voce Amica", prompt: "Cosa diresti al tuo migliore amico in questa situazione?", icon: "🤝" },
  { id: "growth", title: "Growth Mindset", prompt: "Cosa posso imparare da questo errore?", icon: "🌱" },
  { id: "nuance", title: "Sfumature di Grigio", prompt: "Qual è una via di mezzo realistica?", icon: "🎨" },
]

const ACTIONS = [
  {
    id: "timer_2",
    title: "Regola dei 2 Minuti",
    desc: "Fai il primo piccolissimo passo ora.",
    type: "timer",
    duration: 120,
  },
  { id: "breathe", title: "Box Breathing", desc: "Calma l'amigdala per ragionare.", type: "timer", duration: 60 },
  { id: "write", title: "Dump Mentale", desc: "Scrivi 3 bullet point su carta (offline).", type: "manual" },
  { id: "ask", title: "Verifica Realtà", desc: "Chiedi un feedback neutro a qualcuno.", type: "manual" },
  { id: "posture", title: "Reset Postura", desc: "Alzati, stira la schiena, guarda lontano.", type: "manual" },
]

// --- APP COMPONENT ---

const InnerVoiceStudio = () => {
  const [view, setView] = useState("home") // home, context, thought, distortion, reframe, action, active_action, feedback, report
  const [session, setSession] = useState({
    context: null,
    thought: null,
    distortion: null,
    reframe: null,
    action: null,
    preMood: 3,
    postMood: null,
  })

  const [stats, setStats] = useState({
    streak: 4,
    totalSessions: 23,
    distortionsCount: [
      { name: "Catastrofismo", count: 8 },
      { name: "Tutto/Niente", count: 5 },
      { name: "Lettura Pensiero", count: 4 },
      { name: "Altro", count: 6 },
    ],
  })

  // Navigation Handlers
  const startSession = () => {
    setSession({
      context: null,
      thought: null,
      distortion: null,
      reframe: null,
      action: null,
      preMood: 3,
      postMood: null,
    })
    setView("context")
  }

  const handleContextSelect = (ctx) => {
    setSession((p) => ({ ...p, context: ctx }))
    setView("thought")
  }

  const handleThoughtSelect = (txt) => {
    setSession((p) => ({ ...p, thought: txt }))
    setView("distortion")
  }

  const handleDistortionSelect = (dist) => {
    setSession((p) => ({ ...p, distortion: dist }))
    setView("reframe")
  }

  const handleReframeSelect = (ref) => {
    setSession((p) => ({ ...p, reframe: ref }))
    setView("action")
  }

  const handleActionSelect = (act) => {
    setSession((p) => ({ ...p, action: act }))
    if (act.type === "timer") {
      setView("active_action")
    } else {
      setView("feedback")
    }
  }

  const completeSession = (mood) => {
    // Logic to save stats would go here
    setStats((prev) => ({
      ...prev,
      totalSessions: prev.totalSessions + 1,
      streak: prev.streak, // Logic for streak update omitted for brevity
    }))
    setView("home")
  }

  return (
    <div className="min-h-screen bg-[#000E20] font-sans text-slate-800 selection:bg-[#005FD7]">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-2xl overflow-hidden relative flex flex-col">
        {view === "home" && <HomeScreen stats={stats} onStart={startSession} onViewReport={() => setView("report")} />}

        {view === "context" && <ContextScreen onSelect={handleContextSelect} onBack={() => setView("home")} />}

        {view === "thought" && (
          <ThoughtScreen context={session.context} onSelect={handleThoughtSelect} onBack={() => setView("context")} />
        )}

        {view === "distortion" && (
          <DistortionScreen onSelect={handleDistortionSelect} onBack={() => setView("thought")} />
        )}

        {view === "reframe" && (
          <ReframeScreen
            thought={session.thought}
            onSelect={handleReframeSelect}
            onBack={() => setView("distortion")}
          />
        )}

        {view === "action" && (
          <ActionScreen reframe={session.reframe} onSelect={handleActionSelect} onBack={() => setView("reframe")} />
        )}

        {view === "active_action" && (
          <ActiveActionScreen action={session.action} onComplete={() => setView("feedback")} />
        )}

        {view === "feedback" && <FeedbackScreen onComplete={completeSession} />}

        {view === "report" && <ReportScreen stats={stats} onHome={() => setView("home")} />}
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---

const HomeScreen = ({ stats, onStart, onViewReport }) => (
  <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-500">
    {/* Header */}
    <div className="flex justify-between items-center mb-10">
      <div className="flex items-center space-x-2 font-black text-xl text-[#005FD7]">
        <Brain className="fill-current" />
        <span>Inner Voice</span>
      </div>
      <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
        <Zap size={16} className="text-orange-500 fill-orange-500" />
        <span className="font-bold text-sm text-slate-600">{stats.streak} Streak</span>
      </div>
    </div>

    {/* Hero */}
    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
      <div className="relative group cursor-pointer" onClick={onStart}>
        <div className="absolute inset-0 bg-[#005FD7] rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="w-32 h-32 bg-white border-4 border-[#005FD7]/20 rounded-full flex items-center justify-center shadow-xl relative z-10 hover:scale-105 transition-transform">
          <RefreshCcw size={48} className="text-[#005FD7]" />
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-black text-slate-800 mb-2">Cambia Prospettiva</h1>
        <p className="text-slate-400 font-medium max-w-xs mx-auto">
          Riconosci la distorsione, scegli il reframe, agisci. In 3 minuti.
        </p>
      </div>

      <button
        onClick={onStart}
        className="w-full bg-[#005FD7] text-white py-5 rounded-2xl font-bold text-xl shadow-lg hover:bg-[#0051b8] transition-all active:scale-95 flex items-center justify-center"
      >
        Start Sessione <ArrowRight className="ml-2" />
      </button>
    </div>

    {/* Footer */}
    <div className="mt-auto pt-8">
      <button
        onClick={onViewReport}
        className="w-full py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 flex items-center justify-center"
      >
        <BarChart2 className="mr-2" /> Vedi Analisi
      </button>
    </div>
  </div>
)

const ContextScreen = ({ onSelect, onBack }) => (
  <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-300">
    <div className="flex items-center mb-8">
      <button onClick={onBack} className="p-2 bg-slate-100 rounded-full mr-4 text-slate-500">
        <ArrowRight className="rotate-180" />
      </button>
      <h2 className="text-2xl font-bold text-slate-800">Dove sei bloccato?</h2>
    </div>

    <div className="grid grid-cols-1 gap-4">
      {CONTEXTS.map((ctx) => (
        <button
          key={ctx.id}
          onClick={() => onSelect(ctx)}
          className="p-6 bg-white border-2 border-slate-100 hover:border-[#005FD7] rounded-2xl text-left flex items-center transition-all active:scale-95 shadow-sm group"
        >
          <span className="text-3xl mr-4">{ctx.icon}</span>
          <span className="font-bold text-lg text-slate-700 group-hover:text-[#005FD7]">{ctx.label}</span>
        </button>
      ))}
    </div>
  </div>
)

const ThoughtScreen = ({ context, onSelect, onBack }) => (
  <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-300">
    <div className="flex items-center mb-2">
      <button onClick={onBack} className="p-2 bg-slate-100 rounded-full mr-4 text-slate-500">
        <ArrowRight className="rotate-180" />
      </button>
      <span className="text-xs font-bold uppercase tracking-wider text-[#005FD7] bg-[#005FD7]/10 px-2 py-1 rounded">
        {context.label}
      </span>
    </div>
    <h2 className="text-2xl font-bold text-slate-800 mb-8">Cosa ti stai dicendo?</h2>

    <div className="space-y-3">
      {THOUGHTS[context.id].map((txt, i) => (
        <button
          key={i}
          onClick={() => onSelect(txt)}
          className="w-full p-5 bg-white border-2 border-slate-100 hover:border-[#005FD7] rounded-2xl text-left font-medium text-slate-600 transition-all active:scale-95 shadow-sm hover:text-slate-900"
        >
          "{txt}"
        </button>
      ))}
      <button className="w-full p-4 text-center text-slate-400 text-sm font-bold mt-4 hover:text-[#005FD7]">
        + Altro (Non scrivere, scegli simile)
      </button>
    </div>
  </div>
)

const DistortionScreen = ({ onSelect, onBack }) => (
  <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-300">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="p-2 bg-slate-100 rounded-full mr-4 text-slate-500">
        <ArrowRight className="rotate-180" />
      </button>
      <h2 className="text-2xl font-bold text-slate-800">Che trucco è?</h2>
    </div>
    <p className="text-slate-500 mb-6 -mt-4">Identifica la distorsione cognitiva.</p>

    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
      {DISTORTIONS.map((dist) => (
        <button
          key={dist.id}
          onClick={() => onSelect(dist)}
          className="w-full p-5 bg-white border-2 border-slate-100 hover:border-red-400 rounded-2xl text-left transition-all active:scale-95 shadow-sm group"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold text-slate-800 group-hover:text-red-600">{dist.title}</span>
            <AlertTriangle size={16} className="text-slate-300 group-hover:text-red-400" />
          </div>
          <p className="text-xs text-slate-500 leading-snug">{dist.desc}</p>
        </button>
      ))}
    </div>
  </div>
)

const ReframeScreen = ({ thought, onSelect, onBack }) => (
  <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-300">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="p-2 bg-slate-100 rounded-full mr-4 text-slate-500">
        <ArrowRight className="rotate-180" />
      </button>
      <h2 className="text-2xl font-bold text-slate-800">Scegli la Svolta</h2>
    </div>

    <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-6 italic text-slate-600 text-sm">
      "{thought}"
    </div>

    <div className="flex-1 overflow-y-auto space-y-3">
      {REFRAMES.map((ref) => (
        <button
          key={ref.id}
          onClick={() => onSelect(ref)}
          className="w-full p-5 bg-white border-2 border-slate-100 hover:border-green-500 rounded-2xl text-left transition-all active:scale-95 shadow-sm group"
        >
          <div className="flex items-center mb-2">
            <span className="text-xl mr-3">{ref.icon}</span>
            <span className="font-bold text-slate-800 group-hover:text-green-600">{ref.title}</span>
          </div>
          <p className="text-sm text-slate-500 font-medium pl-8 border-l-2 border-slate-200 group-hover:border-green-200">
            {ref.prompt}
          </p>
        </button>
      ))}
    </div>
  </div>
)

const ActionScreen = ({ reframe, onSelect, onBack }) => (
  <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-300 bg-slate-50">
    <div className="flex items-center mb-6">
      <button onClick={onBack} className="p-2 bg-white rounded-full mr-4 text-slate-500 shadow-sm">
        <ArrowRight className="rotate-180" />
      </button>
      <h2 className="text-2xl font-bold text-slate-800">Attiva il Reframe</h2>
    </div>

    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 mb-8 text-center">
      <div className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Strategia Scelta</div>
      <div className="text-xl font-black text-slate-800 mb-1">{reframe.title}</div>
      <div className="text-sm text-slate-500">{reframe.prompt}</div>
    </div>

    <p className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-4">Scegli Micro-Azione (2 Min)</p>

    <div className="space-y-3">
      {ACTIONS.map((act) => (
        <button
          key={act.id}
          onClick={() => onSelect(act)}
          className="w-full p-4 bg-white border border-slate-200 hover:border-[#005FD7] hover:bg-[#005FD7]/5 rounded-xl text-left flex justify-between items-center transition-all active:scale-95 shadow-sm"
        >
          <div>
            <div className="font-bold text-slate-700">{act.title}</div>
            <div className="text-xs text-slate-500">{act.desc}</div>
          </div>
          {act.type === "timer" ? (
            <Play size={20} className="text-[#005FD7]" />
          ) : (
            <CheckCircle size={20} className="text-slate-300" />
          )}
        </button>
      ))}
    </div>
  </div>
)

const ActiveActionScreen = ({ action, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(action.duration)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    let interval = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      onComplete()
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const progress = ((action.duration - timeLeft) / action.duration) * 100

  return (
    <div className="flex-1 flex flex-col p-6 animate-in zoom-in duration-500 bg-[#000E20] text-white">
      <div className="flex justify-between items-center mb-12">
        <h2 className="font-bold text-slate-300 flex items-center">
          <Clock className="mr-2" size={20} /> Micro-Azione
        </h2>
        <button onClick={onComplete} className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">
          Salta
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="mb-8 relative">
          <div className="w-64 h-64 rounded-full border-8 border-slate-700 flex items-center justify-center">
            <div className="text-6xl font-mono font-black tabular-nums">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          </div>
          <svg className="absolute top-0 left-0 w-64 h-64 -rotate-90 pointer-events-none">
            <circle
              cx="128"
              cy="128"
              r="124"
              fill="none"
              stroke="#005FD7"
              strokeWidth="8"
              strokeDasharray="779"
              strokeDashoffset={779 - (779 * progress) / 100}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-4">{action.title}</h1>
        <p className="text-slate-400 max-w-xs text-lg">{action.desc}</p>
      </div>

      <button
        onClick={() => setIsActive(!isActive)}
        className="mt-auto w-full bg-white text-slate-900 py-5 rounded-2xl font-bold text-xl hover:bg-slate-200"
      >
        {isActive ? "Pausa" : "Riprendi"}
      </button>
    </div>
  )
}

const FeedbackScreen = ({ onComplete }) => {
  const [mood, setMood] = useState(3)

  return (
    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-bottom duration-300 items-center justify-center text-center">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <CheckCircle size={40} />
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-2">Ottimo lavoro!</h2>
      <p className="text-slate-500 mb-10">Come ti senti adesso?</p>

      <div className="w-full bg-slate-100 p-6 rounded-3xl mb-8">
        <div className="flex justify-between mb-4 px-2">
          <Frown size={24} className={mood <= 2 ? "text-slate-800" : "text-slate-300"} />
          <span className="font-bold text-2xl text-[#005FD7]">{mood}</span>
          <Smile size={24} className={mood >= 4 ? "text-slate-800" : "text-slate-300"} />
        </div>
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={mood}
          onChange={(e) => setMood(Number.parseInt(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          style={{ accentColor: "#005FD7" }}
        />
      </div>

      <button
        onClick={() => onComplete(mood)}
        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:bg-black transition-transform active:scale-95"
      >
        Chiudi Sessione
      </button>
    </div>
  )
}

const ReportScreen = ({ stats, onHome }) => (
  <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-300 bg-slate-50">
    <div className="flex items-center mb-8">
      <button onClick={onHome} className="p-2 bg-white rounded-full mr-4 text-slate-500 shadow-sm">
        <ArrowRight className="rotate-180" />
      </button>
      <h2 className="text-2xl font-bold text-slate-800">I Tuoi Pattern</h2>
    </div>

    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Distorsioni Frequenti</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.distortionsCount} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: "#64748b" }}
              width={100}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "transparent" }} />
            <Bar dataKey="count" fill="#005FD7" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="text-3xl font-black text-slate-800">{stats.totalSessions}</div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sessioni</div>
      </div>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="text-3xl font-black text-[#005FD7]">{stats.streak}</div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Giorni Streak</div>
      </div>
    </div>

    <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-[#005FD7]">
      <h3 className="font-bold text-slate-800 mb-2 flex items-center">
        <Shield className="mr-2 text-[#005FD7]" size={20} />
        Insight Principale
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed">
        Il tuo pattern più frequente è il <strong>Catastrofismo</strong>. Prova a chiederti: "Qual è lo scenario più
        realistico?" prima di immaginare il peggio.
      </p>
    </div>

    <button
      onClick={onHome}
      className="mt-6 w-full bg-[#005FD7] text-white py-4 rounded-2xl font-bold hover:bg-[#0051b8] transition-all active:scale-95"
    >
      Torna alla Home
    </button>
  </div>
)

export default InnerVoiceStudio
