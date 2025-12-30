"use client"

import { useState, useEffect } from "react"
import { Target, TrendingUp, BarChart2, RefreshCcw, Shield, Home, Share2, Sparkles, Brain, Loader2 } from "lucide-react"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from "recharts"

// --- CONFIG ---
const apiKey = "" // Inserita a runtime dall'ambiente

// --- DATA: STATIC SCENARIOS (Fallback) ---
const STATIC_SCENARIOS = [
  {
    id: 1,
    category: "Marketing",
    title: "A/B Test Headline",
    context: 'Stai testando una nuova headline "emotiva" contro quella "descrittiva" attuale sulla Home Page.',
    baseRateInfo: "Nel settore SaaS B2B, solo 1 test su 5 su headline produce un uplift significativo (>5%).",
    baseRateOptions: [20, 50, 80],
    correctBaseRate: 20,
    evidence: "Dopo 500 visite (campione piccolo), la variante B è avanti del 15%.",
    outcome: 0,
    outcomeDesc: "FAIL. Al raggiungimento della significatività statistica, la variante B è tornata pari alla A.",
    explanation:
      'Un campione piccolo (500 visite) è "rumore". L\'evidenza era DEBOLE. Avresti dovuto restare vicino al base rate (20-30%).',
  },
  {
    id: 2,
    category: "Prodotto",
    title: "Lancio Feature",
    context: 'Lanci una nuova feature "Dark Mode" molto richiesta dagli utenti power user.',
    baseRateInfo: "In app simili, l'adozione di feature estetiche tocca il 40% della user base nel primo mese.",
    baseRateOptions: [20, 40, 60],
    correctBaseRate: 40,
    evidence: "Il post di annuncio su Twitter ha fatto il triplo dei like medi.",
    outcome: 1,
    outcomeDesc: "SUCCESS. L'adozione è stata del 45%.",
    explanation:
      "L'evidenza (social proof) era MEDIA. Il base rate era già buono. Era corretto alzare la stima verso il 50-70%.",
  },
]

// --- API UTILS ---

const callGemini = async (prompt, systemInstruction = "") => {
  if (!apiKey) {
    console.warn("API Key mancante.")
    return null
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { responseMimeType: "application/json" },
  }

  // Exponential backoff strategy
  const delays = [1000, 2000, 4000]

  for (let i = 0; i < delays.length; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      return text ? JSON.parse(text) : null
    } catch (e) {
      if (i === delays.length - 1) {
        console.error("Gemini API failed after retries:", e)
        return null
      }
      await new Promise((resolve) => setTimeout(resolve, delays[i]))
    }
  }
}

// --- UTILS ---

const calculateBrier = (probPercent, outcome) => {
  const prob = probPercent / 100
  return Math.pow(prob - outcome, 2).toFixed(2)
}

const INITIAL_CALIBRATION = [
  { bucket: 10, hits: 0, total: 0 },
  { bucket: 30, hits: 0, total: 0 },
  { bucket: 50, hits: 0, total: 0 },
  { bucket: 70, hits: 0, total: 0 },
  { bucket: 90, hits: 0, total: 0 },
]

// --- APP COMPONENT ---

