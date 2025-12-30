# Configurazione Firestore Security Rules

## ⚠️ IMPORTANTE

L'errore "Missing or insufficient permissions" indica che le regole di sicurezza di Firestore non sono configurate correttamente. 

## 📋 Come Applicare le Regole

### Opzione 1: Firebase Console (Consigliato)

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Seleziona il tuo progetto (`v0-membership-prod`)
3. Vai su **Firestore Database** → **Rules**
4. Copia il contenuto del file `firestore.rules` in questo progetto
5. Incolla le regole nella console
6. Clicca **Publish** per applicare le regole

### Opzione 2: Firebase CLI

Se hai Firebase CLI installato:

```bash
# Assicurati di essere nella directory del progetto
cd C:\Users\servi\Desktop\grotto2

# Login a Firebase (se non già fatto)
firebase login

# Deploy delle regole
firebase deploy --only firestore:rules
```

## ⚠️ IMPORTANTE: Due Versioni delle Regole

### Versione Completa (`firestore.rules`)
Regole complete con controllo admin e sicurezza avanzata. **Usa questa in produzione.**

### Versione Semplificata (`firestore.rules.simple`) - PER SVILUPPO
Regole semplificate che permettono tutte le operazioni agli utenti autenticati. **Usa questa se hai ancora errori di permessi.**

**Per applicare la versione semplificata:**
1. Copia il contenuto di `firestore.rules.simple`
2. Incollalo in Firebase Console → Firestore → Rules
3. Pubblica

**Nota**: La versione semplificata è meno sicura ma utile per sviluppo e debug.

---

## 🔐 Cosa Permettono le Regole

### Collection `users`
- ✅ Utenti autenticati possono leggere il proprio profilo
- ✅ Utenti possono aggiornare il proprio profilo (tranne `isAdmin`)
- ✅ Utenti possono creare il proprio profilo durante registrazione
- ✅ Admin possono leggere e aggiornare qualsiasi utente

### Collection `posts`
- ✅ Utenti autenticati possono leggere post pubblicati
- ✅ Utenti possono creare post (solo i propri)
- ✅ Utenti possono aggiornare i propri post
- ✅ Utenti possono eliminare i propri post
- ✅ Admin possono eliminare qualsiasi post

### Collection `comments`
- ✅ Utenti autenticati possono leggere commenti
- ✅ Utenti possono creare commenti
- ✅ Utenti possono aggiornare/eliminare i propri commenti
- ✅ Admin possono eliminare qualsiasi commento

### Collection `points_transactions`
- ✅ Utenti possono leggere le proprie transazioni punti
- ✅ Utenti possono creare transazioni (per ora, sarà limitato in produzione)
- ✅ Admin possono leggere tutte le transazioni

### Collection `admin_settings`
- ✅ Utenti autenticati possono leggere settings pubblici
- ✅ Solo admin possono scrivere

### Collection `newsletter_campaigns` e `newsletter_sends`
- ✅ Solo admin possono leggere e scrivere

### Collection `courses`
- ✅ Utenti autenticati possono leggere corsi
- ✅ Solo admin possono scrivere
- ✅ Subcollections `lessons` e `comments` seguono le stesse regole

### Collection `messages` e `conversations`
- ✅ Utenti possono leggere/scrivere solo nelle proprie conversazioni
- ✅ Admin possono leggere tutte le conversazioni

## 🚨 Regole Temporanee per Sviluppo

**NOTA**: Alcune regole sono più permissive per lo sviluppo. In produzione, dovresti:

1. **Restringere `points_transactions`**: Solo server (via Admin SDK) dovrebbe creare transazioni
2. **Restringere `newsletter_sends`**: Solo server dovrebbe creare record di invio
3. **Aggiungere rate limiting**: Prevenire spam e abusi

## ✅ Verifica

Dopo aver applicato le regole, prova a:

1. **Pubblicare un post** nella community
2. **Leggere i post** esistenti
3. **Eliminare un post** (se admin)
4. **Aggiornare il profilo** utente

Se vedi ancora errori di permessi, controlla:
- Che l'utente sia autenticato (`request.auth != null`)
- Che l'utente abbia il campo `isAdmin: true` in Firestore (se necessario)
- Che le regole siano state pubblicate correttamente

## 🔍 Debug

Per vedere quali regole vengono applicate, controlla la console del browser:
- `[Firestore] Error fetching posts:` - Mostra errori di permessi
- `[Firestore] Post created:` - Conferma creazione post
- `[Firestore] Post deleted:` - Conferma eliminazione post

Se vedi errori di permessi, verifica:
1. Che l'utente sia autenticato
2. Che le regole siano state pubblicate
3. Che la struttura dei dati corrisponda alle regole

