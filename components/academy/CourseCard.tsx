"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Course } from "@/lib/types-academy"
import { FiClock, FiBookOpen, FiStar } from "react-icons/fi"

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video w-full bg-muted">
        {course.coverImageUrl ? (
          <img
            src={course.coverImageUrl}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <FiBookOpen className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {course.isBestSeller && (
            <Badge variant="default" className="bg-primary">
              Best Seller
            </Badge>
          )}
          {course.isNew && (
            <Badge variant="secondary">
              Nuovo
            </Badge>
          )}
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge variant="outline" className="bg-background/80">
            {course.level}
          </Badge>
        </div>
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {course.shortDescription}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {course.categoryName}
          </Badge>
          {course.focusTags.slice(0, 2).map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {course.durationMinutes > 0 && (
            <div className="flex items-center gap-1">
              <FiClock className="w-4 h-4" />
              <span>{formatDuration(course.durationMinutes)}</span>
            </div>
          )}
          {course.lessonsCount > 0 && (
            <div className="flex items-center gap-1">
              <FiBookOpen className="w-4 h-4" />
              <span>{course.lessonsCount} lezioni</span>
            </div>
          )}
          {course.ratingAvg && course.ratingCount && (
            <div className="flex items-center gap-1">
              <FiStar className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              <span>
                {course.ratingAvg.toFixed(1)} ({course.ratingCount})
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/academy/${course.slug}`}>Vai al corso</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