const ForecastArcade = () => {
  const [view, setView] = useState("home") // home, game, feedback, report, loading
  const [stats, setStats] = useState({
    streak: 3,
    sessionsPlayed: 14,
    avgBrier: 0.35,
    calibration: [...INITIAL_CALIBRATION],
  })

  // Game State
  const [currentScenario, setCurrentScenario] = useState(null)
  const [step, setStep] = useState(0)
  const [userInputs, setUserInputs] = useState({
    baseRate: null,
    probability: null,
    updateStrength: null,
  })

  // AI State
  const [aiCoachTip, setAiCoachTip] = useState(null)
  const [isAiGenerating, setIsAiGenerating] = useState(false)

  // --- ACTIONS ---

  const startStaticGame = () => {
    const randomScenario = STATIC_SCENARIOS[Math.floor(Math.random() * STATIC_SCENARIOS.length)]
    setupGame(randomScenario)
  }

  const startInfiniteGame = async () => {
    setView("loading")
    setIsAiGenerating(true)

    const prompt = `
      Genera un singolo scenario di previsione (forecasting) realistico per allenare la calibrazione decisionale.
      Formato JSON richiesto:
      {
        "id": number,
        "category": "string (Marketing, Prodotto, Operations, o Vita Reale)",
        "title": "string (Titolo breve)",
        "context": "string (2 frasi sul contesto della decisione)",
        "baseRateInfo": "string (Un dato statistico storico o di settore rilevante)",
        "baseRateOptions": [number, number, number] (3 opzioni percentuali, es: [20, 50, 80]),
        "correctBaseRate": number (una delle opzioni sopra),
        "evidence": "string (Una nuova informazione specifica, inside view)",
        "outcome": number (0 per falso/fallimento, 1 per vero/successo),
        "outcomeDesc": "string (Cosa è successo realmente)",
        "explanation": "string (Breve analisi del perché era difficile prevedere)"
      }
      Usa la lingua Italiana. Sii creativo ma realistico.
    `

    const aiScenario = await callGemini(prompt, "Sei un esperto di Superforecasting e Tetlock.")

    setIsAiGenerating(false)
    if (aiScenario) {
      setupGame(aiScenario)
    } else {
      // Fallback
      startStaticGame()
    }
  }

  const setupGame = (scenario) => {
    setCurrentScenario(scenario)
    setStep(0)
    setUserInputs({ baseRate: null, probability: null, updateStrength: null })
    setAiCoachTip(null)
    setView("game")
  }

  const handleUpdateSelect = async (val) => {
    setUserInputs((prev) => ({ ...prev, updateStrength: val }))
    setStep(3) // Reveal

    // Update Stats
    const outcome = currentScenario.outcome
    const prob = userInputs.probability

    const newCalibration = stats.calibration.map((item) => {
      if (item.bucket === prob) {
        return { ...item, total: item.total + 1, hits: item.hits + (outcome === 1 ? 1 : 0) }
      }
      return item
    })

    const currentBrier = Number.parseFloat(calculateBrier(prob, outcome))
    const newAvgBrier = (stats.avgBrier * stats.sessionsPlayed + currentBrier) / (stats.sessionsPlayed + 1)

    setStats((prev) => ({
      ...prev,
      streak: prev.streak + 1,
      sessionsPlayed: prev.sessionsPlayed + 1,
      avgBrier: newAvgBrier,
      calibration: newCalibration,
    }))

    // Trigger AI Coach
    fetchAICoaching(currentScenario, prob, userInputs.baseRate, val)
  }

  const fetchAICoaching = async (scenario, userProb, userBaseRate, updateStrength) => {
    if (!apiKey) return
    setAiCoachTip("Analisi in corso...")

    const prompt = `
      L'utente ha fatto una previsione su questo scenario: "${scenario.title}".
      - Base Rate Reale: ${scenario.correctBaseRate}%
      - Base Rate Scelto dall'Utente: ${userBaseRate}%
      - Evidenza: "${scenario.evidence}"
      - Forza Evidenza stimata dall'utente: ${updateStrength}
      - Probabilità Finale Utente: ${userProb}%
      - Esito Reale: ${scenario.outcome === 1 ? "Successo" : "Fallimento"}

      Fornisci un feedback di 1 frase (max 25 parole) in Italiano, diretto e amichevole, su quale bias cognitivo potrebbe aver influenzato l'utente (es. Overconfidence, Base Rate Neglect, Confirmation Bias) o se è stato ben calibrato.
      Rispondi in JSON: { "tip": "string" }
    `

    const result = await callGemini(prompt, "Sei un coach di decision making.")
    if (result && result.tip) {
      setAiCoachTip(result.tip)
    } else {
      setAiCoachTip("Ottimo lavoro di calibrazione!")
    }
  }

  return (
    <div className="min-h-screen bg-[#000E20] font-sans text-slate-100 selection:bg-[#005FD7]">
      <main className="max-w-md mx-auto min-h-screen flex flex-col relative bg-[#000E20] border-x border-slate-800 shadow-2xl">
        {view === "loading" && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <Loader2 className="w-16 h-16 text-[#005FD7] animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Generazione Scenario...</h2>
            <p className="text-slate-400">L'IA sta consultando i dati storici per creare una nuova sfida.</p>
          </div>
        )}

        {view === "home" && (
          <HomeScreen
            stats={stats}
            onStartStatic={startStaticGame}
            onStartInfinite={startInfiniteGame}
            onViewReport={() => setView("report")}
          />
        )}

        {view === "game" && currentScenario && (
          <GameScreen
            scenario={currentScenario}
            step={step}
            userInputs={userInputs}
            aiCoachTip={aiCoachTip}
            onBaseRate={(val) => {
              setUserInputs((p) => ({ ...p, baseRate: val }))
              setStep(1)
            }}
            onProb={(val) => {
              setUserInputs((p) => ({ ...p, probability: val }))
              setStep(2)
            }}
            onUpdate={handleUpdateSelect}
            onNext={() => setView("report")}
            onExit={() => setView("home")}
          />
        )}

        {view === "report" && <ReportScreen stats={stats} onHome={() => setView("home")} />}
      </main>
    </div>
  )
}

