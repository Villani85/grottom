# Fix Completo NeuroCredits - Tutte le Azioni

## Problema

Verificare e sistemare TUTTE le azioni che devono aggiornare NeuroCredits/Leaderboard, assicurando che:
- Ogni azione crei un evento idempotente in `neurocredit_events/{eventId}`
- Aggiorni `users/{uid}` (totale + mese) e `leaderboards/{period}/entries/{uid}`
- La UI mostri i nuovi valori subito (no cache stale)

## Azioni Verificate e Sistemate

### ✅ 1. CREATE POST
**Route**: `POST /api/posts`
**Status**: ✅ GIÀ SISTEMATO
- ✅ Chiama `applyEvent` con `POST_CREATED`
- ✅ `eventId: post:${postId}:${uid}` (idempotente)
- ✅ `targetUid = authorUid`
- ✅ `deltaNeuroCredits = +2` (cap giornaliero: 5)
- ✅ Chiama `touchDailyActive(authorUid)`
- ✅ Logging dettagliato
- ✅ UI refresh via evento custom

### ✅ 2. LIKE / UNLIKE
**Route**: `POST /api/posts/[postId]/like` e `DELETE /api/posts/[postId]/like`
**Status**: ✅ SISTEMATO (aggiunto logging)
- ✅ `POST`: `LIKE_RECEIVED`, `eventId: like:${postId}:${likerUid}`
- ✅ `DELETE`: `UNLIKE_RECEIVED`, `eventId: unlike:${postId}:${likerUid}`
- ✅ `targetUid = authorId` (letto dal DB, non dal client)
- ✅ `deltaNeuroCredits = +1` / `-1`
- ✅ Self-like bloccato (già presente)
- ✅ Chiama `touchDailyActive(likerUid)`
- ✅ Logging dettagliato aggiunto
- ✅ UI refresh via evento custom

### ✅ 3. CREATE COMMENT
**Route**: `POST /api/posts/[postId]/comments`
**Status**: ✅ SISTEMATO (era mancante!)
- ✅ Aggiunto `applyEvent` con `COMMENT_CREATED`
- ✅ `eventId: comment:${postId}:${commentId}:${uid}` (idempotente)
- ✅ `targetUid = commenterUid`
- ✅ `deltaNeuroCredits = +1` (cap giornaliero: 10)
- ✅ Chiama `touchDailyActive(commenterUid)`
- ✅ Logging dettagliato
- ✅ UI refresh via evento custom

### ✅ 4. DELETE COMMENT
**Route**: `DELETE /api/posts/[postId]/comments/[commentId]`
**Status**: ✅ SISTEMATO (era mancante!)
- ✅ Aggiunto `applyEvent` con `COMMENT_DELETED`
- ✅ `eventId: comment_deleted:${postId}:${commentId}:${uid}` (idempotente)
- ✅ `targetUid = commenterUid`
- ✅ `deltaNeuroCredits = -1` (sottrae punti se commento aveva dato crediti)
- ✅ Logging dettagliato

### ✅ 5. VIDEO COMPLETE
**Route**: `POST /api/videos/[videoId]/complete`
**Status**: ✅ GIÀ SISTEMATO (aggiunto logging)
- ✅ Idempotente: `eventId: video_completed:${videoId}:${uid}`
- ✅ `type: VIDEO_COMPLETED`
- ✅ `deltaVideosCompleted = +1` sempre
- ✅ `deltaNeuroCredits = +1` SOLO se entro cap giornaliero (3)
- ✅ Chiama `touchDailyActive(uid)`
- ✅ Logging dettagliato aggiunto

### ✅ 6. DAILY ACTIVE
**Function**: `touchDailyActive(uid)`
**Status**: ✅ GIÀ SISTEMATO
- ✅ `eventId: daily_active:${uid}:${YYYY-MM-DD}` (idempotente)
- ✅ `type: DAILY_ACTIVE`
- ✅ `deltaActiveDays = +1`
- ✅ `deltaNeuroCredits = +1` (max 1/giorno)
- ✅ Aggiorna streak (`lastActiveDate`, `streak_current`, `streak_best`)

## Regole e Caps Aggiornate

### ✅ `lib/neurocredits-rules.ts`
- ✅ `POST_CREATED`: +2 punti, cap 5/giorno
- ✅ `COMMENT_CREATED`: +1 punto, cap 10/giorno (NUOVO)
- ✅ `COMMENT_DELETED`: -1 punto, no cap (NUOVO)
- ✅ `LIKE_RECEIVED`: +1 punto, no cap
- ✅ `UNLIKE_RECEIVED`: -1 punto, no cap
- ✅ `VIDEO_COMPLETED`: +1 punto, cap 3/giorno
- ✅ `DAILY_ACTIVE`: +1 punto, cap 1/giorno

