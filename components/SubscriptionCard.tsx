"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"

interface SubscriptionCardProps {
  title: string
  price: string
  period: string
  priceType: "monthly" | "yearly"
  features: string[]
  popular?: boolean
  disabled?: boolean
}

export function SubscriptionCard({ title, price, period, features, popular, disabled }: SubscriptionCardProps) {
  const { user } = useAuth()
  const router = useRouter()

  const handleSubscribe = () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    alert("Per attivare l'abbonamento, contatta l'amministrazione.")
  }

  return (
    <Card className={`relative ${popular ? "border-accent shadow-lg" : ""}`}>
      {popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
            Più Popolare
          </span>
        </div>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>
          <span className="text-4xl font-bold text-card-foreground">{price}</span>
          <span className="text-muted-foreground">/{period}</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSubscribe}
          disabled={disabled}
          className="w-full"
          variant={popular ? "default" : "outline"}
        >
          {user?.subscriptionStatus === "active" ? "Piano Attivo" : "Contatta per Attivare"}
        </Button>
      </CardFooter>
    </Card>
  )
}
