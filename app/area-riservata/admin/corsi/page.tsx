import { redirect } from "next/navigation"

// Redirect vecchia pagina admin corsi a /admin/courses
export default function AdminCorsiPage() {
  redirect("/admin/courses")
}
