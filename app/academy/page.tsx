"use client"

import { useState, useEffect } from "react"
import { CourseCard } from "@/components/academy/CourseCard"
import { CourseFilters } from "@/components/academy/CourseFilters"
import type { Course, Category } from "@/lib/types-academy"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
    fetchCourses()
  }, [])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchCourses()
    }, 300)

    return () => clearTimeout(timer)
  }, [selectedCategoryId, searchQuery])

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      } else {
        console.error("Failed to fetch categories:", res.status)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchCourses = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedCategoryId) params.set("category", selectedCategoryId)
      if (searchQuery) params.set("q", searchQuery)

      const res = await fetch(`/api/courses?${params.toString()}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        setCourses(data.courses || [])
      } else {
        console.error("Failed to fetch courses:", res.status)
        setCourses([])
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      setCourses([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Esplora il catalogo</CardTitle>
          <CardDescription className="text-base">
            Percorsi formativi basati su scienza e dati per migliorare decisioni, produttività e mindset.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <CourseFilters
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        searchQuery={searchQuery}
        onCategoryChange={setSelectedCategoryId}
        onSearchChange={setSearchQuery}
      />

      {/* Courses Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nessun corso trovato
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

