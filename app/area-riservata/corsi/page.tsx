import { redirect } from "next/navigation"

// Redirect vecchia pagina corsi a /academy
export default function CorsiPage() {
  redirect("/academy")
}
