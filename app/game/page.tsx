"use client"

import Link from "next/link"
import { GiBrain, GiMeditation, GiNetworkBars, GiCardRandom } from "react-icons/gi"
import { FiLock } from "react-icons/fi"
import { Target } from "lucide-react"

const games = [
  {
    id: "values-compass",
    title: "Values Compass",
    description: "Scopri i tuoi valori reali attraverso duelli etici e costruisci il tuo manifesto personale.",
    icon: <GiBrain />,
    color: "from-[#005FD7] to-[#003d8f]",
    available: true,
  },
  {
    id: "inner-voice-studio",
    title: "Inner Voice Studio",
    description: "Riconosci le distorsioni cognitive, scegli il reframe giusto e trasforma il tuo dialogo interno.",
    icon: <GiMeditation />,
    color: "from-[#005FD7] to-[#003d8f]",
    available: true,
  },
  {
    id: "forecast-arcade",
    title: "Forecast Arcade",
    description: "Allena la tua calibrazione decisionale con scenari realistici. Impara a fare previsioni accurate.",
    icon: <Target />,
    color: "from-[#005FD7] to-[#003d8f]",
    available: true,
  },
  {
    id: "game-4",
    title: "Coming Soon",
    description: "Il quarto gioco è in fase di sviluppo. Nuove sfide cognitive ti aspettano.",
    icon: <GiNetworkBars />,
    color: "from-[#005FD7]/50 to-[#003d8f]/50",
    available: false,
  },
  {
    id: "game-5",
    title: "Coming Soon",
    description: "Quinto gioco in preparazione. L'ultima frontiera del brain hacking.",
    icon: <GiCardRandom />,
    color: "from-[#005FD7]/50 to-[#003d8f]/50",
    available: false,
  },
]

export default function GamePage() {
  return (
    <div className="min-h-screen bg-[#000E20] py-20">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-reveal-text">
          <h1 className="text-5xl md:text-7xl font-black mb-6 text-white">
            Brain Hacking <span className="text-gradient">Games</span>
          </h1>
          <p className="text-xl text-[#B1BAC5] max-w-3xl mx-auto leading-relaxed">
            Allena la tua mente attraverso giochi interattivi basati su neuroscienze e psicologia comportamentale
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {games.map((game, index) => (
            <div
              key={game.id}
              className={`glass-effect rounded-3xl p-8 transition-all duration-300 relative overflow-hidden animate-scale-in ${
                game.available ? "hover:scale-[1.02] cursor-pointer" : "opacity-70 cursor-not-allowed"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Gradient */}
              <div
                className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${game.color} rounded-full blur-3xl opacity-20 animate-pulse`}
              />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-6 transition-transform ${
                    game.available ? "group-hover:scale-110 group-hover:rotate-6" : ""
                  }`}
                >
                  <div className="text-white text-4xl">{game.icon}</div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-3 text-white flex items-center gap-3">
                  {game.title}
                  {!game.available && <FiLock className="text-[#B1BAC5] text-lg" />}
                </h3>

                {/* Description */}
                <p className="text-[#B1BAC5] leading-relaxed mb-6">{game.description}</p>

                {/* CTA Button */}
                {game.available ? (
                  <Link
                    href={`/game/${game.id}`}
                    className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#005FD7] hover:bg-[#0051b8] rounded-xl font-bold transition-all text-white"
                  >
                    Gioca Ora
                  </Link>
                ) : (
                  <div className="inline-flex items-center justify-center w-full px-6 py-3 bg-[#001D41] rounded-xl font-bold text-[#B1BAC5]">
                    Disponibile Presto
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-20 max-w-4xl mx-auto glass-effect rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Come Funzionano i Brain Games</h2>
          <p className="text-[#B1BAC5] leading-relaxed text-lg">
            Ogni gioco è progettato per stimolare specifiche aree cognitive, aiutandoti a comprendere meglio te stesso e
            a sviluppare competenze pratiche. I giochi utilizzano principi di neuroscienze, economia comportamentale e
            psicologia per offrirti un'esperienza di apprendimento unica e coinvolgente.
          </p>
        </div>
      </div>
    </div>
  )
}
