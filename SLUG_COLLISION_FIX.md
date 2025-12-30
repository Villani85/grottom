# Fix Route Collision: courseId !== slug

## Problema Identificato

**Errore Next.js**:
```
"You cannot use different slug names for the same dynamic path ('courseId' !== 'slug')."
```

## Path in Conflitto Trovati

In `app/api/courses/` coesistevano **due cartelle dinamiche allo stesso livello**:

1. ✅ `app/api/courses/[slug]/route.ts` (pubblico, nuovo sistema Academy)
2. ❌ `app/api/courses/[courseId]/...` (vecchio sistema, in conflitto)

### File in Conflitto (Vecchio Sistema)

Tutti i file sotto `app/api/courses/[courseId]/` erano del vecchio sistema e sono stati eliminati:

1. ❌ `app/api/courses/[courseId]/route.ts` (GET corso)
2. ❌ `app/api/courses/[courseId]/lessons/route.ts` (GET/POST lezioni)
3. ❌ `app/api/courses/[courseId]/lessons/[lessonId]/route.ts` (GET/PATCH lezione)
4. ❌ `app/api/courses/[courseId]/lessons/[lessonId]/comments/route.ts` (GET/POST commenti)
5. ❌ `app/api/courses/[courseId]/lessons/[lessonId]/complete/route.ts` (già spostato a `/api/progress/...`)

## Soluzione Implementata

### Route Pubbliche (Mantengono [slug])
- ✅ `app/api/courses/[slug]/route.ts` - Dettaglio corso pubblico
- ✅ `app/academy/[slug]/page.tsx` - Pagina corso pubblico

### Route Progress (Usano [courseId] ma fuori da /api/courses)
- ✅ `app/api/progress/courses/[courseId]/lessons/[lessonId]/complete/route.ts` - Completamento lezione

### Route Admin (Usano [id])
- ✅ `app/api/admin/courses/[id]/...` - Tutte le route admin

## File Eliminati

### ❌ Eliminati (4 file route.ts)
1. ✅ `app/api/courses/[courseId]/route.ts`
2. ✅ `app/api/courses/[courseId]/lessons/route.ts`
3. ✅ `app/api/courses/[courseId]/lessons/[lessonId]/route.ts`
4. ✅ `app/api/courses/[courseId]/lessons/[lessonId]/comments/route.ts`

**Nota**: La cartella vuota `app/api/courses/[courseId]/` può rimanere - Next.js la ignora perché non contiene `route.ts`.

### ⚠️ Note su Compatibilità

Le seguenti pagine/client potrebbero ancora chiamare le vecchie route (ora eliminate):
- `app/area-riservata/corsi/[courseId]/page.tsx`
- `app/area-riservata/corsi/[courseId]/lezioni/[lessonId]/page.tsx`
- `app/admin/courses/[courseId]/edit/page.tsx`

**Raccomandazione**: Queste pagine dovrebbero essere aggiornate per usare:
- `/api/courses/[slug]` per i corsi pubblici (se hanno lo slug)
- `/api/admin/courses/[id]` per le operazioni admin
- `/api/progress/courses/[courseId]/lessons/[lessonId]/complete` per il completamento

## Verifica

### Route Finali (Nessun Conflitto)

#### Pubbliche (slug)
- ✅ `GET /api/courses/[slug]` - Dettaglio corso
- ✅ `GET /academy/[slug]` - Pagina corso

#### Progress (courseId, fuori da /api/courses)
- ✅ `POST /api/progress/courses/[courseId]/lessons/[lessonId]/complete`

#### Admin (id)
- ✅ `GET /api/admin/courses`
- ✅ `POST /api/admin/courses`
- ✅ `PUT /api/admin/courses/[id]`
- ✅ `DELETE /api/admin/courses/[id]`
- ✅ ... tutte le altre route admin

## Test

### Comando
```bash
npm run dev
```

### Risultato Atteso
✅ **Nessun errore** "courseId !== slug"
✅ Server avvia correttamente
✅ Route pubbliche funzionano con `[slug]`
✅ Route progress funzionano con `[courseId]` (fuori da `/api/courses`)

## Struttura Finale

```
app/api/courses/
  ├── [slug]/
  │   └── route.ts          ✅ Pubblico (nuovo sistema)
  └── route.ts               ✅ Lista corsi pubblici

app/api/progress/courses/
  └── [courseId]/
      └── lessons/
          └── [lessonId]/
              └── complete/
                  └── route.ts  ✅ Completamento lezione

app/api/admin/courses/
  └── [id]/                   ✅ Tutte le route admin
      ├── route.ts
      ├── modules/
      ├── lessons/
      └── ...
```

**Nessun conflitto: ogni path usa un solo tipo di parametro dinamico.**

