"use client"

import { useState } from "react"
import {
  Compass,
  Map,
  CheckCircle,
  ArrowRight,
  Shield,
  Activity,
  Heart,
  Briefcase,
  DollarSign,
  User,
  Sparkles,
  Loader2,
  Share2,
  Home,
  ChevronRight,
} from "lucide-react"

// --- CONFIG ---
const apiKey = "" // Inserita a runtime

// --- DATA ---

const VALUES_POOL = [
  { id: "freedom", label: "Libertà", icon: "🕊️" },
  { id: "security", label: "Sicurezza", icon: "🛡️" },
  { id: "growth", label: "Crescita", icon: "🌱" },
  { id: "integrity", label: "Integrità", icon: "⚖️" },
  { id: "impact", label: "Impatto", icon: "💥" },
  { id: "connection", label: "Connessione", icon: "🤝" },
  { id: "mastery", label: "Maestria", icon: "🥇" },
  { id: "pleasure", label: "Piacere", icon: "🎉" },
  { id: "power", label: "Potere", icon: "👑" },
  { id: "peace", label: "Pace", icon: "☮️" },
  { id: "adventure", label: "Avventura", icon: "🧭" },
  { id: "tradition", label: "Tradizione", icon: "🏛️" },
]

const TRADEOFFS = [
  {
    id: "speed_quality",
    left: "Velocità",
    right: "Qualità",
    desc: "Meglio fatto che perfetto vs Meglio perfetto che fatto.",
  },
  { id: "indiv_team", left: "Individuo", right: "Team", desc: "Autonomia totale vs Collaborazione costante." },
  { id: "risk_security", left: "Rischio", right: "Sicurezza", desc: "Osa l'ignoto vs Proteggi ciò che hai." },
  { id: "work_life", left: "Carriera", right: "Vita", desc: "Ambizione professionale vs Tempo personale." },
]

const POLICIES = [
  {
    id: "focus_deep",
    title: "Deep Work Protocol",
    if: "Se sono le 9:00",
    then: "Telefono in altra stanza e 2h di focus.",
    area: "focus",
  },
  {
    id: "decide_rev",
    title: "Decisioni Veloci",
    if: "Se è reversibile",
    then: "Decido entro 10 minuti.",
    area: "decisions",
  },
  {
    id: "health_screen",
    title: "Digital Sunset",
    if: "Se sono le 22:00",
    then: "Tutti gli schermi spenti.",
    area: "health",
  },
  {
    id: "money_wait",
    title: "Regola 24h",
    if: "Se costa > 100€",
    then: "Aspetto 24 ore prima di comprare.",
    area: "money",
  },
  {
    id: "social_no",
    title: "Il No Gentile",
    if: 'Se non è un "Sì Wow"',
    then: 'Dico "No grazie" educatamente.',
    area: "relationships",
  },
]

// --- API UTILS ---

const callGemini = async (prompt, systemInstruction = "") => {
  if (!apiKey) return null
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { responseMimeType: "application/json" },
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    return text ? JSON.parse(text) : null
  } catch (e) {
    console.error("Gemini API error", e)
    return null
  }
}

// --- APP COMPONENT ---

