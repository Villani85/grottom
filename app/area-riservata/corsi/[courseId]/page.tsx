import { redirect } from "next/navigation"

// Redirect vecchia pagina corso a /academy/[slug]
export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  redirect(`/academy/${courseId}`)
}
