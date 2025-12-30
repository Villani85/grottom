# Fix Route Collision: courseId !== id

## Problema Identificato

**Errore Next.js**:
```
"You cannot use different slug names for the same dynamic path ('courseId' !== 'id')."
```

## Cartelle in Conflitto Trovate

In `app/api/admin/courses/` esistevano **due cartelle dinamiche allo stesso livello**:

1. ✅ `app/api/admin/courses/[id]/...` (corretta, nuova Academy)
2. ❌ `app/api/admin/courses/[courseId]/...` (vecchia, in conflitto)

### File in Conflitto

#### 1. Upload URL Route
- **Vecchia**: `app/api/admin/courses/[courseId]/lessons/[lessonId]/upload-url/route.ts`
- **Nuova**: `app/api/admin/courses/[id]/lessons/[lessonId]/upload-url/route.ts`
- **Modifica**: `params.courseId` → `params.id` (rinominato internamente a `courseId` per compatibilità)

#### 2. Course Route (vecchia, duplicata)
- **Eliminata**: `app/api/admin/courses/[courseId]/route.ts`
- **Motivo**: Duplicato di `app/api/admin/courses/[id]/route.ts`, usava vecchio repository

## File Spostati/Eliminati

### ❌ Eliminati
1. `app/api/admin/courses/[courseId]/lessons/[lessonId]/upload-url/route.ts` ✅
2. `app/api/admin/courses/[courseId]/route.ts` ✅
3. Cartella `app/api/admin/courses/[courseId]/` (vuota, può essere rimossa manualmente)

### ✅ Creati/Spostati
1. `app/api/admin/courses/[id]/lessons/[lessonId]/upload-url/route.ts` (nuova posizione) ✅

## Modifiche al Codice

### `app/api/admin/courses/[id]/lessons/[lessonId]/upload-url/route.ts`

**Prima**:
```typescript
{ params }: { params: Promise<{ courseId: string; lessonId: string }> }
const { courseId, lessonId } = await params
```

**Dopo**:
```typescript
{ params }: { params: Promise<{ id: string; lessonId: string }> }
const { id: courseId, lessonId } = await params  // Rinomina id -> courseId per compatibilità
```

**Nota**: Il parametro route è ora `id`, ma internamente viene rinominato a `courseId` per mantenere la logica esistente (objectPath, etc.).

## Verifica

### Route Finali (Consistenti)
- ✅ `POST /api/admin/courses/[id]/lessons/[lessonId]/upload-url`
- ✅ `PUT /api/admin/courses/[id]`
- ✅ `DELETE /api/admin/courses/[id]`
- ✅ `POST /api/admin/courses/[id]/modules`
- ✅ `PUT /api/admin/courses/[id]/modules/[moduleId]`
- ✅ `DELETE /api/admin/courses/[id]/modules/[moduleId]`
- ✅ `POST /api/admin/courses/[id]/modules/[moduleId]/lessons`
- ✅ `PUT /api/admin/courses/[id]/modules/[moduleId]/lessons/[lessonId]`
- ✅ `DELETE /api/admin/courses/[id]/modules/[moduleId]/lessons/[lessonId]`
- ✅ `POST /api/admin/courses/[id]/recalculate`

**Tutte le route admin ora usano `[id]` consistentemente.**

## Test

### Comando
```bash
npm run dev
```

### Risultato Atteso
✅ **Nessun errore** "courseId !== id"
✅ Server avvia correttamente
✅ Route admin funzionano con parametro `id`

## Note

- La route upload-url ora usa `[id]` invece di `[courseId]`
- Se ci sono chiamate client a `/api/admin/courses/[courseId]/lessons/[lessonId]/upload-url`, devono essere aggiornate a `/api/admin/courses/[id]/lessons/[lessonId]/upload-url`
- Il parametro interno `courseId` è mantenuto per compatibilità con la logica esistente (objectPath, etc.)
- La cartella vuota `app/api/admin/courses/[courseId]/` può essere rimossa manualmente se persiste (Next.js la ignora se non contiene route.ts)
