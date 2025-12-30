import { redirect } from "next/navigation"

// Redirect vecchia pagina lezione a /academy/[slug]?lesson=[lessonId]
export default async function LessonPage({ params }: { params: Promise<{ courseId: string; lessonId: string }> }) {
  const { courseId, lessonId } = await params
  redirect(`/academy/${courseId}?lesson=${lessonId}`)
}
