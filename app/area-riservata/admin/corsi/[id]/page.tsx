import { redirect } from "next/navigation"

// Redirect vecchia pagina admin edit corso a /admin/courses/[id]
export default async function AdminEditCorsoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/admin/courses/${id}`)
}

