"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { FiUser, FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiCheck } from "react-icons/fi"
import { DemoModeBanner } from "@/components/DemoModeBanner"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validazioni
    if (formData.password !== formData.confirmPassword) {
      setError("Le password non corrispondono")
      return
    }

    if (formData.password.length < 8) {
      setError("La password deve essere di almeno 8 caratteri")
      return
    }

    if (!agreedToTerms) {
      setError("Devi accettare i Termini di Servizio e la Privacy Policy")
      return
    }

    setIsLoading(true)

    try {
      await register(formData.email, formData.password, formData.nickname)
      router.push("/area-riservata/dashboard")
    } catch (err: any) {
      setError(err.message || "Errore durante la registrazione. Riprova.")
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

  const passwordStrength = () => {
    const password = formData.password
    let strength = 0

    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++

    return strength
  }

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return "bg-muted"
    if (strength === 1) return "bg-red-500"
    if (strength === 2) return "bg-orange-500"
    if (strength === 3) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-md">
        <DemoModeBanner />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-accent to-accent/80 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">BH</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-card-foreground">Unisciti alla Rivoluzione</h1>
          <p className="text-muted-foreground">Crea il tuo account Brain Hacking Academy</p>
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
              <label className="block text-sm font-medium mb-2 text-card-foreground">Nickname</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-muted-foreground" />
                </div>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all text-card-foreground"
                  placeholder="NomeUtente"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Sicurezza password:</span>
                    <span className="text-xs font-medium text-card-foreground">
                      {passwordStrength() === 0 && "Molto debole"}
                      {passwordStrength() === 1 && "Debole"}
                      {passwordStrength() === 2 && "Media"}
                      {passwordStrength() === 3 && "Buona"}
                      {passwordStrength() === 4 && "Forte"}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStrengthColor(passwordStrength())} transition-all duration-300`}
                      style={{ width: `${(passwordStrength() / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-card-foreground">Conferma Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-muted-foreground" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-12 py-3 bg-input border border-border rounded-lg focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all text-card-foreground"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="text-muted-foreground hover:text-card-foreground" />
                  ) : (
                    <FiEye className="text-muted-foreground hover:text-card-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                  agreedToTerms ? "bg-accent border-accent" : "bg-input border-border"
                }`}
              >
                {agreedToTerms && <FiCheck className="text-accent-foreground text-xs" />}
              </button>
              <label className="text-sm text-muted-foreground">
                Accetto i{" "}
                <Link href="/terms" className="text-accent hover:text-accent/80">
                  Termini di Servizio
                </Link>{" "}
                e la{" "}
                <Link href="/privacy" className="text-accent hover:text-accent/80">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Registrazione in corso..." : "Crea Account Gratuito"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-center text-muted-foreground">
              Hai già un account?{" "}
              <Link href="/auth/login" className="text-accent hover:text-accent/80 font-semibold">
                Accedi qui
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              I primi 7 giorni sono gratuiti. Nessuna carta di credito richiesta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