const ValuesCompass = () => {
  const [view, setView] = useState("home") // home, context_select, duels, tradeoffs, policies, playbook, report
  const [userProfile, setUserProfile] = useState({
    topValues: [],
    tradeoffScores: {}, // id: 1-5
    activePolicies: [],
    streak: 12,
    coherence: 85,
  })

  // Duel State
  const [duelQueue, setDuelQueue] = useState([])
  const [currentDuelIndex, setCurrentDuelIndex] = useState(0)
  const [valueScores, setValueScores] = useState({})
  const [isAiLoading, setIsAiLoading] = useState(false)

  // Manifesto AI
  const [manifesto, setManifesto] = useState(null)

  // Actions
  const startStandardSession = () => {
    // Generate random pairs from pool
    const queue = []
    for (let i = 0; i < 10; i++) {
      const v1 = VALUES_POOL[Math.floor(Math.random() * VALUES_POOL.length)]
      let v2 = VALUES_POOL[Math.floor(Math.random() * VALUES_POOL.length)]
      while (v1.id === v2.id) v2 = VALUES_POOL[Math.floor(Math.random() * VALUES_POOL.length)]
      queue.push({ left: v1, right: v2 })
    }
    setDuelQueue(queue)
    setCurrentDuelIndex(0)
    setValueScores({})
    setView("duels")
  }

  const startAiSession = async (context) => {
    setIsAiLoading(true)
    const prompt = `
      Genera 8 coppie di valori in conflitto specifici per il contesto: "${context}".
      Devono essere dilemmi difficili e realistici per quel contesto.
      Usa solo questi valori come base se possibile, o simili: Libertà, Sicurezza, Crescita, Integrità, Impatto, Connessione, Maestria, Piacere, Potere, Pace, Avventura, Tradizione.
      
      Rispondi in JSON array: 
      [
        { "left": {"id": "string", "label": "string", "icon": "emoji"}, "right": {"id": "string", "label": "string", "icon": "emoji"} }
      ]
    `

    const duels = await callGemini(prompt, "Sei un filosofo morale esperto di valori.")
    setIsAiLoading(false)

    if (duels && Array.isArray(duels)) {
      setDuelQueue(duels)
      setCurrentDuelIndex(0)
      setValueScores({})
      setView("duels")
    } else {
      startStandardSession() // Fallback
    }
  }

  const handleDuelVote = (winnerId) => {
    setValueScores((prev) => ({
      ...prev,
      [winnerId]: (prev[winnerId] || 0) + 1,
    }))

    if (currentDuelIndex < duelQueue.length - 1) {
      setCurrentDuelIndex((prev) => prev + 1)
    } else {
      // Calculate winners
      const sorted = Object.entries(valueScores).sort((a, b) => b[1] - a[1])
      // Just take top 3 IDs for now, mapping back to objects is complex without full pool,
      // but for MVP we assume IDs match or we store full objects.
      // Simplification: We just store IDs.
      const topIds = sorted.slice(0, 3).map((s) => s[0])
      setUserProfile((prev) => ({ ...prev, topValues: topIds }))
      setView("tradeoffs")
    }
  }

  const generateManifesto = async () => {
    if (!apiKey) {
      setManifesto("API Key mancante per il manifesto.")
      return
    }
    setManifesto("Scrittura in corso...")

    // Convert tradeoffs to readable string
    const tradeoffText = Object.entries(userProfile.tradeoffScores)
      .map(([k, v]) => `${k}: ${v}/5`)
      .join(", ")

    const prompt = `
      Scrivi un "Manifesto Identitario" di 3 righe in prima persona per un utente con questi Valori Top: ${userProfile.topValues.join(", ")}.
      Le sue preferenze di Trade-off sono: ${tradeoffText} (dove 1 è sinistra, 5 è destra).
      Il tono deve essere epico, stoico e orientato all'azione.
      
      Rispondi in JSON: { "text": "string" }
    `

    const result = await callGemini(prompt, "Sei un coach di leadership.")
    if (result) setManifesto(result.text)
    else setManifesto("Impossibile generare il manifesto.")
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-100 selection:bg-amber-500">
      <main className="max-w-md mx-auto min-h-screen flex flex-col relative bg-slate-900 border-x border-slate-800 shadow-2xl">
        {view === "home" && (
          <HomeScreen
            stats={userProfile}
            onStandard={startStandardSession}
            onAiContext={() => setView("context_select")}
            onViewPlaybook={() => setView("playbook")}
          />
        )}

        {view === "context_select" && (
          <ContextSelectScreen onSelect={startAiSession} onBack={() => setView("home")} isLoading={isAiLoading} />
        )}

        {view === "duels" && (
          <DuelScreen
            duel={duelQueue[currentDuelIndex]}
            progress={{ current: currentDuelIndex + 1, total: duelQueue.length }}
            onVote={handleDuelVote}
          />
        )}

        {view === "tradeoffs" && (
          <TradeoffScreen
            onComplete={(scores) => {
              setUserProfile((p) => ({ ...p, tradeoffScores: scores }))
              setView("policies")
            }}
          />
        )}

        {view === "policies" && (
          <PoliciesScreen
            onComplete={(selectedPolicies) => {
              setUserProfile((p) => ({ ...p, activePolicies: selectedPolicies }))
              setView("playbook")
              generateManifesto()
            }}
          />
        )}

        {view === "playbook" && (
          <PlaybookScreen profile={userProfile} manifesto={manifesto} onHome={() => setView("home")} />
        )}
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---

const HomeScreen = ({ stats, onStandard, onAiContext, onViewPlaybook }) => (
  <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-500">
    <div className="flex justify-between items-center mb-10">
      <div className="flex items-center space-x-2 font-black text-xl text-amber-500">
        <Compass className="fill-current" />
        <span>Compass</span>
      </div>
      <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
        <Activity size={16} className="text-green-400" />
        <span className="font-bold text-sm text-slate-300">{stats.coherence}% Coerenza</span>
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
      <div className="relative group cursor-pointer">
        <div className="absolute inset-0 bg-amber-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="w-32 h-32 bg-slate-800 border-4 border-slate-700 rounded-full flex items-center justify-center shadow-2xl relative z-10 hover:scale-105 transition-transform">
          <Map size={48} className="text-amber-500" />
        </div>
      </div>

      <div>
        <h1 className="text-4xl font-black text-white mb-2">Trova il Nord</h1>
        <p className="text-slate-400 text-lg max-w-xs mx-auto">Scopri i tuoi valori reali e allinea le tue scelte.</p>
      </div>

      <div className="w-full space-y-3 pt-4">
        <button
          onClick={onAiContext}
          className="w-full bg-amber-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-amber-500 transition-all active:scale-95 flex items-center justify-center border-t border-amber-400"
        >
          <Sparkles size={20} className="mr-2" />
          Compasso AI (Context)
        </button>

        <button
          onClick={onStandard}
          className="w-full bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all active:scale-95 border border-slate-700"
        >
          Sessione Standard
        </button>
      </div>
    </div>

    <button
      onClick={onViewPlaybook}
      className="mt-auto py-4 text-slate-500 font-bold text-sm hover:text-white uppercase tracking-wider flex items-center justify-center"
    >
      Apri Playbook <ChevronRight size={16} className="ml-1" />
    </button>
  </div>
)

const ContextSelectScreen = ({ onSelect, onBack, isLoading }) => {
  if (isLoading)
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
        <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Generazione Duelli...</h2>
        <p className="text-slate-400">L'IA sta creando dilemmi etici su misura per te.</p>
      </div>
    )

  return (
    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full mr-4 text-slate-400 hover:text-white">
          <ArrowRight className="rotate-180" size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white">Scegli Contesto</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { id: "Leadership", icon: <Briefcase /> },
          { id: "Relazioni", icon: <Heart /> },
          { id: "Carriera", icon: <DollarSign /> },
          { id: "Crescita Personale", icon: <User /> },
        ].map((ctx) => (
          <button
            key={ctx.id}
            onClick={() => onSelect(ctx.id)}
            className="p-6 bg-slate-800 border border-slate-700 hover:border-amber-500 hover:bg-slate-700/50 rounded-2xl text-left flex items-center transition-all active:scale-95 group"
          >
            <div className="p-3 bg-slate-900 rounded-xl mr-4 text-slate-300 group-hover:text-amber-400">{ctx.icon}</div>
            <span className="font-bold text-lg text-white">{ctx.id}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const DuelScreen = ({ duel, progress, onVote }) => (
  <div className="flex-1 flex flex-col p-6 animate-in zoom-in duration-300">
    <div className="text-center mb-8">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
        Duello {progress.current} / {progress.total}
      </span>
      <div className="w-full bg-slate-800 h-1 rounded-full mt-2">
        <div
          className="bg-amber-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${(progress.current / progress.total) * 100}%` }}
        ></div>
      </div>
    </div>

    <h2 className="text-3xl font-black text-center text-white mb-10 leading-tight">
      Cosa conta di più
      <br />
      per te adesso?
    </h2>

    <div className="flex-1 flex flex-col justify-center space-y-6">
      <button
        onClick={() => onVote(duel.left.id || duel.left.label)} // Fallback if AI generates weird IDs
        className="flex-1 bg-slate-800 border-2 border-slate-700 hover:border-amber-500 rounded-3xl p-8 flex flex-col items-center justify-center transition-all active:scale-95 group"
      >
        <div className="text-6xl mb-4 transform group-hover:scale-110 transition">{duel.left.icon}</div>
        <span className="text-2xl font-bold text-white">{duel.left.label}</span>
      </button>

      <div className="text-center text-slate-500 font-bold text-sm uppercase">VS</div>

      <button
        onClick={() => onVote(duel.right.id || duel.right.label)}
        className="flex-1 bg-slate-800 border-2 border-slate-700 hover:border-amber-500 rounded-3xl p-8 flex flex-col items-center justify-center transition-all active:scale-95 group"
      >
        <div className="text-6xl mb-4 transform group-hover:scale-110 transition">{duel.right.icon}</div>
        <span className="text-2xl font-bold text-white">{duel.right.label}</span>
      </button>
    </div>
  </div>
)

const TradeoffScreen = ({ onComplete }) => {
  const [scores, setScores] = useState({})

  const handleSlider = (id, val) => {
    setScores((p) => ({ ...p, [id]: val }))
  }

  const isComplete = Object.keys(scores).length === TRADEOFFS.length

  return (
    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-300">
      <h2 className="text-2xl font-bold text-white mb-2">Definisci Equilibri</h2>
      <p className="text-slate-400 mb-8">Dove ti posizioni in questi trade-off?</p>

      <div className="space-y-8 mb-8">
        {TRADEOFFS.map((t) => (
          <div key={t.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
            <div className="flex justify-between text-sm font-bold text-slate-300 mb-4">
              <span>{t.left}</span>
              <span>{t.right}</span>
            </div>

            <div className="flex justify-between items-center relative px-2">
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-700 -z-0"></div>
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => handleSlider(t.id, val)}
                  className={`w-8 h-8 rounded-full z-10 flex items-center justify-center font-bold text-xs transition-all ${scores[t.id] === val ? "bg-amber-500 text-slate-900 scale-125 shadow-lg shadow-amber-500/50" : "bg-slate-600 text-slate-400 hover:bg-slate-500"}`}
                >
                  {val}
                </button>
              ))}
            </div>
            <p className="text-xs text-center text-slate-500 mt-4 italic">{t.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => onComplete(scores)}
        disabled={!isComplete}
        className="mt-auto w-full bg-amber-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-500"
      >
        Avanti
      </button>
    </div>
  )
}

const PoliciesScreen = ({ onComplete }) => {
  const [selected, setSelected] = useState([])

  const togglePolicy = (id) => {
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id))
    else setSelected([...selected, id])
  }

  return (
    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-300">
      <h2 className="text-2xl font-bold text-white mb-2">Attiva Regole</h2>
      <p className="text-slate-400 mb-8">Scegli i comportamenti automatici (If-Then).</p>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {POLICIES.map((pol) => {
          const isActive = selected.includes(pol.id)
          return (
            <div
              key={pol.id}
              onClick={() => togglePolicy(pol.id)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${isActive ? "bg-amber-900/20 border-amber-500" : "bg-slate-800 border-slate-700 opacity-80 hover:opacity-100"}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-sm font-bold uppercase tracking-wider ${isActive ? "text-amber-400" : "text-slate-500"}`}
                >
                  {pol.area}
                </span>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isActive ? "bg-amber-500 border-amber-500" : "border-slate-500"}`}
                >
                  {isActive && <CheckCircle size={16} className="text-slate-900" />}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{pol.title}</h3>
              <div className="flex items-center text-sm">
                <span className="text-amber-200 font-mono bg-amber-900/40 px-2 py-0.5 rounded mr-2">IF</span>
                <span className="text-slate-300">{pol.if}</span>
              </div>
              <div className="flex items-center text-sm mt-1">
                <span className="text-green-200 font-mono bg-green-900/40 px-2 py-0.5 rounded mr-2">THEN</span>
                <span className="text-slate-300">{pol.then}</span>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => onComplete(selected)}
        disabled={selected.length === 0}
        className="mt-6 w-full bg-amber-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg disabled:opacity-50"
      >
        Genera Playbook
      </button>
    </div>
  )
}

const PlaybookScreen = ({ profile, manifesto, onHome }) => (
  <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-bottom duration-500 bg-slate-900 overflow-y-auto">
    <div className="flex items-center mb-8">
      <button onClick={onHome} className="p-2 bg-slate-800 rounded-full mr-4 text-slate-400 hover:text-white">
        <ArrowRight className="rotate-180" size={24} />
      </button>
      <h2 className="text-2xl font-bold text-white">Il Tuo Playbook</h2>
    </div>

    {/* MANIFESTO CARD */}
    <div className="bg-gradient-to-br from-amber-600 to-orange-700 p-6 rounded-3xl shadow-xl mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <Sparkles size={60} className="text-white" />
      </div>
      <h3 className="text-amber-100 font-bold text-xs uppercase tracking-widest mb-3">Manifesto Identitario</h3>
      {manifesto ? (
        <p className="text-white text-lg font-serif italic leading-relaxed">"{manifesto}"</p>
      ) : (
        <div className="flex items-center text-amber-200">
          <Loader2 className="animate-spin mr-2" size={20} /> Scrittura AI in corso...
        </div>
      )}
    </div>

    {/* VALUES GRID */}
    <div className="mb-8">
      <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Top Values</h3>
      <div className="flex space-x-3">
        {profile.topValues.map((val, i) => (
          <div key={i} className="flex-1 bg-slate-800 border border-slate-700 p-4 rounded-2xl text-center">
            <div className="text-2xl mb-1 capitalize">{typeof val === "string" && val.length < 3 ? val : "💎"}</div>{" "}
            {/* Simple fallback if ID is not emoji */}
            <div className="font-bold text-white text-sm capitalize">{val}</div>
          </div>
        ))}
      </div>
    </div>

    {/* ACTIVE POLICIES */}
    <div className="mb-8">
      <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Regole Attive</h3>
      <div className="space-y-3">
        {profile.activePolicies.map((pid) => {
          const p = POLICIES.find((x) => x.id === pid)
          return (
            <div
              key={pid}
              className="bg-slate-800/50 p-4 rounded-xl border-l-4 border-green-500 flex justify-between items-center"
            >
              <div>
                <div className="font-bold text-white text-sm">{p.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {p.if} → {p.then}
                </div>
              </div>
              <Shield size={16} className="text-green-500" />
            </div>
          )
        })}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 mt-auto">
      <button className="py-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-bold flex flex-col items-center justify-center hover:bg-slate-700 transition">
        <Share2 size={20} className="mb-1" />
        Condividi
      </button>
      <button
        onClick={onHome}
        className="py-4 bg-white text-slate-900 rounded-xl font-bold flex flex-col items-center justify-center hover:bg-slate-200 transition"
      >
        <Home size={20} className="mb-1" />
        Home
      </button>
    </div>
  </div>
)

export default ValuesCompass