### ✅ Daily Caps in `users/{uid}/dailyCaps/{YYYY-MM-DD}`
- ✅ `postCreditsUsed`: contatore post con crediti
- ✅ `commentCreditsUsed`: contatore commenti con crediti (NUOVO)
- ✅ `videoCreditsUsed`: contatore video con crediti
- ✅ `dailyActiveUsed`: boolean (max 1/giorno)

## Debug e Logging

### ✅ Logging Server-Side
Ogni route che assegna punti ora logga:
- `🎯 Applying event`: eventId, type, targetUid, delta, capReached
- `✅ Event created` oppure `⚠️ Event already existed` (idempotente)
- `📊 Updated totals`: neuroCredits_total, monthly

### ✅ Endpoint Debug
**Route**: `GET /api/neurocredits/events?limit=20`
- ✅ Ritorna ultimi 20 eventi NeuroCredits dell'utente loggato
- ✅ Include: type, targetUid, actorUid, deltaNeuroCredits, ref, createdAt
- ✅ Utile per verificare subito se l'evento viene creato

## UI Refresh

### ✅ Aggiornamento Automatico
- ✅ `PostComposer`: emette evento `refreshNeuroCredits` dopo creazione
- ✅ `CommentComposer`: emette evento `refreshNeuroCredits` dopo creazione
- ✅ `LikeButton`: emette evento `refreshNeuroCredits` dopo like/unlike
- ✅ `/neurocredits`: ascolta evento e aggiorna stats + leaderboard

### ✅ Cache
- ✅ `/api/neurocredits/me` non usa cache (fetch senza cache headers)
- ✅ UI refresh immediato dopo ogni azione

## File Modificati

1. **`lib/neurocredits-rules.ts`** (MODIFICATO)
   - Aggiunto `COMMENT_CREATED` (+1, cap 10)
   - Aggiunto `COMMENT_DELETED` (-1, no cap)

2. **`lib/neurocredits.ts`** (MODIFICATO)
   - Aggiunto case `COMMENT_CREATED` e `COMMENT_DELETED` in `generateEventId()`
   - Aggiunto controllo cap per `COMMENT_CREATED`
   - Aggiunto aggiornamento `commentCreditsUsed` in `updateDailyCap()`
   - Aggiunto logging dettagliato in `applyEvent()`
   - Aggiunto logging per eventi già esistenti (idempotenza)

3. **`app/api/posts/route.ts`** (MODIFICATO)
   - Aggiunto logging dettagliato per `POST_CREATED`

4. **`app/api/posts/[postId]/like/route.ts`** (MODIFICATO)
   - Convertito `applyEvent` da `.catch()` a `await` per logging
   - Aggiunto logging dettagliato per `LIKE_RECEIVED` e `UNLIKE_RECEIVED`

5. **`app/api/posts/[postId]/comments/route.ts`** (MODIFICATO)
   - Aggiunto `applyEvent` per `COMMENT_CREATED` (era mancante!)
   - Aggiunto logging dettagliato

6. **`app/api/posts/[postId]/comments/[commentId]/route.ts`** (MODIFICATO)
   - Aggiunto `applyEvent` per `COMMENT_DELETED` (era mancante!)
   - Aggiunto logging dettagliato

7. **`app/api/videos/[videoId]/complete/route.ts`** (MODIFICATO)
   - Aggiunto logging dettagliato per `VIDEO_COMPLETED`

8. **`app/api/neurocredits/events/route.ts`** (NUOVO)
   - Endpoint debug per vedere ultimi eventi utente

9. **`components/posts/CommentComposer.tsx`** (MODIFICATO)
   - Aggiunto evento `refreshNeuroCredits` dopo creazione commento

10. **`components/posts/LikeButton.tsx`** (MODIFICATO)
    - Aggiunto evento `refreshNeuroCredits` dopo like/unlike

## Checklist Test Manuale

### Test 1: CREATE POST
1. ✅ Creare un post
2. ✅ Verificare log server: `[API Posts] ✅ Post created`
3. ✅ Verificare log: `[NeuroCredits] 🎯 Applying event: POST_CREATED`
4. ✅ Verificare log: `[NeuroCredits] ✅ Event created`
5. ✅ Verificare log: `[NeuroCredits] 📊 Updated totals`
6. ✅ Verificare `/api/neurocredits/events`: evento `POST_CREATED` presente
7. ✅ Verificare `/neurocredits`: NeuroCredits +2
8. ✅ Verificare leaderboard: rank aggiornato

**Output Atteso**:
- Evento creato: `post:${postId}:${uid}`
- NeuroCredits total: +2
- NeuroCredits monthly: +2
- Leaderboard entry aggiornata

