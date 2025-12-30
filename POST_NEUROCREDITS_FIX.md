# Fix NeuroCredits per Creazione Post

## Problema

Creare un post in bacheca non aumentava i NeuroCredits perché mancava l'evento `POST_CREATED`.

## Soluzione Implementata

### 1. Regole Aggiornate (MODIFICATO)
**File**: `lib/neurocredits-rules.ts`

- Aggiunto `POST_CREATED`:
  - `neuroCredits: 2` (2 punti per post creato)
  - `hasDailyCap: true`
  - `dailyCap: 5` (max 5 post al giorno che danno NeuroCredits)

### 2. Sistema Eventi Aggiornato (MODIFICATO)
**File**: `lib/neurocredits.ts`

- Aggiunto case `POST_CREATED` in `generateEventId()`:
  - `eventId: post:${postId}:${uid}` (deterministico, idempotente)
- Aggiunto controllo cap giornaliero per `POST_CREATED`:
  - Controlla `users/{uid}/dailyCaps/{YYYY-MM-DD}.postCreditsUsed`
  - Se >= 5, non assegna NeuroCredits (ma salva comunque il post)
- Aggiunto aggiornamento cap in `updateDailyCap()`:
  - Incrementa `postCreditsUsed` quando un post dà crediti

### 3. API Route Aggiornata (MODIFICATO)
**File**: `app/api/posts/route.ts`

- Dopo creazione post, chiama `applyEvent()` con:
  - `type: "POST_CREATED"`
  - `targetUid: user.uid`
  - `actorUid: user.uid`
  - `deltaNeuroCredits: 2`
  - `ref: { postId }`
- Aggiunto logging dettagliato:
  - Log postId creato
  - Log risultato `applyEvent` (applied, eventId, neuroCreditsAwarded)
  - Log NeuroCredits aggiornati (total, monthCurrent)

### 4. UI Refresh (MODIFICATO)
**File**: `components/posts/PostComposer.tsx`

- Dopo creazione post, emette evento custom `refreshNeuroCredits`
- La pagina `/neurocredits` ascolta l'evento e aggiorna le stats

**File**: `app/neurocredits/page.tsx`

- Aggiunto listener per evento `refreshNeuroCredits`
- Quando ricevuto, chiama `fetchMyStats()` e `fetchLeaderboard()`

## File Modificati

1. **`lib/neurocredits-rules.ts`** (MODIFICATO)
   - Aggiunto `POST_CREATED` con 2 punti e cap giornaliero 5

2. **`lib/neurocredits.ts`** (MODIFICATO)
   - Aggiunto case `POST_CREATED` in `generateEventId()`
   - Aggiunto controllo cap per `POST_CREATED`
   - Aggiunto aggiornamento `postCreditsUsed` in `updateDailyCap()`

3. **`app/api/posts/route.ts`** (MODIFICATO)
   - Aggiunta chiamata `applyEvent()` dopo creazione post
   - Aggiunto logging dettagliato per debug

4. **`components/posts/PostComposer.tsx`** (MODIFICATO)
   - Aggiunto evento custom `refreshNeuroCredits` dopo creazione

5. **`app/neurocredits/page.tsx`** (MODIFICATO)
   - Aggiunto listener per refresh automatico stats

## Regole NeuroCredits

### POST_CREATED
- **Punti**: +2 NeuroCredits per post creato
- **Cap giornaliero**: Max 5 post al giorno che danno NeuroCredits
- **Idempotenza**: Event ID `post:${postId}:${uid}` garantisce che lo stesso post non dia crediti doppi
- **Metriche**: Non incrementa `videosCompleted` o `activeDays` (solo NeuroCredits)

## Test

1. ✅ Creare un post → +2 NeuroCredits (entro cap giornaliero)
2. ✅ Creare 6 post nello stesso giorno → primi 5 danno crediti, il 6° no (cap raggiunto)
3. ✅ Creare lo stesso post due volte → solo +2 crediti (idempotente)
4. ✅ UI si aggiorna automaticamente dopo creazione post
5. ✅ Log server mostrano event applicato e crediti assegnati

## Debug Logs

I log server mostrano:
- `[API Posts] ✅ Post created: { postId, authorId }`
- `[API Posts] 🎯 NeuroCredit event result: { applied, eventId, neuroCreditsAwarded }`
- `[API Posts] 📊 Updated NeuroCredits: { total, monthCurrent }`

Se `applied: false` o `neuroCreditsAwarded: 0`, controllare:
- Se cap giornaliero raggiunto (5 post già creati oggi)
- Se evento già esiste (idempotenza)
- Se Firebase Admin inizializzato correttamente



