"use client"

import { useState } from "react"
import Link from "next/link"
import { FiPlay, FiCalendar, FiClock, FiUser, FiFilter, FiSearch } from "react-icons/fi"

interface LiveEvent {
  id: string
  title: string
  description: string
  date: string
  time: string
  duration: string
  speaker: string
  speakerTitle: string
  status: "upcoming" | "live" | "recorded"
  category: string
  attendees: number
}

export default function LiveEventsPage() {
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "recorded">("all")
  const [search, setSearch] = useState("")

  const events: LiveEvent[] = [
    {
      id: "1",
      title: "Neuroplasticità: Riwire il Tuo Cervello",
      description:
        "Scopri come creare nuove connessioni neurali per apprendere più velocemente e migliorare le tue capacità cognitive.",
      date: "2024-12-15",
      time: "18:00",
      duration: "90 min",
      speaker: "Dr. Elena Rossi",
      speakerTitle: "Neuroscienziata Cognitiva",
      status: "upcoming",
      category: "Neuroscienza",
      attendees: 245,
    },
    {
      id: "2",
      title: "Gestione dello Stress con la Mindfulness",
      description:
        "Tecniche basate sulla neuroscienza per ridurre lo stress cronico e migliorare il benessere mentale.",
      date: "2024-12-18",
      time: "20:30",
      duration: "75 min",
      speaker: "Prof. Marco Bianchi",
      speakerTitle: "Psicologo Clinico",
      status: "upcoming",
      category: "Mindfulness",
      attendees: 189,
    },
    {
      id: "3",
      title: "Memoria Fotografica: Tecniche Avanzate",
      description: "Metodi scientifici per sviluppare una memoria fotografica e ricordare informazioni complesse.",
      date: "2024-12-10",
      time: "17:00",
      duration: "60 min",
      speaker: "Dr. Sofia Conti",
      speakerTitle: "Esperta in Mnemonica",
      status: "recorded",
      category: "Memoria",
      attendees: 312,
    },
    {
      id: "4",
      title: "Biohacking del Sonno",
      description: "Ottimizza il tuo sonno per massimizzare la rigenerazione cerebrale e le performance cognitive.",
      date: "2024-12-20",
      time: "19:00",
      duration: "80 min",
      speaker: "Ing. Luca Ferrari",
      speakerTitle: "Biohacking Specialist",
      status: "upcoming",
      category: "Biohacking",
      attendees: 156,
    },
    {
      id: "5",
      title: "Focus e Concentrazione Profonda",
      description: "Strategie per entrare in stato di flow e mantenere la concentrazione per ore.",
      date: "2024-12-05",
      time: "16:30",
      duration: "70 min",
      speaker: "Dott.ssa Giulia Marini",
      speakerTitle: "Psicologa del Lavoro",
      status: "recorded",
      category: "Produttività",
      attendees: 278,
    },
    {
      id: "6",
      title: "Alimentazione per il Cervello",
      description: "I nutrienti essenziali per ottimizzare le funzioni cognitive e prevenire il declino mentale.",
      date: "2024-12-22",
      time: "18:30",
      duration: "85 min",
      speaker: "Dr. Antonio Russo",
      speakerTitle: "Nutrizionista Funzionale",
      status: "upcoming",
      category: "Nutrizione",
      attendees: 201,
    },
  ]

  const filteredEvents = events.filter((event) => {
    if (filter !== "all" && event.status !== filter) return false
    if (
      search &&
      !event.title.toLowerCase().includes(search.toLowerCase()) &&
      !event.description.toLowerCase().includes(search.toLowerCase())
    )
      return false
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-red-500 text-white"
      case "upcoming":
        return "bg-[#005FD7] text-white"
      case "recorded":
        return "bg-blue-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "live":
        return "IN DIRETTA"
      case "upcoming":
        return "PROSSIMAMENTE"
      case "recorded":
        return "REGISTRATO"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black rounded-2xl p-6 border border-gray-800">
        <h1 className="text-3xl font-bold mb-2">Eventi Live</h1>
        <p className="text-gray-400">
          Partecipa a sessioni live con esperti di neuroscienza, psicologia e performance. Interagisci in tempo reale e
          fai domande direttamente ai relatori.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Cerca eventi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:border-[#005FD7] focus:ring-2 focus:ring-[#005FD7]/20 focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "upcoming", "live", "recorded"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                filter === status
                  ? "bg-[#005FD7] border-[#005FD7] text-white"
                  : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700"
              }`}
            >
              {status === "all"
                ? "Tutti"
                : status === "upcoming"
                  ? "Prossimi"
                  : status === "live"
                    ? "In Diretta"
                    : "Registrati"}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden hover:border-[#005FD7]/50 transition-all group"
          >
            {/* Event Header */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(event.status)}`}>
                  {getStatusText(event.status)}
                </span>
                <span className="text-sm text-gray-400">{event.category}</span>
              </div>

              <h3 className="text-xl font-semibold mb-3 group-hover:text-[#005FD7] transition-colors">{event.title}</h3>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

              {/* Event Details */}
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <FiCalendar className="text-gray-500 mr-3" />
                  <span className="text-gray-300">{event.date}</span>
                  <span className="mx-2 text-gray-600">•</span>
                  <FiClock className="text-gray-500 mr-3" />
                  <span className="text-gray-300">
                    {event.time} ({event.duration})
                  </span>
                </div>

                <div className="flex items-center text-sm">
                  <FiUser className="text-gray-500 mr-3" />
                  <div>
                    <div className="text-gray-300">{event.speaker}</div>
                    <div className="text-gray-500 text-xs">{event.speakerTitle}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div className="text-sm text-gray-400">{event.attendees.toLocaleString("it-IT")} partecipanti</div>
                  <Link
                    href={`/area-riservata/live/${event.id}`}
                    className="flex items-center px-4 py-2 bg-[#005FD7] hover:bg-[#0051b8] rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiPlay className="mr-2" />
                    {event.status === "recorded" ? "Guarda Ora" : "Partecipa"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiFilter className="text-gray-500 text-2xl" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nessun evento trovato</h3>
          <p className="text-gray-400">Prova a modificare i filtri o la ricerca per trovare eventi.</p>
        </div>
      )}

      {/* Upcoming Events Info */}
      <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Come Partecipare agli Eventi Live</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-[#005FD7] font-semibold">1. Prenotazione</div>
            <p className="text-gray-400 text-sm">
              Iscriviti agli eventi in anticipo per ricevere promemoria e prepararti al meglio.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-[#005FD7] font-semibold">2. Partecipazione</div>
            <p className="text-gray-400 text-sm">
              Accedi alla piattaforma 5 minuti prima dell'orario stabilito. Interagisci con chat live e Q&A.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-[#005FD7] font-semibold">3. Replay</div>
            <p className="text-gray-400 text-sm">
              Tutti gli eventi vengono registrati e sono disponibili nella sezione "Registrati" dopo 24 ore.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
