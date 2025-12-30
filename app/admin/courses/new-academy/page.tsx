"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { AdminRequired } from "@/components/AdminRequired"
import { DemoModeBanner } from "@/components/DemoModeBanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import type { Category } from "@/lib/types-academy"
import { getFirebaseIdToken } from "@/lib/api-helpers"

interface Module {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  type: "video" | "testo" | "quiz" | "risorsa"
  durationMinutes: number
  content?: string
  videoUrl?: string
  isFreePreview: boolean
  order: number
}

export default function NewAcademyCoursePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    categoryId: "",
    level: "Base" as "Base" | "Intermedio" | "Avanzato",
    shortDescription: "",
    longDescription: "",
    focusTags: [] as string[],
    isBestSeller: false,
    isNew: false,
    ratingAvg: undefined as number | undefined,
    ratingCount: undefined as number | undefined,
    coverImageUrl: "",
    previewVideoUrl: "",
    published: false,
  })
  const [tagInput, setTagInput] = useState("")
  const [modules, setModules] = useState<Module[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [indexCreateUrl, setIndexCreateUrl] = useState<string | null>(null)
  
  // Upload states
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [previewVideoFile, setPreviewVideoFile] = useState<File | null>(null)
  const [coverImageMode, setCoverImageMode] = useState<"url" | "file">("url")
  const [previewVideoMode, setPreviewVideoMode] = useState<"url" | "file">("url")
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingPreview, setUploadingPreview] = useState(false)
  
  // Ref per evitare spam console (logga solo una volta)
  const hasLoggedIndexError = useRef(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      setCategoriesError(null)
      setIndexCreateUrl(null)
      const res = await fetch("/api/categories")
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Errore sconosciuto" }))
        
        // INDEX_REQUIRED non dovrebbe più verificarsi (repository usa query senza orderBy)
        // Manteniamo il fallback per sicurezza, ma non logghiamo più
        if ((res.status === 409 || res.status === 424) && errorData?.code === "INDEX_REQUIRED") {
          // Non loggare più questo errore (non dovrebbe più verificarsi)
          // Usa categoria default invece di bloccare l'UI
          const defaultCategory: Category = {
            id: "academy",
            name: "Academy",
            order: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          setCategories([defaultCategory])
          setCategoriesError("⚠️ Categorie non presenti nel DB, sto usando categoria default 'Academy'")
          setFormData((prev) => ({
            ...prev,
            categoryId: defaultCategory.id,
          }))
          setCategoriesLoading(false)
          return
        }
        
        // Altri errori: mostra messaggio generico
        const errorMessage = errorData.error || errorData.message || (typeof errorData === "string" ? errorData : "") || `Errore ${res.status}`
        
        // Log solo in dev
        if (process.env.NODE_ENV !== "production") {
          console.error("Error fetching categories:", errorMessage)
        }
        
        setCategoriesError(errorMessage)
        setCategoriesLoading(false)
        return
      }
      
      const data = await res.json()
      const cats = data.categories || []
      
      // Reset ref se query riuscita
      hasLoggedIndexError.current = false
      setIndexCreateUrl(null)
      
      if (cats.length === 0) {
        // Use default fallback category if none exist
        const defaultCategory: Category = {
          id: "academy",
          name: "Academy",
          order: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setCategories([defaultCategory])
        setCategoriesError("⚠️ Categorie non presenti nel DB, sto usando categoria default 'Academy'")
        // Auto-select default category
        setFormData((prev) => ({
          ...prev,
          categoryId: defaultCategory.id,
        }))
      } else {
        setCategories(cats)
        setCategoriesError(null)
        // Auto-select first category if none selected
        if (!formData.categoryId && cats.length > 0) {
          setFormData((prev) => ({
            ...prev,
            categoryId: cats[0].id,
          }))
        }
      }
    } catch (error: any) {
      // Log solo in dev
      if (process.env.NODE_ENV !== "production") {
        console.error("Error fetching categories:", error)
      }
      setCategoriesError(error.message || "Errore nel caricamento delle categorie. Verifica la console per dettagli.")
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleSeedDefaultCategory = async () => {
    try {
      setIsLoading(true)
      const token = await getFirebaseIdToken()
      
      const res = await fetch("/api/admin/categories/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Errore nella creazione della categoria")
      }

      if (data.created) {
        // Ricarica le categorie
        await fetchCategories()
        // Auto-select the created category
        if (data.id) {
          setFormData((prev) => ({ ...prev, categoryId: data.id }))
        }
        alert("Categoria di default creata con successo!")
      } else {
        alert("Categoria già esistente")
        // Ricarica comunque per avere la lista aggiornata
        await fetchCategories()
      }
    } catch (error: any) {
      console.error("Error seeding default category:", error)
      alert(error.message || "Errore nella creazione della categoria")
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title })
    if (!formData.slug) {
      setFormData((prev) => ({ ...prev, slug: generateSlug(title) }))
    }
  }

  const addTag = () => {
    if (tagInput.trim() && formData.focusTags.length < 5) {
      setFormData({
        ...formData,
        focusTags: [...formData.focusTags, tagInput.trim()],
      })
      setTagInput("")
    }
  }

  const removeTag = (index: number) => {
    setFormData({
      ...formData,
      focusTags: formData.focusTags.filter((_, i) => i !== index),
    })
  }

  const addModule = () => {
    setModules([
      ...modules,
      {
        id: `module-${Date.now()}`,
        title: "",
        order: modules.length,
        lessons: [],
      },
    ])
  }

  const removeModule = (moduleId: string) => {
    setModules(modules.filter((m) => m.id !== moduleId))
  }

  const updateModule = (moduleId: string, field: string, value: any) => {
    setModules(
      modules.map((m) =>
        m.id === moduleId
          ? { ...m, [field]: value }
          : { ...m, order: modules.indexOf(m) }
      )
    )
  }

  const addLesson = (moduleId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: [
              ...m.lessons,
              {
                id: `lesson-${Date.now()}`,
                title: "",
                type: "video" as const,
                durationMinutes: 0,
                isFreePreview: false,
                order: m.lessons.length,
              },
            ],
          }
        }
        return m
      })
    )
  }

  const removeLesson = (moduleId: string, lessonId: string) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.filter((l) => l.id !== lessonId),
          }
        }
        return m
      })
    )
  }

  const updateLesson = (moduleId: string, lessonId: string, field: string, value: any) => {
    setModules(
      modules.map((m) => {
        if (m.id === moduleId) {
          return {
            ...m,
            lessons: m.lessons.map((l) =>
              l.id === lessonId ? { ...l, [field]: value } : l
            ),
          }
        }
        return m
      })
    )
  }

  const calculateStats = () => {
    const allLessons = modules.flatMap((m) => m.lessons)
    const durationMinutes = allLessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0)
    const lessonsCount = allLessons.length
    return { durationMinutes, lessonsCount }
  }

  // Upload helper per immagini (usa uploadBytes - Promise vera)
  const uploadImageFile = async (file: File, prefix: string): Promise<string> => {
    const { getFirebaseStorage } = await import("@/lib/firebase-client")
    const storage = getFirebaseStorage()
    
    if (!storage) {
      throw new Error("Firebase Storage non inizializzato. Verifica la configurazione Firebase.")
    }

    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
    
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const storagePath = `courses/${prefix}/${timestamp}-${sanitizedFilename}`
    
    const storageRef = ref(storage, storagePath)
    await uploadBytes(storageRef, file, { contentType: file.type })
    const downloadURL = await getDownloadURL(storageRef)
    
    return downloadURL
  }

  // Upload helper per video (usa uploadBytesResumable - Promise wrapper)
  const uploadVideoFile = async (file: File, prefix: string): Promise<string> => {
    const { getFirebaseStorage } = await import("@/lib/firebase-client")
    const storage = getFirebaseStorage()
    
    if (!storage) {
      throw new Error("Firebase Storage non inizializzato. Verifica la configurazione Firebase.")
    }

    const { ref, uploadBytesResumable, getDownloadURL } = await import("firebase/storage")
    
    const timestamp = Date.now()
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const storagePath = `courses/${prefix}/${timestamp}-${sanitizedFilename}`
    
    const storageRef = ref(storage, storagePath)
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    })

    // Wrappare in Promise (NON fare await uploadTask direttamente)
    await new Promise<void>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log(`Upload progress: ${progress.toFixed(1)}%`)
        },
        (error) => {
          console.error("Upload error:", error)
          reject(error)
        },
        async () => {
          resolve()
        }
      )
    })

    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
    return downloadURL
  }

  const handleCoverImageFileChange = async (file: File | null) => {
    if (!file) {
      setCoverImageFile(null)
      return
    }

    if (!file.type.startsWith("image/")) {
      alert("Seleziona un file immagine")
      return
    }

    setCoverImageFile(file)
  }

  const handlePreviewVideoFileChange = async (file: File | null) => {
    if (!file) {
      setPreviewVideoFile(null)
      return
    }

    if (!file.type.startsWith("video/")) {
      alert("Seleziona un file video")
      return
    }

    setPreviewVideoFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = await getFirebaseIdToken()
      if (!token) {
        alert("Errore di autenticazione")
        return
      }

      const { durationMinutes, lessonsCount } = calculateStats()

      // 0. Upload file se in modalità FILE
      let finalCoverImageUrl = formData.coverImageUrl || undefined
      let finalPreviewVideoUrl = formData.previewVideoUrl || undefined

      if (coverImageMode === "file" && coverImageFile) {
        try {
          setUploadingCover(true)
          finalCoverImageUrl = await uploadImageFile(coverImageFile, "covers")
        } catch (error: any) {
          throw new Error(`Errore upload cover image: ${error.message}`)
        } finally {
          setUploadingCover(false)
        }
      }

      if (previewVideoMode === "file" && previewVideoFile) {
        try {
          setUploadingPreview(true)
          finalPreviewVideoUrl = await uploadVideoFile(previewVideoFile, "previews")
        } catch (error: any) {
          throw new Error(`Errore upload preview video: ${error.message}`)
        } finally {
          setUploadingPreview(false)
        }
      }

      // 1. Crea corso
      const coursePayload = {
        ...formData,
        durationMinutes,
        lessonsCount,
        coverImageUrl: finalCoverImageUrl || undefined,
        previewVideoUrl: finalPreviewVideoUrl || undefined,
        ratingAvg: formData.ratingAvg || undefined,
        ratingCount: formData.ratingCount || undefined,
      }

      const courseRes = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(coursePayload),
      })

      // Robust JSON parsing: read as text first, then parse
      const responseText = await courseRes.text()
      let courseData: any
      
      try {
        courseData = responseText ? JSON.parse(responseText) : {}
      } catch (parseError: any) {
        throw new Error(`Errore parsing risposta server: ${parseError.message || "Invalid JSON"}`)
      }

      if (!courseRes.ok) {
        const errorMsg = courseData.error || courseData.message || `Errore ${courseRes.status}: ${responseText.substring(0, 100)}`
        throw new Error(errorMsg)
      }

      if (!courseData.id && !courseData.success) {
        throw new Error(courseData.error || "Errore creazione corso: ID non restituito")
      }

      const courseId = courseData.id

      // 2. Crea moduli e lezioni
      for (let mIdx = 0; mIdx < modules.length; mIdx++) {
        const module = modules[mIdx]
        if (!module.title.trim()) {
          throw new Error(`Modulo ${mIdx + 1}: titolo obbligatorio`)
        }

        const moduleRes = await fetch(`/api/admin/courses/${courseId}/modules`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: module.title,
            order: mIdx,
          }),
        })

        const moduleData = await moduleRes.json()

        if (!moduleRes.ok || !moduleData.id) {
          throw new Error(`Errore creazione modulo ${mIdx + 1}: ${moduleData.error}`)
        }

        const moduleId = moduleData.id

        // 3. Crea lezioni per questo modulo
        for (let lIdx = 0; lIdx < module.lessons.length; lIdx++) {
          const lesson = module.lessons[lIdx]
          if (!lesson.title.trim()) {
            throw new Error(`Modulo ${mIdx + 1}, Lezione ${lIdx + 1}: titolo obbligatorio`)
          }

          const lessonPayload: any = {
            title: lesson.title,
            type: lesson.type,
            durationMinutes: lesson.durationMinutes || 0,
            isFreePreview: lesson.isFreePreview,
            order: lIdx,
          }

          if (lesson.type === "video" && lesson.videoUrl) {
            lessonPayload.videoUrl = lesson.videoUrl || ""
          } else if (lesson.type !== "video" && lesson.content) {
            lessonPayload.content = lesson.content
          }

          const lessonRes = await fetch(
            `/api/admin/courses/${courseId}/modules/${moduleId}/lessons`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(lessonPayload),
            }
          )

          const lessonData = await lessonRes.json()

          if (!lessonRes.ok || !lessonData.id) {
            throw new Error(
              `Errore creazione lezione M${mIdx + 1} L${lIdx + 1}: ${lessonData.error}`
            )
          }
        }
      }

      // 4. Ricalcola stats
      await fetch(`/api/admin/courses/${courseId}/recalculate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      router.push(`/admin/courses?success=Course created successfully`)
    } catch (error: any) {
      console.error("Error creating course:", error)
      alert(error.message || "Errore nella creazione del corso")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminRequired>
      <div className="py-8">
        <DemoModeBanner />

        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/courses")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla lista corsi
          </Button>
          <h1 className="text-3xl font-bold mb-2">Nuovo Corso Academy</h1>
          <p className="text-muted-foreground">Crea un corso completo con moduli e lezioni</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Dati Corso */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dati Corso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  placeholder="Es: Fondamenti di Neuroscienza Applicata"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                    }
                    required
                    pattern="^[a-z0-9-]+$"
                    placeholder="fondamenti-neuroscienza-applicata"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, slug: generateSlug(formData.title) })}
                  >
                    Genera da titolo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoria *</Label>
                  {categoriesLoading ? (
                    <div className="text-sm text-muted-foreground">Caricamento categorie...</div>
                  ) : categoriesError && !categoriesError.includes("⚠️") ? (
                    <div className="space-y-3">
                      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
                        <p className="font-semibold text-destructive mb-2">Impossibile caricare le categorie</p>
                        <p className="text-destructive whitespace-pre-line mb-3">{categoriesError}</p>
                        {indexCreateUrl && (
                          <a
                            href={indexCreateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            🔗 Apri Firebase Console per creare l'indice
                          </a>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="default"
                        onClick={fetchCategories}
                        className="w-full"
                      >
                        🔄 Riprova caricamento categorie
                      </Button>
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Nessuna categoria disponibile.
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSeedDefaultCategory}
                        disabled={isLoading}
                      >
                        Crea categorie di default
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categoriesError && categoriesError.includes("⚠️") && (
                        <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-2 text-sm text-yellow-700 dark:text-yellow-400">
                          {categoriesError}
                        </div>
                      )}
                      <select
                        id="categoryId"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        required
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
                      >
                        <option value="">Seleziona categoria</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Livello *</Label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: e.target.value as "Base" | "Intermedio" | "Avanzato",
                      })
                    }
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
                  >
                    <option value="Base">Base</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzato">Avanzato</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">
                  Descrizione Breve * (max 160 caratteri)
                </Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, shortDescription: e.target.value })
                  }
                  required
                  maxLength={160}
                  rows={2}
                  placeholder="Breve descrizione del corso..."
                />
                <p className="text-xs text-muted-foreground">
                  {formData.shortDescription.length}/160
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="longDescription">
                  Descrizione Estesa * (max 2000 caratteri)
                </Label>
                <Textarea
                  id="longDescription"
                  value={formData.longDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, longDescription: e.target.value })
                  }
                  required
                  maxLength={2000}
                  rows={6}
                  placeholder="Descrizione dettagliata del corso..."
                />
                <p className="text-xs text-muted-foreground">
                  {formData.longDescription.length}/2000
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="focusTags">Focus Tags (max 5)</Label>
                <div className="flex gap-2">
                  <Input
                    id="focusTags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Aggiungi tag..."
                    disabled={formData.focusTags.length >= 5}
                  />
                  <Button type="button" onClick={addTag} disabled={formData.focusTags.length >= 5}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.focusTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(idx)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Cover Image</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={coverImageMode === "url"}
                          onChange={() => setCoverImageMode("url")}
                          className="h-4 w-4"
                        />
                        URL
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={coverImageMode === "file"}
                          onChange={() => setCoverImageMode("file")}
                          className="h-4 w-4"
                        />
                        File
                      </label>
                    </div>
                    {coverImageMode === "url" ? (
                      <Input
                        id="coverImageUrl"
                        type="url"
                        value={formData.coverImageUrl}
                        onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    ) : (
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCoverImageFileChange(e.target.files?.[0] || null)}
                          disabled={uploadingCover}
                        />
                        {coverImageFile && (
                          <div className="mt-2 space-y-1">
                            <img
                              src={URL.createObjectURL(coverImageFile)}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded border"
                              onLoad={(e) => {
                                const url = (e.target as HTMLImageElement).src
                                if (url.startsWith("blob:")) {
                                  setTimeout(() => URL.revokeObjectURL(url), 1000)
                                }
                              }}
                            />
                            <p className="text-xs text-muted-foreground">
                              {coverImageFile.name} ({(coverImageFile.size / 1024).toFixed(1)} KB)
                            </p>
                            {uploadingCover && <p className="text-xs text-blue-500">Uploading...</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previewVideo">Preview Video</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={previewVideoMode === "url"}
                          onChange={() => setPreviewVideoMode("url")}
                          className="h-4 w-4"
                        />
                        URL
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={previewVideoMode === "file"}
                          onChange={() => setPreviewVideoMode("file")}
                          className="h-4 w-4"
                        />
                        File
                      </label>
                    </div>
                    {previewVideoMode === "url" ? (
                      <Input
                        id="previewVideoUrl"
                        type="url"
                        value={formData.previewVideoUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, previewVideoUrl: e.target.value })
                        }
                        placeholder="https://example.com/video.mp4"
                      />
                    ) : (
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handlePreviewVideoFileChange(e.target.files?.[0] || null)}
                          disabled={uploadingPreview}
                        />
                        {previewVideoFile && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground">
                              {previewVideoFile.name} ({(previewVideoFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                            {uploadingPreview && <p className="text-xs text-blue-500">Uploading...</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isBestSeller}
                    onChange={(e) =>
                      setFormData({ ...formData, isBestSeller: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <span>Best Seller</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isNew}
                    onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span>Nuovo</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData({ ...formData, published: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <span>Pubblicato</span>
                </label>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>
                  Durata: {calculateStats().durationMinutes} min | Lezioni:{" "}
                  {calculateStats().lessonsCount} (calcolati dal programma)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Programma */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Programma</CardTitle>
              <Button type="button" onClick={addModule} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Modulo
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {modules.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aggiungi almeno un modulo per iniziare
                </p>
              ) : (
                modules.map((module, mIdx) => (
                  <Card key={module.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <Label>Modulo {mIdx + 1} - Titolo *</Label>
                          <Input
                            value={module.title}
                            onChange={(e) =>
                              updateModule(module.id, "title", e.target.value)
                            }
                            placeholder="Es: Introduzione"
                            required
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeModule(module.id)}
                          className="ml-4"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Lezioni</Label>
                        <Button
                          type="button"
                          onClick={() => addLesson(module.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi Lezione
                        </Button>
                      </div>

                      {module.lessons.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          Aggiungi almeno una lezione
                        </p>
                      ) : (
                        module.lessons.map((lesson, lIdx) => (
                          <Card key={lesson.id} className="bg-muted/50">
                            <CardContent className="pt-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">Lezione {lIdx + 1}</Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLesson(module.id, lesson.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Titolo *</Label>
                                  <Input
                                    value={lesson.title}
                                    onChange={(e) =>
                                      updateLesson(module.id, lesson.id, "title", e.target.value)
                                    }
                                    placeholder="Titolo lezione"
                                    required
                                    size={10}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Tipo *</Label>
                                  <select
                                    value={lesson.type}
                                    onChange={(e) =>
                                      updateLesson(
                                        module.id,
                                        lesson.id,
                                        "type",
                                        e.target.value as "video" | "testo" | "quiz" | "risorsa"
                                      )
                                    }
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                                  >
                                    <option value="video">Video</option>
                                    <option value="testo">Testo</option>
                                    <option value="quiz">Quiz</option>
                                    <option value="risorsa">Risorsa</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-xs">Durata (minuti) *</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={lesson.durationMinutes}
                                    onChange={(e) =>
                                      updateLesson(
                                        module.id,
                                        lesson.id,
                                        "durationMinutes",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={lesson.isFreePreview}
                                      onChange={(e) =>
                                        updateLesson(
                                          module.id,
                                          lesson.id,
                                          "isFreePreview",
                                          e.target.checked
                                        )
                                      }
                                      className="h-4 w-4"
                                    />
                                    Anteprima Gratuita
                                  </Label>
                                </div>
                              </div>

                              {lesson.type === "video" ? (
                                <div className="space-y-1">
                                  <Label className="text-xs">URL Video</Label>
                                  <Input
                                    type="url"
                                    value={lesson.videoUrl || ""}
                                    onChange={(e) =>
                                      updateLesson(module.id, lesson.id, "videoUrl", e.target.value)
                                    }
                                    placeholder="https://example.com/video.mp4"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <Label className="text-xs">Contenuto</Label>
                                  <Textarea
                                    value={lesson.content || ""}
                                    onChange={(e) =>
                                      updateLesson(module.id, lesson.id, "content", e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Contenuto della lezione..."
                                  />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/courses")}>
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading || modules.length === 0}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Creazione in corso..." : "Crea Corso Completo"}
            </Button>
          </div>
        </form>
      </div>
    </AdminRequired>
  )
}

