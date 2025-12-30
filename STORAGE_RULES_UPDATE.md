# Aggiornamento Storage Rules per Upload Diretto

## Modifiche Applicate

Le Storage Rules sono state aggiornate per permettere agli admin di fare upload diretto dei video dei corsi tramite Firebase Storage Web SDK.

### Regola Aggiornata

**Prima** (bloccato):
```javascript
match /courses/{allPaths=**} {
  allow read, write: if false;
}
```

**Dopo** (permesso per admin):
```javascript
match /courses/{allPaths=**} {
  allow read, write: if isAdmin();
}
```

## Come Applicare le Regole

### 1. Vai su Firebase Console
1. Apri [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il progetto **`v0-membership-prod`**
3. Vai su **Storage** → **Rules**

### 2. Copia le Regole Aggiornate
Copia il contenuto completo del file `storage.rules` e incollalo nell'editor delle regole.

### 3. Pubblica le Regole
1. Clicca su **Publish**
2. Attendi la conferma (10-30 secondi)
3. Le nuove regole sono attive

## Verifica

Dopo aver applicato le regole, verifica che:

1. ✅ Gli admin possono fare upload in `/courses/**`
2. ✅ I non-admin non possono fare upload (ricevono errore `storage/unauthorized`)
3. ✅ Gli utenti autenticati possono leggere i video (tramite signed URL generati da `/api/video-url`)
4. ✅ `/videos/**` e `/chat-media/**` rimangono bloccati (solo signed URL dal server)

## Note Importanti

- **Sicurezza**: Solo gli utenti con `isAdmin: true` in Firestore possono fare upload
- **Path Standard**: I video vengono salvati in `courses/{courseId}/lessons/{lessonId}/video.mp4`
- **Upload Resumable**: Supporta file grandi senza limite 32MB (a differenza delle Cloud Functions)
- **Nessun CORS**: Non serve più configurare CORS perché l'upload avviene tramite Firebase SDK

## Troubleshooting

### Errore "storage/unauthorized"
- Verifica che l'utente sia autenticato
- Verifica che l'utente abbia `isAdmin: true` in Firestore (`/users/{uid}`)
- Verifica che le Storage Rules siano state pubblicate correttamente

### Errore "Firebase Storage non inizializzato"
- Verifica che `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` sia configurato in `.env.local`
- Verifica che Firebase sia inizializzato correttamente nel client