// --- SUB-COMPONENTS ---

const HomeScreen = ({ stats, onStartStatic, onStartInfinite, onViewReport }) => (
  <div className="flex-1 flex flex-col p-6 animate-in fade-in duration-500">
    {/* Header */}
    <div className="flex justify-between items-center mb-10">
      <div className="flex items-center space-x-2 font-black text-xl text-[#005FD7]">
        <Target className="fill-current" />
        <span>Forecast Arcade</span>
      </div>
      <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
        <TrendingUp size={16} className="text-green-400" />
        <span className="font-bold text-sm text-slate-300">{stats.streak} Streak</span>
      </div>
    </div>

    {/* Hero */}
    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
      <div className="w-24 h-24 bg-gradient-to-br from-[#005FD7] to-[#001D41] rounded-3xl flex items-center justify-center shadow-2xl relative z-10 mb-2">
        <Sparkles size={40} className="text-white" />
      </div>

      <div>
        <h1 className="text-4xl font-black text-white mb-2">Sfida Infinita</h1>
        <p className="text-slate-400 text-lg max-w-xs mx-auto">
          Scenari generati dall'IA per testare la tua calibrazione.
        </p>
      </div>

      <div className="w-full space-y-3 pt-4">
        <button
          onClick={onStartInfinite}
          className="w-full bg-[#005FD7] text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-[#005FD7]/80 transition-all active:scale-95 flex items-center justify-center border-t border-[#005FD7]/40"
        >
          <Sparkles size={20} className="mr-2" />
          Genera Scenario AI
        </button>

        <button
          onClick={onStartStatic}
          className="w-full bg-slate-800 text-slate-300 py-4 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all active:scale-95 border border-slate-700"
        >
          Scenario Classico
        </button>
      </div>
    </div>

    {/* Stats Teaser */}
    <div className="mt-auto grid grid-cols-2 gap-4 pt-8">
      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 text-center">
        <div className="text-sm text-slate-500 font-bold uppercase mb-1">Brier Medio</div>
        <div className="text-2xl font-black text-white">{stats.avgBrier.toFixed(2)}</div>
        <div className="text-xs text-slate-600">(0.00 è perfetto)</div>
      </div>
      <button
        onClick={onViewReport}
        className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 text-center hover:bg-slate-800 transition"
      >
        <BarChart2 className="mx-auto mb-2 text-slate-400" />
        <div className="text-xs text-slate-500 font-bold uppercase">Vedi Curva</div>
      </button>
    </div>
  </div>
)

