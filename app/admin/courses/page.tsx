"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminRequired } from "@/components/AdminRequired"
import { DemoModeBanner } from "@/components/DemoModeBanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BookOpen, Search, Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import type { Course } from "@/lib/types-academy"
import { getFirebaseIdToken } from "@/lib/api-helpers"

export default function AdminCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchQuery])

  const fetchCourses = async () => {
    try {
      const token = await getFirebaseIdToken()
      if (!token) return

      const response = await fetch("/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      // API ritorna { courses: Course[] }
      setCourses(data.courses || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      setCourses([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    if (searchQuery) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (course.categoryName || (course as any).category || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredCourses(filtered)
  }

  const togglePublished = async (courseId: string, currentStatus: boolean) => {
    try {
      const token = await getFirebaseIdToken()
      if (!token) return

      await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ published: !currentStatus }),
      })

      fetchCourses()
    } catch (error) {
      console.error("Error toggling course publish status:", error)
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo corso?")) return

    try {
      const token = await getFirebaseIdToken()
      if (!token) return

      await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      fetchCourses()
    } catch (error) {
      console.error("Error deleting course:", error)
    }
  }

  return (
    <AdminRequired>
      <div className="py-8">
        <DemoModeBanner />

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestione Corsi</h1>
            <p className="text-muted-foreground">Gestisci i videocorsi della piattaforma</p>
          </div>
          <Button onClick={() => router.push("/admin/courses/new-academy")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Corso
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Corsi Disponibili
            </CardTitle>
            <CardDescription>
              Totale: {courses.length} corsi | Pubblicati: {courses.filter((c) => c.published).length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per titolo o categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titolo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Data Creazione</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nessun corso trovato
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.categoryName || (course as any).category || "—"}</Badge>
                          </TableCell>
                          <TableCell>
                            {course.published ? (
                              <Badge variant="default" className="gap-1">
                                <Eye className="h-3 w-3" />
                                Pubblicato
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <EyeOff className="h-3 w-3" />
                                Bozza
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(course.createdAt).toLocaleDateString("it-IT")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => togglePublished(course.id, course.published)}
                              >
                                {course.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => router.push(`/admin/courses/${course.id}/edit`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => deleteCourse(course.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRequired>
  )
}
