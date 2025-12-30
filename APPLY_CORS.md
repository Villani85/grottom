# Configurazione CORS per Firebase Storage Bucket

## Bucket Target
**Bucket**: `v0-membership-prod.firebasestorage.app`

## File di Configurazione
Il file `cors.json` contiene la configurazione CORS completa per:
- ✅ Localhost (sviluppo)
- ✅ Produzione (da aggiungere il dominio)
- ✅ Metodi: GET, PUT, HEAD, OPTIONS, POST
- ✅ Headers necessari per upload resumable

## Comandi per Applicare CORS

### Opzione 1: Usando gsutil (Raccomandato)

```bash
# Verifica che gsutil sia installato
gsutil --version

# Autenticati (se necessario)
gcloud auth login

# Imposta il progetto
gcloud config set project v0-membership-prod

# Applica la configurazione CORS
gsutil cors set cors.json gs://v0-membership-prod.firebasestorage.app

# Verifica la configurazione applicata
gsutil cors get gs://v0-membership-prod.firebasestorage.app
```

### Opzione 2: Usando gcloud storage (Alternativa)

```bash
# Autenticati
gcloud auth login

# Imposta il progetto
gcloud config set project v0-membership-prod

# Applica la configurazione CORS
gcloud storage buckets update gs://v0-membership-prod.firebasestorage.app --cors-file=cors.json

# Verifica la configurazione
gcloud storage buckets describe gs://v0-membership-prod.firebasestorage.app --format="value(cors)"
```

## Domini di Produzione Configurati

Il file `cors.json` include già i seguenti domini di produzione:
- ✅ `https://brainhackingacademy.com`
- ✅ `https://www.brainhackingacademy.com`
- ✅ `https://brain-hacking-academy.vercel.app`
- ✅ `https://brainhackingacademy.vercel.app`

### Aggiungere Altri Domini di Produzione

Se hai altri domini di produzione, modifica `cors.json` aggiungendoli nella prima regola `origin`:
   ```json
   "origin": [
     "http://localhost:3000",
     "https://localhost:3000",
     "https://brainhackingacademy.com",
     "https://www.brainhackingacademy.com",
     "https://your-other-domain.com"
   ],
   ```

Poi riapplica la configurazione:
   ```bash
   gsutil cors set cors.json gs://v0-membership-prod.firebasestorage.app
   ```

## Checklist di Verifica

### ✅ 1. Verifica Configurazione CORS
```bash
gsutil cors get gs://v0-membership-prod.firebasestorage.app
```
**Atteso**: Deve mostrare la configurazione con:
- Origin: `http://localhost:3000` (e altri domini configurati)
- Method: `PUT`, `GET`, `HEAD`, `OPTIONS`
- ResponseHeader: `Content-Type` presente

### ✅ 2. Test Preflight OPTIONS
Apri la console del browser (F12) e esegui:
```javascript
fetch('https://storage.googleapis.com/v0-membership-prod.firebasestorage.app/test', {
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:3000',
    'Access-Control-Request-Method': 'PUT',
    'Access-Control-Request-Headers': 'content-type'
  }
}).then(r => {
  console.log('OPTIONS Status:', r.status);
  console.log('CORS Headers:', {
    'Access-Control-Allow-Origin': r.headers.get('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': r.headers.get('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': r.headers.get('Access-Control-Allow-Headers')
  });
});
```
**Atteso**: 
- Status: `200` o `204`
- `Access-Control-Allow-Origin`: `http://localhost:3000` o `*`
- `Access-Control-Allow-Methods`: include `PUT`
- `Access-Control-Allow-Headers`: include `content-type`

### ✅ 3. Test Upload PUT
1. Vai su `http://localhost:3000/admin/courses/[courseId]/edit`
2. Clicca "Save lesson" con un video selezionato
3. Apri Network tab (F12 → Network)
4. Cerca la richiesta PUT verso `storage.googleapis.com`
5. **Atteso**:
   - Status: `200` o `204` (non `CORS error` o `ERR_FAILED`)
   - Response headers includono `Access-Control-Allow-Origin`
   - Nessun errore CORS nella console

### ✅ 4. Verifica File in Storage
1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Seleziona progetto `v0-membership-prod`
3. Vai su **Storage**
4. Naviga a `courses/[courseId]/lessons/[lessonId]/video.mp4`
5. **Atteso**: Il file deve essere presente e scaricabile

### ✅ 5. Verifica Path Corretto
Il file deve essere salvato nel path:
```
/courses/{courseId}/lessons/{lessonId}/video.mp4
```
**Atteso**: Path corretto in Firebase Storage

## Troubleshooting

### Errore: "Access Denied"
```bash
# Verifica i permessi
gcloud projects get-iam-policy v0-membership-prod

# Assicurati di avere il ruolo Storage Admin
gcloud projects add-iam-policy-binding v0-membership-prod \
  --member="user:your-email@example.com" \
  --role="roles/storage.admin"
```

### Errore: "Bucket not found"
```bash
# Verifica che il bucket esista
gsutil ls gs://v0-membership-prod.firebasestorage.app

# Se non esiste, crealo (ma normalmente Firebase lo crea automaticamente)
```

### CORS ancora non funziona dopo l'applicazione
1. **Attendi 1-2 minuti**: Le modifiche CORS possono richiedere tempo per propagarsi
2. **Pulisci cache browser**: Ctrl+Shift+Delete → Clear cache
3. **Riavvia server Next.js**: `npm run dev`
4. **Verifica di nuovo**: `gsutil cors get gs://v0-membership-prod.firebasestorage.app`

### Preflight OPTIONS fallisce
- Verifica che `OPTIONS` sia nella lista `method` in `cors.json`
- Verifica che `Content-Type` sia in `responseHeader`
- Controlla che l'origin corrisponda esattamente (case-sensitive)

### PUT ritorna 403/404 invece di 200/204
- Verifica che la signed URL sia valida (non scaduta)
- Verifica che il Content-Type nella PUT corrisponda a quello nella signed URL
- Controlla le Storage Rules in Firebase Console

## Note Importanti

1. **Content-Type Matching**: 
   - Il `Content-Type` nella richiesta PUT deve corrispondere esattamente a quello usato per generare la signed URL
   - La signed URL include `X-Goog-SignedHeaders=content-type;host`

2. **Scadenza Signed URL**:
   - Le signed URL hanno scadenza di 10 minuti (configurato in `upload-url/route.ts`)
   - Se l'upload richiede più tempo, considera di aumentare la scadenza

3. **Upload Resumable**:
   - Per file grandi, GCS supporta upload resumable
   - La configurazione CORS include gli header necessari (`x-goog-resumable`, etc.)

4. **Produzione**:
   - Ricorda di aggiungere il dominio di produzione a `cors.json` prima del deploy
   - Testa l'upload anche in produzione dopo il deploy

