# 📹 Integrazione Registrazioni IVS da AWS S3 - Documentazione Completa

**Data:** 2025-01-XX  
**Versione:** 1.0  
**Status:** ✅ Implementato e Testato

---

## 📋 Indice

1. [Problema e Obiettivo](#problema-e-obiettivo)
2. [Architettura e Contesto](#architettura-e-contesto)
3. [Verifica Iniziale](#verifica-iniziale)
4. [Implementazione](#implementazione)
5. [File Modificati/Creati](#file-modificaticreati)
6. [Struttura Dati](#struttura-dati)
7. [Configurazione](#configurazione)
8. [Test e Verifica](#test-e-verifica)
9. [Flusso Completo](#flusso-completo)
10. [Note e Limitazioni](#note-e-limitazioni)

---

## 🎯 Problema e Obiettivo

### Problema
- Le dirette IVS vengono trasmesse in streaming ma **non venivano registrate**
- Non esisteva un sistema per recuperare e importare le registrazioni salvate automaticamente da AWS IVS su S3
- I metadati delle dirette non venivano salvati in modo strutturato

### Obiettivo
- ✅ Integrare le registrazioni IVS (Auto-record to S3) nel progetto
- ✅ **NON** spostare file video su Firebase Storage (rimangono su S3)
- ✅ Permettere all'admin di visualizzare e importare registrazioni da S3
- ✅ Salvare metadati in Firestore per tracciamento

---

## 🏗️ Architettura e Contesto

### Stack Tecnologico
- **Next.js 16** (App Router, Turbopack)
- **AWS IVS** (Interactive Video Service) per live streaming
- **AWS S3** per storage registrazioni
- **Firebase Firestore** per metadati
- **AWS SDK v3** per accesso S3 (server-side)

### Configurazione AWS Esistente
- **Region:** `eu-central-1`
- **IVS Channel:** `canale-diretta-v0`
- **Recording Configuration:** `config-v0-rec`
- **S3 Bucket:** `v0-membership-recordings-tuonome2` (privato, block public access)
- **S3 Prefix:** `ivs/v1/` (struttura standard IVS)

### Struttura S3 IVS

**Nota Importante:** Il path reale in S3 include account/channel e cartelle temporali (data/ora) prima dell'ID finale. Per questo motivo filtriamo per suffisso `recording-ended.json` invece di assumere una struttura fissa.

```
v0-membership-recordings-tuonome2/
└── ivs/v1/
    └── {account-id}/
        └── {channel-id}/
            └── {date-time}/
                └── {stream-id}/
                    ├── events/
                    │   ├── recording-started.json
                    │   ├── recording-ended.json    ← Filtriamo per questo
                    │   └── recording-failed.json
                    └── media/
                        ├── hls/
                        │   ├── *.m3u8              ← Qualsiasi manifest (non solo index.m3u8)
                        │   └── chunk_*.ts
                        └── thumbnails/
                            └── *.jpg
```

**Approccio Implementato:**
- Usa prefix `ivs/v1/` per limitare la ricerca
- Filtra chiavi che terminano con `/events/recording-ended.json`
- Non assume struttura fissa del path (più robusto)

---

## 🔍 Verifica Iniziale

### 1. Verifica Upload Firebase Storage
**Risultato:** ❌ Nessun upload verso Firebase Storage

**Prove:**
- Ricerca `uploadBytesResumable`, `uploadBytes`, `getDownloadURL` in `app/admin/live/page.tsx` → **Nessun risultato**
- Ricerca `MediaRecorder` → **Nessun risultato**
- IVS Web Broadcast trasmette solo, non registra localmente

**Conclusione:** La diretta **NON** salva su Firebase Storage. IVS Web Broadcast trasmette solo in streaming verso AWS IVS. La registrazione deve essere abilitata separatamente su AWS IVS (IVS Recording → S3).

### 2. Verifica Route Esistente
**Risultato:** ✅ Esiste `/api/admin/ivs/recordings` (POST)

**Stato:**
- Route funzionante, non va in 500
- Salva metadati start/stop in collection `ivs_recordings`
- Non gestisce importazione da S3

---

## 🛠️ Implementazione

### FASE 1: Nuova Route - Lista Registrazioni da S3

**File Creato:** `app/api/admin/ivs/recordings/list/route.ts`

#### Funzionalità
1. **Autenticazione:** Richiede admin (`requireAdmin`)
2. **Runtime:** `nodejs` (server-side, necessario per AWS SDK)
3. **AWS S3 Access:**
   - Usa AWS SDK v3 (`@aws-sdk/client-s3`)
   - Lista oggetti con prefix `ivs/v1/`
   - Filtra chiavi che terminano con `/events/recording-ended.json`
4. **Parse JSON:**
   - Per ogni file JSON trovato, fa `GetObject` e parse
   - Estrae metadati: `endedAt`, `channelId`, `duration`, `streamId`
5. **Verifica HLS:**
   - Controlla se esiste **qualsiasi file `.m3u8`** in `media/hls/` (non solo `index.m3u8`)
   - IVS può usare nomi manifest diversi
   - Restituisce `hasMediaHls: boolean`
6. **Paginazione:**
   - Supporta query params: `?limit=30&cursor=...`
   - Limite default: 30, max: 100
   - Restituisce `hasMore` e `nextCursor` per paginazione
7. **Ordinamento:**
   - Ordina per `endedAt` (più recenti prima)
   - Applica limite dopo ordinamento

#### Response JSON
```json
{
  "recordings": [
    {
      "endedKey": "ivs/v1/abc123/events/recording-ended.json",
      "prefix": "ivs/v1/abc123",
      "endedAt": "2025-01-15T10:30:00Z",
      "channelId": "canale-diretta-v0",
      "region": "eu-central-1",
      "hasMediaHls": true,
      "duration": 3600,
      "streamId": "stream-123"
    }
  ],
  "count": 1,
  "total": 5,
  "hasMore": false,
  "nextCursor": null
}
```

#### Query Parameters
- `limit` (opzionale, default: 30, max: 100): Numero massimo di registrazioni da restituire
- `cursor` (opzionale): Token di continuazione per paginazione

#### Gestione Errori
- Se AWS credentials mancanti → `{ recordings: [], error: "AWS credentials not configured" }`
- Se bucket vuoto → `{ recordings: [], message: "No recordings found in S3" }`
- Se errore S3 → `{ recordings: [], error: "..." }` con status 500
- Sempre risponde con JSON (mai HTML/empty body)

---

### FASE 2: Aggiornamento Route POST - Importazione

**File Modificato:** `app/api/admin/ivs/recordings/route.ts`

#### Nuova Funzionalità: Importazione da S3

**Body Request:**
```json
{
  "title": "Registrazione 15/01/2025 10:30",
  "endedKey": "ivs/v1/abc123/events/recording-ended.json",
  "prefix": "ivs/v1/abc123"
}
```

**Logica:**
1. Verifica presenza di `title`, `endedKey`, `prefix` nel body
2. Se presenti → modalità importazione
3. Crea documento in Firestore collection `ivsRecordings`
4. Salva metadati senza caricare video (rimane su S3)

**Retrocompatibilità:**
- Mantiene supporto per `action: "start"` e `action: "stop"`
- Se body contiene `action`, usa logica legacy

#### Collection Firestore: `ivsRecordings`

**Documento Creato:**
```typescript
{
  title: string,                    // Titolo fornito dall'admin
  s3Prefix: string,                 // Prefix S3 (es: "ivs/v1/abc123")
  endedKey: string,                 // Chiave file JSON (es: "ivs/v1/abc123/events/recording-ended.json")
  status: "READY",                  // Status della registrazione
  createdAt: Timestamp,             // Data creazione documento
  createdBy: string,                // UID admin che ha importato
  updatedAt: Timestamp,             // Data ultimo aggiornamento
  playbackUrl: null,                 // TODO: CloudFront URL (da popolare in futuro)
  cloudFrontDistributionId: null    // TODO: CloudFront distribution ID (da popolare in futuro)
}
```

---

### FASE 3: UI Admin - Visualizzazione e Importazione

**File Modificato:** `app/admin/live/page.tsx`

#### Nuove Funzionalità UI

1. **State Aggiunti:**
   ```typescript
   const [recordings, setRecordings] = useState<any[]>([])
   const [recordingsLoading, setRecordingsLoading] = useState(false)
   const [importingId, setImportingId] = useState<string | null>(null)
   ```

2. **Funzione `loadRecordings()`:**
   - Chiama `GET /api/admin/ivs/recordings/list`
   - Aggiorna state `recordings` con lista da S3
   - Gestisce errori silenziosamente (log in console)

3. **Funzione `importRecording()`:**
   - Mostra prompt per inserire titolo
   - Chiama `POST /api/admin/ivs/recordings` con `title`, `endedKey`, `prefix`
   - Mostra alert di successo/errore
   - Ricarica lista dopo importazione

4. **Sezione UI "Registrazioni da S3":**
   - Bottone "🔄 Aggiorna elenco" per caricare registrazioni
   - Lista registrazioni con:
     - **Data/Ora:** Formattata in italiano
     - **Channel ID:** ID canale IVS
     - **Durata:** In minuti (se disponibile)
     - **Status HLS:** ✅ disponibile / ⚠️ non trovato
     - **Prefix S3:** Mostrato in font monospace
     - **Bottone "📥 Importa"** per ogni registrazione
   - Messaggio se lista vuota
   - Loading state durante caricamento

#### Posizionamento UI
- Sezione aggiunta dopo i controlli broadcast (dopo bottoni VAI LIVE/STOP)
- Separata con bordo superiore (`border-t`)
- Spaziatura con `mt-8 pt-8`

---

## 📁 File Modificati/Creati

### File Creati

1. **`app/api/admin/ivs/recordings/list/route.ts`** (NUOVO)
   - Route GET per listare registrazioni da S3
   - 169 righe
   - Runtime: `nodejs`
   - Dipendenze: `@aws-sdk/client-s3`

### File Modificati

2. **`app/api/admin/ivs/recordings/route.ts`** (MODIFICATO)
   - Aggiunto supporto importazione (righe 12-54)
   - Mantiene retrocompatibilità con start/stop
   - 159 righe totali

3. **`app/admin/live/page.tsx`** (MODIFICATO)
   - Aggiunti state per recordings (righe 37-39)
   - Aggiunte funzioni `loadRecordings()` e `importRecording()` (righe 467-544)
   - Aggiunta sezione UI "Registrazioni da S3" (righe 647-719)
   - 719 righe totali

4. **`package.json`** (MODIFICATO)
   - Aggiunta dipendenza: `"@aws-sdk/client-s3"`

---

## 📊 Struttura Dati

### Firestore Collections

#### Collection: `ivsRecordings` (Nuova)
**Scopo:** Metadati registrazioni importate da S3

```typescript
{
  title: string,                    // Titolo fornito dall'admin
  s3Prefix: string,                 // Prefix S3 (es: "ivs/v1/abc123")
  endedKey: string,                 // Chiave file JSON completo (unique key per deduplicazione)
  endedAt: Date,                    // Data fine registrazione (salvata per ordinamento senza ricalcolare)
  status: "READY",                  // Status: "READY" | "PROCESSING" | "ERROR"
  createdAt: Timestamp,             // Data creazione documento
  createdBy: string,                // UID admin
  updatedAt: Timestamp,             // Data ultimo aggiornamento
  playbackUrl: string | null,       // CloudFront URL (futuro)
  cloudFrontDistributionId: string | null  // CloudFront ID (futuro)
}
```

**Deduplicazione:**
- Controlla se esiste già un documento con stesso `endedKey`
- Se esiste, restituisce errore 409 (Conflict) con ID esistente
- Evita importazioni duplicate

#### Collection: `ivs_recordings` (Esistente, Legacy)
**Scopo:** Metadati start/stop dirette (non importate)

```typescript
{
  streamKey: string,
  startedBy: string,
  startedAt: Timestamp,
  stoppedBy?: string,
  stoppedAt?: Timestamp,
  status: "live" | "completed",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### S3 Structure

```
v0-membership-recordings-tuonome2/
└── ivs/v1/
    └── {stream-id}/
        ├── events/
        │   └── recording-ended.json
        │       {
        │         "endedAt": "2025-01-15T10:30:00Z",
        │         "channelId": "canale-diretta-v0",
        │         "channelArn": "arn:aws:ivs:eu-central-1:...",
        │         "duration": 3600,
        │         "streamId": "stream-123"
        │       }
        └── media/
            └── hls/
                ├── index.m3u8
                └── chunk_*.ts
```

---

## ⚙️ Configurazione

### Variabili Ambiente Richieste

Aggiungi al file `.env.local`:

```bash
# AWS Credentials (obbligatorie per accesso S3)
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# AWS Region (default: eu-central-1)
AWS_REGION=eu-central-1

# S3 Bucket (default: v0-membership-recordings-tuonome2)
AWS_S3_RECORDINGS_BUCKET=v0-membership-recordings-tuonome2

# S3 Prefix (default: ivs/v1/)
AWS_S3_RECORDINGS_PREFIX=ivs/v1/
```

### Permessi AWS IAM Richiesti

L'utente AWS deve avere questi permessi:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::v0-membership-recordings-tuonome2",
        "arn:aws:s3:::v0-membership-recordings-tuonome2/*"
      ]
    }
  ]
}
```

### Installazione Dipendenze

```bash
npm install @aws-sdk/client-s3
```

**Verifica installazione:**
```bash
npm list @aws-sdk/client-s3
```

---

## 🧪 Test e Verifica

### Test 1: Build
```bash
npm run build
```
**Risultato Atteso:** ✅ Build completato senza errori

### Test 2: Route List Recordings

**Endpoint:** `GET /api/admin/ivs/recordings/list`

**Prerequisiti:**
- Admin autenticato
- AWS credentials configurate
- Almeno una registrazione in S3

**Test Manuale:**
1. Apri `/admin/live` come admin
2. Clicca "🔄 Aggiorna elenco"
3. Verifica che:
   - La lista si carichi (loading state)
   - Le registrazioni vengano mostrate
   - Ogni registrazione mostri: data, channel ID, durata, status HLS

**Response Attesa:**
```json
{
  "recordings": [
    {
      "endedKey": "ivs/v1/.../events/recording-ended.json",
      "prefix": "ivs/v1/...",
      "endedAt": "2025-01-15T10:30:00Z",
      "channelId": "canale-diretta-v0",
      "region": "eu-central-1",
      "hasMediaHls": true,
      "duration": 3600,
      "streamId": "stream-123"
    }
  ],
  "count": 1
}
```

### Test 3: Importazione Registrazione

**Endpoint:** `POST /api/admin/ivs/recordings`

**Body:**
```json
{
  "title": "Test Registrazione",
  "endedKey": "ivs/v1/abc123/events/recording-ended.json",
  "prefix": "ivs/v1/abc123"
}
```

**Test Manuale:**
1. Nella lista registrazioni, clicca "📥 Importa"
2. Inserisci un titolo nel prompt
3. Verifica che:
   - Venga mostrato alert di successo
   - La lista venga ricaricata
   - In Firestore Console, collection `ivsRecordings` contenga il nuovo documento

**Response Attesa:**
```json
{
  "success": true,
  "id": "firestore-doc-id",
  "message": "Recording imported successfully"
}
```

### Test 4: Verifica Firestore

**Firebase Console:**
1. Vai a Firestore → Collection `ivsRecordings`
2. Verifica che i documenti importati contengano:
   - `title`, `s3Prefix`, `endedKey`
   - `status: "READY"`
   - `createdBy` (UID admin)
   - `createdAt`, `updatedAt` (Timestamp)

### Test 5: Gestione Errori

**Test Credenziali Mancanti:**
- Rimuovi temporaneamente `AWS_ACCESS_KEY_ID` da `.env.local`
- Clicca "🔄 Aggiorna elenco"
- **Risultato Atteso:** `{ recordings: [], error: "AWS credentials not configured" }`

**Test Bucket Vuoto:**
- Se non ci sono registrazioni in S3
- **Risultato Atteso:** `{ recordings: [], message: "No recordings found in S3" }`

---

## 🔄 Flusso Completo

### Scenario: Admin Importa Registrazione

1. **Admin apre `/admin/live`**
   - Vede sezione "Registrazioni da S3" vuota

2. **Admin clicca "🔄 Aggiorna elenco"**
   - Frontend chiama `GET /api/admin/ivs/recordings/list`
   - Backend:
     - Verifica autenticazione admin
     - Connette a S3 con AWS SDK
     - Lista oggetti con prefix `ivs/v1/`
     - Filtra file `recording-ended.json`
     - Per ogni file, fa `GetObject` e parse JSON
     - Verifica presenza `media/hls/`
     - Restituisce array ordinato
   - Frontend mostra lista registrazioni

3. **Admin clicca "📥 Importa" su una registrazione**
   - Frontend mostra prompt per titolo
   - Admin inserisce titolo (es: "Diretta 15 Gennaio")
   - Frontend chiama `POST /api/admin/ivs/recordings` con:
     ```json
     {
       "title": "Diretta 15 Gennaio",
       "endedKey": "ivs/v1/abc123/events/recording-ended.json",
       "prefix": "ivs/v1/abc123"
     }
     ```
   - Backend:
     - Verifica autenticazione admin
     - Crea documento in Firestore `ivsRecordings`
     - Salva metadati (NON carica video)
     - Restituisce `{ success: true, id: "..." }`
   - Frontend mostra alert di successo
   - Frontend ricarica lista (opzionale)

4. **Risultato:**
   - Video rimane su S3 (non spostato)
   - Metadati salvati in Firestore
   - Admin può tracciare registrazioni importate

---

## 📝 Note e Limitazioni

### ✅ Cosa Funziona

- ✅ Lista registrazioni da S3
- ✅ Importazione metadati in Firestore
- ✅ UI admin per visualizzare e importare
- ✅ Video rimangono su S3 (non spostati)
- ✅ Gestione errori robusta
- ✅ Retrocompatibilità con start/stop legacy

### ⚠️ Limitazioni Attuali

1. **Playback HLS:**
   - I file HLS su S3 non sono accessibili direttamente (bucket privato)
   - **Serve CloudFront davanti a S3 per servire HLS** (presigned URLs semplici sono scomodi per HLS perché devi autorizzare anche i segmenti)
   - Campi `playbackUrl` e `cloudFrontDistributionId` sono `null` (placeholder)

2. **Scalabilità:**
   - Con molte registrazioni, la route `GET /recordings/list` può diventare lenta/costosa (S3 request costs + tempo)
   - **Mitigazioni implementate:**
     - Paginazione con limite default 30 (max 100)
     - Supporto `cursor` per paginazione
   - **Ottimizzazioni future:**
     - Cache breve lato server (30-60s)
     - EventBridge/S3 event → auto-scrivi in Firestore quando arriva `recording-ended.json` (evita scan S3)

3. **CloudFront (Futuro):**
   - Da configurare: CloudFront distribution davanti a S3 bucket
   - Da implementare: Generazione signed URLs per playback HLS
   - Da aggiungere: Aggiornamento `playbackUrl` dopo configurazione CloudFront

4. **Demo Mode:**
   - In demo mode, le route restituiscono dati mock
   - S3 non è accessibile in demo mode

### 🔮 Prossimi Passi (Non Implementati)

1. **CloudFront Integration:**
   - Configurare CloudFront distribution
   - Generare signed URLs per playback HLS
   - Aggiornare `playbackUrl` nei documenti Firestore

2. **UI Playback:**
   - Aggiungere player HLS nella UI admin
   - Mostrare registrazioni importate con possibilità di riproduzione

3. **Webhook AWS:**
   - Configurare webhook AWS per notificare quando una registrazione è pronta
   - Auto-importare registrazioni senza intervento admin

4. **Conversione in Lezione:**
   - Permettere di convertire una registrazione importata in una lezione del corso
   - Collegare `ivsRecordings` → `lessons` in Firestore

---

## 🔒 Sicurezza

### Autenticazione
- Tutte le route richiedono `requireAdmin`
- Token Firebase ID richiesto in header `Authorization: Bearer <token>`
- Verifica admin lato server

### Credenziali AWS
- **NON** esposte nel client
- Solo server-side (runtime `nodejs`)
- Leggono da variabili ambiente

### Firestore Rules
- Collection `ivsRecordings` dovrebbe avere regole:
  ```javascript
  match /ivsRecordings/{recordingId} {
    allow read: if isAdmin();
    allow write: if isAdmin();
  }
  ```

---

## 📚 Riferimenti

### Documentazione AWS
- [AWS IVS Recording](https://docs.aws.amazon.com/ivs/latest/userguide/recording-to-s3.html)
- [AWS S3 SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [AWS CloudFront Signed URLs](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-signed-urls.html)

### File Correlati
- `app/api/admin/ivs/config/route.ts` - Config IVS (ingest endpoint, stream key)
- `app/admin/live/page.tsx` - Pagina admin diretta
- `lib/auth-helpers.ts` - Helper `requireAdmin`

---

## ✅ Checklist Implementazione

### Funzionalità Base
- [x] Verifica che non ci sia upload Firebase Storage
- [x] Installazione AWS SDK v3
- [x] Creazione route `GET /api/admin/ivs/recordings/list`
- [x] Aggiornamento route `POST /api/admin/ivs/recordings` per importazione
- [x] UI admin per visualizzare registrazioni
- [x] UI admin per importare registrazioni
- [x] Salvataggio metadati in Firestore
- [x] Gestione errori robusta
- [x] Build passa senza errori
- [x] Documentazione completa

### Miglioramenti Scalabilità e Robustezza
- [x] `GET /api/admin/ivs/recordings/list` supporta paginazione e limite (`?limit=30&cursor=...`)
- [x] `hasMediaHls` controlla **qualsiasi file `.m3u8`** (non solo `index.m3u8`)
- [x] "Importa" evita duplicati (unique key: `endedKey`)
- [x] Campo Firestore: `endedAt` salvato (utile per ordinare senza ricalcolare)
- [x] Note playback: "serve CloudFront per HLS privato" (documentato)

### Ottimizzazioni Future (Non Implementate)
- [ ] Cache breve lato server (30-60s) per non martellare S3
- [ ] EventBridge/S3 event → scrivi in Firestore quando arriva `recording-ended.json` (evita scan S3)
- [ ] CloudFront integration per playback HLS

---

## 🎉 Conclusione

L'integrazione delle registrazioni IVS da S3 è **completa e funzionante**. 

**Cosa è stato fatto:**
- ✅ Sistema per listare registrazioni da S3
- ✅ Sistema per importare metadati in Firestore
- ✅ UI admin completa per gestire registrazioni
- ✅ Video rimangono su S3 (non spostati su Firebase Storage)

**Cosa serve ancora:**
- ⏳ CloudFront per playback HLS (futuro)
- ⏳ UI playback per riprodurre registrazioni (futuro)
- ⏳ Webhook AWS per auto-import (futuro)

**Pronto per:**
- ✅ Test in produzione (con AWS credentials configurate)
- ✅ Importazione manuale registrazioni da parte degli admin
- ✅ Tracciamento registrazioni in Firestore

---

**Documento creato il:** 2025-01-XX  
**Ultima modifica:** 2025-01-XX  
**Versione:** 1.0

