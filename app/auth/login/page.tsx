"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi"
import { DemoModeBanner } from "@/components/DemoModeBanner"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      router.push("/area-riservata/dashboard")
    } catch (err: any) {
      setError(err.message || "Credenziali non valide. Riprova.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <DemoModeBanner />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-accent to-accent/80 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">BH</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-card-foreground">Bentornato</h1>
          <p className="text-muted-foreground">Accedi al tuo account Brain Hacking Academy</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <FiAlertCircle className="text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-muted-foreground" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all text-card-foreground"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-muted-foreground" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all text-card-foreground"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FiEyeOff className="text-muted-foreground hover:text-card-foreground" />
                  ) : (
                    <FiEye className="text-muted-foreground hover:text-card-foreground" />
                  )}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link href="/auth/forgot-password" className="text-sm text-accent hover:text-accent/80">
                  Password dimenticata?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Accesso in corso..." : "Accedi"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-center text-muted-foreground">
              Non hai un account?{" "}
              <Link href="/auth/register" className="text-accent hover:text-accent/80 font-semibold">
                Registrati ora
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Accedendo, accetti i nostri{" "}
              <Link href="/terms" className="text-card-foreground/60 hover:text-card-foreground">
                Termini di Servizio
              </Link>{" "}
              e la{" "}
              <Link href="/privacy" className="text-card-foreground/60 hover:text-card-foreground">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