### Test 2: LIKE / UNLIKE
1. ✅ User A crea post
2. ✅ User B mette like al post di User A
3. ✅ Verificare log: `[API Posts Like] 🎯 Applying LIKE_RECEIVED`
4. ✅ Verificare `/api/neurocredits/events` (User A): evento `LIKE_RECEIVED` presente
5. ✅ Verificare `/neurocredits` (User A): NeuroCredits +1
6. ✅ User B rimuove like
7. ✅ Verificare log: `[API Posts Unlike] 🎯 Applying UNLIKE_RECEIVED`
8. ✅ Verificare `/neurocredits` (User A): NeuroCredits -1
9. ✅ Verificare self-like bloccato (User A non può likeare il proprio post)

**Output Atteso**:
- Evento like: `like:${postId}:${likerUid}`
- User A (autore): NeuroCredits +1 (like) / -1 (unlike)
- User B (liker): nessun cambio NeuroCredits (solo daily active)

### Test 3: CREATE COMMENT
1. ✅ Creare un commento
2. ✅ Verificare log: `[API Comments] ✅ Comment created`
3. ✅ Verificare log: `[NeuroCredits] 🎯 Applying event: COMMENT_CREATED`
4. ✅ Verificare `/api/neurocredits/events`: evento `COMMENT_CREATED` presente
5. ✅ Verificare `/neurocredits`: NeuroCredits +1
6. ✅ Creare 11 commenti nello stesso giorno: primi 10 danno crediti, l'11° no (cap)

**Output Atteso**:
- Evento creato: `comment:${postId}:${commentId}:${uid}`
- NeuroCredits total: +1 (entro cap)
- NeuroCredits monthly: +1
- Cap giornaliero: max 10 commenti con crediti

### Test 4: DELETE COMMENT
1. ✅ Creare un commento (ottiene +1 NeuroCredit)
2. ✅ Eliminare il commento
3. ✅ Verificare log: `[API Comments] 🎯 Applying COMMENT_DELETED`
4. ✅ Verificare `/neurocredits`: NeuroCredits -1

**Output Atteso**:
- Evento creato: `comment_deleted:${postId}:${commentId}:${uid}`
- NeuroCredits total: -1
- NeuroCredits monthly: -1

### Test 5: VIDEO COMPLETE
1. ✅ Completare un video
2. ✅ Verificare log: `[API Video Complete] 🎯 Applying VIDEO_COMPLETED`
3. ✅ Verificare `/api/neurocredits/events`: evento `VIDEO_COMPLETED` presente
4. ✅ Verificare `/neurocredits`: NeuroCredits +1, VideosCompleted +1
5. ✅ Completare 4 video nello stesso giorno: primi 3 danno crediti, il 4° no (cap)

**Output Atteso**:
- Evento creato: `video_completed:${videoId}:${uid}`
- NeuroCredits total: +1 (entro cap)
- VideosCompleted total: +1 (sempre)
- Cap giornaliero: max 3 video con crediti

### Test 6: DAILY ACTIVE
1. ✅ Eseguire prima azione del giorno (post/comment/like/video)
2. ✅ Verificare log: `[NeuroCredits] 🎯 Applying event: DAILY_ACTIVE`
3. ✅ Verificare `/api/neurocredits/events`: evento `DAILY_ACTIVE` presente
4. ✅ Verificare `/neurocredits`: ActiveDays +1, NeuroCredits +1, Streak aggiornato
5. ✅ Eseguire seconda azione: no nuovo DAILY_ACTIVE (cap 1/giorno)

**Output Atteso**:
- Evento creato: `daily_active:${uid}:${YYYY-MM-DD}`
- ActiveDays total: +1
- NeuroCredits total: +1
- Streak aggiornato (se consecutivo)

## Azioni che NON Chiamavano applyEvent (ora sistemate)

1. ❌ **CREATE COMMENT** → ✅ Ora chiama `applyEvent(COMMENT_CREATED)`
2. ❌ **DELETE COMMENT** → ✅ Ora chiama `applyEvent(COMMENT_DELETED)`

## Note Importanti

- ✅ Tutti gli eventi sono idempotenti (stesso evento non può essere applicato due volte)
- ✅ Daily caps rispettati: se cap raggiunto, `deltaNeuroCredits = 0` ma metriche (videosCompleted/activeDays) si aggiornano comunque
- ✅ Self-like bloccato: non è possibile likeare il proprio post
- ✅ Logging completo: ogni azione logga eventId, type, targetUid, delta, capReached
- ✅ UI refresh automatico: dopo ogni azione, `/neurocredits` si aggiorna immediatamente
- ✅ Endpoint debug: `/api/neurocredits/events` per verificare eventi creati

## Verifica Finale

Per verificare che tutto funzioni:
1. Aprire console server
2. Eseguire ogni azione (post, like, comment, video)
3. Verificare log: `🎯 Applying event`, `✅ Event created`, `📊 Updated totals`
4. Chiamare `/api/neurocredits/events`: verificare eventi creati
5. Verificare `/neurocredits`: NeuroCredits aggiornati
6. Verificare leaderboard: rank aggiornato