const GameScreen = ({ scenario, step, userInputs, aiCoachTip, onBaseRate, onProb, onUpdate, onNext, onExit }) => {
  const [brierScore, setBrierScore] = useState(null)

  useEffect(() => {
    if (step === 3) {
      setBrierScore(calculateBrier(userInputs.probability, scenario.outcome))
    }
  }, [step])

  return (
    <div className="flex-1 flex flex-col p-4 animate-in slide-in-from-right duration-300">
      {/* Game Header */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onExit} className="text-slate-500 font-bold text-sm">
          Esci
        </button>
        <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
          {scenario.category}
        </span>
        <div className="w-8"></div>
      </div>

      {/* Progress */}
      <div className="flex space-x-2 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#005FD7]" : "bg-slate-800"}`}
          ></div>
        ))}
      </div>

      {/* CARD CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-4">{scenario.title}</h2>
        <p className="text-slate-300 text-lg leading-relaxed mb-8 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
          {scenario.context}
        </p>

        {/* STEP 0: BASE RATE */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="text-[#005FD7]" size={20} />
              <h3 className="font-bold text-[#005FD7] uppercase tracking-widest text-sm">Vista Esterna (Base Rate)</h3>
            </div>
            <p className="text-white font-medium mb-6 text-lg">{scenario.baseRateInfo}</p>
            <p className="text-slate-400 text-sm mb-4 font-bold uppercase">Scegli il tasso di partenza:</p>
            <div className="grid grid-cols-3 gap-3">
              {scenario.baseRateOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onBaseRate(opt)}
                  className="py-6 bg-slate-800 hover:bg-[#005FD7] border-2 border-slate-700 hover:border-[#005FD7] rounded-2xl font-black text-xl text-white transition-all active:scale-95"
                >
                  {opt}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: PROBABILITY */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="text-[#005FD7]" size={20} />
              <h3 className="font-bold text-[#005FD7] uppercase tracking-widest text-sm">La tua Previsione</h3>
            </div>
            <p className="text-slate-400 mb-6">Quanto scommetteresti (0-100%) che l'esito sarà positivo?</p>
            <div className="grid grid-cols-1 gap-3">
              {[10, 30, 50, 70, 90].map((opt) => (
                <button
                  key={opt}
                  onClick={() => onProb(opt)}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex justify-between px-6 transition-all active:scale-95 ${userInputs.baseRate === opt ? "bg-[#005FD7]/30 border-2 border-[#005FD7]/50 text-[#005FD7]" : "bg-slate-800 border-2 border-slate-700 text-white hover:border-[#005FD7]"}`}
                >
                  <span>{opt}%</span>
                  {userInputs.baseRate === opt && (
                    <span className="text-xs uppercase bg-[#005FD7] text-white px-2 py-1 rounded">Base Rate</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: UPDATE (EVIDENCE) */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center space-x-2 mb-4">
              <RefreshCcw className="text-[#005FD7]" size={20} />
              <h3 className="font-bold text-[#005FD7] uppercase tracking-widest text-sm">Nuova Evidenza (Update)</h3>
            </div>
            <div className="bg-slate-800 p-6 rounded-2xl border-l-4 border-[#005FD7] mb-8">
              <p className="text-white font-medium text-lg italic">"{scenario.evidence}"</p>
            </div>
            <p className="text-slate-400 mb-4">Quanto è forte questa evidenza?</p>
            <div className="grid grid-cols-3 gap-3">
              {["Debole", "Media", "Forte"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => onUpdate(opt)}
                  className="py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-white transition-all active:scale-95"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: REVEAL */}
        {step === 3 && (
          <div className="animate-in zoom-in duration-300 pb-10">
            <div
              className={`p-6 rounded-3xl text-center mb-6 ${scenario.outcome === 1 ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/30"}`}
            >
              <h1 className={`text-4xl font-black mb-2 ${scenario.outcome === 1 ? "text-green-400" : "text-red-400"}`}>
                {scenario.outcome === 1 ? "ACCADUTO" : "NON ACCADUTO"}
              </h1>
              <p className="text-slate-300">{scenario.outcomeDesc}</p>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl mb-6 flex justify-between items-center border border-slate-700">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase">La tua Stima</div>
                <div className="text-3xl font-black text-white">{userInputs.probability}%</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-500 uppercase">Brier Score</div>
                <div
                  className={`text-3xl font-black ${brierScore < 0.25 ? "text-green-400" : brierScore > 0.5 ? "text-red-400" : "text-yellow-400"}`}
                >
                  {brierScore}
                </div>
              </div>
            </div>

            {/* AI COACH SECTION */}
            <div className="bg-[#005FD7]/40 p-5 rounded-2xl border border-[#005FD7]/30 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-20">
                <Brain size={40} className="text-[#005FD7]" />
              </div>
              <div className="flex items-start relative z-10">
                <div className="mr-3 mt-1">
                  {aiCoachTip === "Analisi in corso..." ? (
                    <Loader2 size={20} className="text-[#005FD7] animate-spin" />
                  ) : (
                    <Sparkles size={20} className="text-[#005FD7]" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-[#005FD7] mb-1">AI Coach</h4>
                  <p className="text-slate-100 text-sm leading-relaxed italic">
                    "{aiCoachTip || "Analisi in corso..."}"
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onNext}
              className="w-full bg-[#005FD7] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#005FD7]/80 transition-colors shadow-lg"
            >
              Vedi Report & Grafico
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const ReportScreen = ({ stats, onHome }) => {
  const chartData = stats.calibration.map((item) => ({
    x: item.bucket,
    y: item.total > 0 ? (item.hits / item.total) * 100 : item.bucket,
    size: item.total * 20 + 50,
  }))

  const perfectLine = [
    { x: 0, y: 0 },
    { x: 100, y: 100 },
  ]

  return (
    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-bottom duration-500 bg-[#000E20] overflow-y-auto">
      <div className="bg-[#001D41] p-8 rounded-3xl border border-slate-700 mb-6">
        <h2 className="text-3xl font-black text-white mb-2">Il Tuo Report</h2>
        <p className="text-slate-400">Analisi della calibrazione decisionale</p>
      </div>

      <div className="bg-[#001D41] p-6 rounded-2xl mb-6 border border-slate-700">
        <h3 className="text-xs font-bold text-[#005FD7] uppercase tracking-widest mb-4">Statistiche Sessione</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-500 font-bold uppercase mb-1">Sessioni</div>
            <div className="text-2xl font-black text-white">{stats.sessionsPlayed}</div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
            <div className="text-xs text-slate-500 font-bold uppercase mb-1">Brier Medio</div>
            <div className={`text-2xl font-black ${stats.avgBrier < 0.25 ? "text-green-400" : "text-yellow-400"}`}>
              {stats.avgBrier.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#001D41] p-6 rounded-2xl mb-6 border border-slate-700">
        <h3 className="text-xs font-bold text-[#005FD7] uppercase tracking-widest mb-4">Calibration Curve</h3>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="Previsione" unit="%" stroke="#94a3b8" domain={[0, 100]} />
            <YAxis type="number" dataKey="y" name="Realtà" unit="%" stroke="#94a3b8" domain={[0, 100]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#fff" }}
            />
            <Line data={perfectLine} dataKey="y" stroke="#005FD7" strokeWidth={2} dot={false} activeDot={false} />
            <Scatter name="Tu" data={chartData} fill="#818cf8" shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="absolute bottom-2 right-4 text-xs text-slate-500 font-mono">Linea Grigia = Perfezione</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-auto">
        <button className="w-full py-4 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-bold flex flex-col items-center justify-center hover:bg-slate-700 transition">
          <Share2 size={20} className="mb-1" />
          Condividi
        </button>
        <button
          onClick={onHome}
          className="w-full bg-[#005FD7] text-white py-5 rounded-2xl font-bold text-lg hover:bg-[#005FD7]/80 transition-all active:scale-95 flex items-center justify-center"
        >
          <Home size={20} className="mb-1" />
          Home
        </button>
      </div>
    </div>
  )
}

export default ForecastArcade
