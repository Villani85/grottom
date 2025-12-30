"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { AdminRequired } from "@/components/AdminRequired"
import { DemoModeBanner } from "@/components/DemoModeBanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react"
import type { Course, Lesson } from "@/lib/types"

const CATEGORIES = [
  "Neuroscienza",
  "Memory Hacking",
  "Produttività",
  "Biohacking",
  "Sviluppo Personale",
  "Altro",
]

export default function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [pendingVideoFiles, setPendingVideoFiles] = useState<Map<number, File>>(new Map())
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    thumbnailUrl: "",
    published: false,
  })

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/lessons`),
      ])

      const courseData = await courseRes.json()
      const lessonsData = await lessonsRes.json()

      if (courseData) {
        setCourse(courseData)
        setFormData({
          title: courseData.title || "",
          description: courseData.description || "",
          category: courseData.category || "",
          thumbnailUrl: courseData.thumbnailUrl || "",
          published: courseData.published || false,
        })
      }

      setLessons(Array.isArray(lessonsData) ? lessonsData : [])
    } catch (error) {
      console.error("Error fetching course data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const updated = await res.json()
        setCourse(updated)
        alert("Corso aggiornato con successo!")
      } else {
        const data = await res.json()
        alert(data.error || "Errore nell'aggiornamento del corso")
      }
    } catch (error) {
      console.error("Error updating course:", error)
      alert("Errore nell'aggiornamento del corso")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddLesson = () => {
    const newLesson: Partial<Lesson> = {
      title: "",
      description: "",
      videoUrl: "",
      duration: 0,
      order: lessons.length + 1,
      published: false,
    }
    setLessons([...lessons, newLesson as Lesson])
  }

  const handleSaveLesson = async (lesson: Lesson, index: number) => {
    try {
      setIsUploading(true)
      
      // Create lesson first
      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lesson.title,
          description: lesson.description,
          videoUrl: lesson.videoUrl || "pending", // Temporary placeholder
          duration: lesson.duration,
          order: lesson.order,
          published: lesson.published,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Errore nel salvataggio della lezione")
      }

      const data = await res.json()
      const lessonId = data.id
      const updatedLessons = [...lessons]
      updatedLessons[index] = { ...lesson, id: lessonId }
      setLessons(updatedLessons)

      // IMPORTANT: Ensure course exists in Firestore when lesson is created
      // This ensures the course is visible to members
      try {
        const { getFirebaseFirestore } = await import("@/lib/firebase-client")
        const db = getFirebaseFirestore()
        
        if (db) {
          const { doc, setDoc, serverTimestamp } = await import("firebase/firestore")
          
          // Save/update course in Firestore
          const courseRef = doc(db, "courses", courseId)
          await setDoc(
            courseRef,
            {
              title: course?.title || formData.title || "Corso",
              description: course?.description || formData.description || "",
              category: course?.category || formData.category || "",
              thumbnailUrl: course?.thumbnailUrl || formData.thumbnailUrl || "",
              published: formData.published || true, // Use formData.published or default to true
              updatedAt: serverTimestamp(),
            },
            { merge: true } // Merge with existing data
          )
          console.log("[Firestore] Course ensured in Firestore:", courseId)
        }
      } catch (courseSaveError) {
        console.warn("Failed to save course to Firestore (non-critical):", courseSaveError)
      }

      // If there's a pending video file, upload it now using Firebase Storage Web SDK
      const pendingFile = pendingVideoFiles.get(index)
      if (pendingFile) {
        try {
          // Initialize Firebase Storage
          const { getFirebaseStorage } = await import("@/lib/firebase-client")
          const storage = getFirebaseStorage()
          
          if (!storage) {
            throw new Error("Firebase Storage non inizializzato. Verifica la configurazione Firebase.")
          }

          // Import Firebase Storage functions
          const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage")

          // Create storage reference
          const objectPath = `courses/${courseId}/lessons/${lessonId}/video.mp4`
          const storageRef = ref(storage, objectPath)

          // Upload file with resumable upload (supports large files)
          const uploadTask = uploadBytesResumable(storageRef, pendingFile, {
            contentType: pendingFile.type,
          })

          // Wait for upload to complete
          await new Promise<void>((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                // Progress tracking (optional - can be used for UI progress bar)
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                console.log(`Upload progress: ${progress.toFixed(1)}%`)
              },
              (error) => {
                console.error("Upload error:", error)
                reject(error)
              },
              async () => {
                // Upload completed successfully
                try {
                  // Get download URL (optional - for admin preview)
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                  console.log("File uploaded successfully:", downloadURL)
                  
                  // Update lesson with video path (save objectPath, not signed URL)
                  const videoPath = objectPath
                  
                  // IMPORTANT: Save course and lesson to Firestore with published:true
                  // This ensures they are visible to all members
                  
                  // 1. Ensure course exists and is published in Firestore
                  const { getFirebaseFirestore } = await import("@/lib/firebase-client")
                  const db = getFirebaseFirestore()
                  
                  if (db) {
                    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore")
                    
                    // Save/update course in Firestore
                    const courseRef = doc(db, "courses", courseId)
                    await setDoc(
                      courseRef,
                      {
                        title: course?.title || formData.title || "Corso",
                        description: course?.description || formData.description || "",
                        category: course?.category || formData.category || "",
                        thumbnailUrl: course?.thumbnailUrl || formData.thumbnailUrl || "",
                        published: true, // Always publish when lesson is saved
                        updatedAt: serverTimestamp(),
                      },
                      { merge: true } // Merge with existing data
                    )
                    console.log("[Firestore] Course saved/updated:", courseId)
                    
                    // 2. Update lesson in Firestore with videoPath and published:true
                    const lessonRef = doc(db, "courses", courseId, "lessons", lessonId)
                    await setDoc(
                      lessonRef,
                      {
                        courseId,
                        title: lesson.title,
                        description: lesson.description || "",
                        videoUrl: videoPath,
                        duration: lesson.duration || 0,
                        order: lesson.order || 0,
                        published: true, // Always publish when video is uploaded
                        updatedAt: serverTimestamp(),
                      },
                      { merge: true } // Merge with existing data
                    )
                    console.log("[Firestore] Lesson saved/updated with videoPath:", lessonId, videoPath)
                  } else {
                    // Fallback to API if Firestore not available
                    const updateRes = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        videoUrl: videoPath,
                        published: true,
                      }),
                    })

                    if (!updateRes.ok) {
                      console.warn("Failed to update lesson with videoPath, but upload succeeded")
                    }
                  }

                  // Update local state
                  updatedLessons[index] = { ...updatedLessons[index], videoUrl: videoPath, published: true }
                  setLessons(updatedLessons)
                  
                  // Remove from pending files
                  const newPendingFiles = new Map(pendingVideoFiles)
                  newPendingFiles.delete(index)
                  setPendingVideoFiles(newPendingFiles)
                  
                  resolve()
                } catch (error) {
                  console.error("Error saving to Firestore:", error)
                  reject(error)
                }
              }
            )
          })

          alert("Lezione e video salvati con successo!")
        } catch (uploadError: any) {
          console.error("Error uploading video:", uploadError)
          const errorMessage = uploadError.code === "storage/unauthorized"
            ? "Errore autorizzazione: verifica di essere admin e che le Storage Rules permettano l'upload"
            : uploadError.message || "Lezione salvata ma errore nel caricamento del video"
          alert(errorMessage)
        }
      } else {
        alert("Lezione salvata con successo!")
      }
    } catch (error: any) {
      console.error("Error saving lesson:", error)
      alert(error.message || "Errore nel salvataggio della lezione")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveLesson = (index: number) => {
    if (confirm("Sei sicuro di voler rimuovere questa lezione?")) {
      const updatedLessons = lessons.filter((_, i) => i !== index)
      // Reorder lessons
      updatedLessons.forEach((lesson, i) => {
        lesson.order = i + 1
      })
      setLessons(updatedLessons)
    }
  }

  const handleLessonChange = (index: number, field: keyof Lesson, value: any) => {
    const updatedLessons = [...lessons]
    updatedLessons[index] = { ...updatedLessons[index], [field]: value }
    setLessons(updatedLessons)
  }

  const handleUploadMultipleVideos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploading(true)
      const newLessons: Partial<Lesson>[] = []
      const newPendingFiles = new Map(pendingVideoFiles)
      const startOrder = lessons.length + 1
      const startIndex = lessons.length

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Extract filename without extension for title
        const fileName = file.name.replace(/\.[^/.]+$/, "")
        
        // Create lesson placeholder
        const lessonPlaceholder: Partial<Lesson> = {
          title: fileName,
          description: "",
          videoUrl: "",
          duration: 0,
          order: startOrder + i,
          published: false,
        }
        
        newLessons.push(lessonPlaceholder)
        // Store file reference for later upload
        newPendingFiles.set(startIndex + i, file)
      }

      // Add all new lessons to state
      setLessons([...lessons, ...newLessons as Lesson[]])
      setPendingVideoFiles(newPendingFiles)
      
      alert(`${files.length} video selezionati. Completa le informazioni per ogni lezione e salva per caricare i video.`)
    } catch (error) {
      console.error("Error processing videos:", error)
      alert("Errore nel processare i video")
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ""
    }
  }

  if (isLoading) {
    return (
      <AdminRequired>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </AdminRequired>
    )
  }

  return (
    <AdminRequired>
      <div className="py-8">
        <DemoModeBanner />

        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/admin/courses")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla lista corsi
          </Button>
          <h1 className="text-3xl font-bold mb-2">Modifica Corso</h1>
          <p className="text-muted-foreground">{course?.title || "Caricamento..."}</p>
        </div>

        {/* Course Info Form */}
        <form onSubmit={handleSaveCourse} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Corso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
                >
                  <option value="">Seleziona una categoria</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">URL Thumbnail</Label>
                <Input
                  id="thumbnailUrl"
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="published">Pubblicato</Label>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Lessons Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lezioni del Corso</CardTitle>
                <CardDescription>
                  Aggiungi e gestisci i video delle lezioni. Le lezioni verranno visualizzate nell'ordine specificato.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <label htmlFor="upload-multiple-videos" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Plus className="h-4 w-4 mr-2" />
                      Carica Video Multipli
                    </span>
                  </Button>
                </label>
                <input
                  id="upload-multiple-videos"
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  onChange={handleUploadMultipleVideos}
                />
                <Button onClick={handleAddLesson}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Lezione Manuale
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-4">
                <p>Nessuna lezione ancora.</p>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm">Puoi:</p>
                  <div className="flex gap-2">
                    <label htmlFor="upload-multiple-videos-empty" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Plus className="h-4 w-4 mr-2" />
                          Carica Video Multipli
                        </span>
                      </Button>
                    </label>
                    <input
                      id="upload-multiple-videos-empty"
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={handleUploadMultipleVideos}
                    />
                    <Button size="sm" onClick={handleAddLesson}>
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Lezione Manuale
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {lessons.map((lesson, index) => (
                  <Card key={lesson.id || index} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">Lezione {index + 1}</CardTitle>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveLesson(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Titolo Lezione *</Label>
                          <Input
                            value={lesson.title || ""}
                            onChange={(e) => handleLessonChange(index, "title", e.target.value)}
                            placeholder="Es: Introduzione alla Neuroscienza"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ordine</Label>
                          <Input
                            type="number"
                            value={lesson.order || index + 1}
                            onChange={(e) => handleLessonChange(index, "order", parseInt(e.target.value) || index + 1)}
                            min={1}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descrizione</Label>
                        <Textarea
                          value={lesson.description || ""}
                          onChange={(e) => handleLessonChange(index, "description", e.target.value)}
                          rows={3}
                          placeholder="Descrizione della lezione..."
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Video *</Label>
                          <div className="space-y-2">
                            {pendingVideoFiles.has(index) && !lesson.id ? (
                              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <p className="text-sm text-blue-300">
                                  📹 Video in attesa: {pendingVideoFiles.get(index)?.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Salva la lezione per caricare automaticamente il video
                                </p>
                              </div>
                            ) : lesson.id ? (
                              <>
                                <Input
                                  type="file"
                                  accept="video/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (!file) return
                                    
                                    if (!lesson.id) {
                                      alert("Salva prima la lezione prima di caricare il video")
                                      return
                                    }
                                    
                                    try {
                                      setIsUploading(true)
                                      
                                      // Initialize Firebase Storage
                                      const { getFirebaseStorage } = await import("@/lib/firebase-client")
                                      const storage = getFirebaseStorage()
                                      
                                      if (!storage) {
                                        throw new Error("Firebase Storage non inizializzato. Verifica la configurazione Firebase.")
                                      }

                                      // Import Firebase Storage functions
                                      const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage")

                                      // Create storage reference
                                      const objectPath = `courses/${courseId}/lessons/${lesson.id}/video.mp4`
                                      const storageRef = ref(storage, objectPath)

                                      // Upload file with resumable upload (supports large files)
                                      const uploadTask = uploadBytesResumable(storageRef, file, {
                                        contentType: file.type,
                                      })

                                      // Wait for upload to complete
                                      await new Promise<void>((resolve, reject) => {
                                        uploadTask.on(
                                          "state_changed",
                                          (snapshot) => {
                                            // Progress tracking
                                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                                            console.log(`Upload progress: ${progress.toFixed(1)}%`)
                                          },
                                          (error) => {
                                            console.error("Upload error:", error)
                                            reject(error)
                                          },
                                          async () => {
                                            // Upload completed successfully
                                            try {
                                              // Get download URL (optional - for admin preview)
                                              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
                                              console.log("File uploaded successfully:", downloadURL)
                                              
                                              // Update lesson with video path (save objectPath, not signed URL)
                                              const videoPath = objectPath
                                              
                                              // IMPORTANT: Save course and lesson to Firestore with published:true
                                              const { getFirebaseFirestore } = await import("@/lib/firebase-client")
                                              const db = getFirebaseFirestore()
                                              
                                              if (db) {
                                                const { doc, setDoc, serverTimestamp } = await import("firebase/firestore")
                                                
                                                // Save/update course in Firestore
                                                const courseRef = doc(db, "courses", courseId)
                                                await setDoc(
                                                  courseRef,
                                                  {
                                                    title: course?.title || formData.title || "Corso",
                                                    description: course?.description || formData.description || "",
                                                    category: course?.category || formData.category || "",
                                                    thumbnailUrl: course?.thumbnailUrl || formData.thumbnailUrl || "",
                                                    published: true, // Always publish when lesson video is uploaded
                                                    updatedAt: serverTimestamp(),
                                                  },
                                                  { merge: true }
                                                )
                                                console.log("[Firestore] Course saved/updated:", courseId)
                                                
                                                // Update lesson in Firestore with videoPath and published:true
                                                const lessonRef = doc(db, "courses", courseId, "lessons", lesson.id)
                                                await setDoc(
                                                  lessonRef,
                                                  {
                                                    courseId,
                                                    title: lesson.title,
                                                    description: lesson.description || "",
                                                    videoUrl: videoPath,
                                                    duration: lesson.duration || 0,
                                                    order: lesson.order || 0,
                                                    published: true, // Always publish when video is uploaded
                                                    updatedAt: serverTimestamp(),
                                                  },
                                                  { merge: true }
                                                )
                                                console.log("[Firestore] Lesson saved/updated with videoPath:", lesson.id, videoPath)
                                              } else {
                                                // Fallback to API
                                                const updateRes = await fetch(`/api/courses/${courseId}/lessons/${lesson.id}`, {
                                                  method: "PATCH",
                                                  headers: { "Content-Type": "application/json" },
                                                  body: JSON.stringify({ 
                                                    videoUrl: videoPath,
                                                    published: true,
                                                  }),
                                                })

                                                if (!updateRes.ok) {
                                                  console.warn("Failed to update lesson with videoPath, but upload succeeded")
                                                }
                                              }

                                              // Update local state
                                              handleLessonChange(index, "videoUrl", videoPath)
                                              
                                              resolve()
                                            } catch (error) {
                                              console.error("Error saving to Firestore:", error)
                                              reject(error)
                                            }
                                          }
                                        )
                                      })

                                      alert("Video caricato con successo!")
                                    } catch (error: any) {
                                      console.error("Error uploading video:", error)
                                      const errorMessage = error.code === "storage/unauthorized"
                                        ? "Errore autorizzazione: verifica di essere admin e che le Storage Rules permettano l'upload"
                                        : error.message || "Errore nel caricamento del video"
                                      alert(errorMessage)
                                    } finally {
                                      setIsUploading(false)
                                    }
                                  }}
                                  disabled={isUploading}
                                  className="cursor-pointer"
                                />
                                {isUploading && <p className="text-sm text-muted-foreground">Caricamento in corso...</p>}
                              </>
                            ) : (
                              <div className="space-y-2">
                                <Input
                                  type="url"
                                  value={lesson.videoUrl || ""}
                                  onChange={(e) => handleLessonChange(index, "videoUrl", e.target.value)}
                                  placeholder="Inserisci URL video o salva la lezione per caricare un file"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Puoi inserire un URL video esterno oppure salvare la lezione per caricare un file
                                </p>
                              </div>
                            )}
                            {lesson.videoUrl && lesson.id && (
                              <p className="text-sm text-muted-foreground">
                                Video: {lesson.videoUrl}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Durata (secondi)</Label>
                          <Input
                            type="number"
                            value={lesson.duration || 0}
                            onChange={(e) => handleLessonChange(index, "duration", parseInt(e.target.value) || 0)}
                            min={0}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={lesson.published || false}
                          onChange={(e) => handleLessonChange(index, "published", e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label>Pubblica questa lezione</Label>
                      </div>

                      {!lesson.id && (
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={() => handleSaveLesson(lesson, index)}
                            disabled={!lesson.title}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Salva Lezione
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRequired>
  )
}

