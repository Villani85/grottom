# Documentazione Compatibilità v0 - Brain Hacking Academy

## ⚠️ IMPORTANTE: Limitazioni v0 da Rispettare

### 1. Firebase Admin SDK - NON UTILIZZABILE
**CRITICO**: Firebase Admin SDK causa errori di build in v0 perché tenta di bundlare dipendenze Node.js (`@google-cloud/storage`, `fs`, `http2`, `child_process`) che non sono compatibili con l'ambiente browser.

**SOLUZIONE APPLICATA**:
- ❌ NON importare mai `firebase-admin` in nessun file
- ❌ NON aggiungere `firebase-admin` a `package.json`
- ✅ Usare SOLO `firebase` (client SDK) per autenticazione
- ✅ Usare dati mock per sviluppo/demo
- ✅ Le repository devono funzionare SOLO con dati mock

**File da NON creare**:
- `lib/firebase-admin.ts` (ELIMINATO - causa build failure)

### 2. Stripe Integration - RIMOSSA
**Motivo**: Rimossa temporaneamente per semplificare il deployment.

**Cosa è stato rimosso**:
- Pacchetto `stripe` da `package.json`
- Directory `app/api/stripe/` (checkout, webhook, portal)
- File `lib/stripe.ts`
- Variabili d'ambiente Stripe da `.env.local` e `lib/env.ts`

**Componente modificato**:
- `components/SubscriptionCard.tsx` - Ora mostra un bottone "Contatta Amministrazione" invece del checkout

### 3. Next.js Configuration
**File**: `next.config.mjs`

```javascript
const nextConfig = {
  // ✅ Configurazione pulita - NO serverExternalPackages
  // ✅ NO webpack customization per firebase-admin
};
```

⚠️ Se aggiungi Firebase Admin in Cursor, NON includere queste modifiche quando riporti il progetto.

---

## 📁 Architettura Attuale del Progetto

### Struttura Directory

```
├── app/
│   ├── admin/                      # Pannello amministrativo
│   │   ├── courses/               # Gestione corsi
│   │   ├── newsletter/            # Newsletter studio
│   │   ├── settings/              # Feature flags globali
│   │   ├── users/                 # Gestione utenti
│   │   └── layout.tsx             # Layout admin con sidebar
│   ├── api/                       # API Routes (Server-side only)
│   │   ├── admin/                 # API admin protette
│   │   ├── courses/               # API corsi pubbliche
│   │   ├── cron/                  # Cron jobs
│   │   └── users/                 # API utenti
│   ├── area-riservata/            # Area membri (protetta)
│   │   ├── corsi/                 # Videocorsi
│   │   ├── dashboard/             # Dashboard utente
│   │   └── live/                  # Dirette/eventi
│   ├── auth/                      # Autenticazione
│   │   ├── login/                 # Pagina login
│   │   └── register/              # Pagina registrazione
│   ├── game/                      # Giochi gamification
│   │   ├── forecast-arcade/      # Gioco previsioni
│   │   └── inner-voice-studio/   # Gioco voce interiore
│   ├── abbonamento/               # Pagina pricing
│   ├── globals.css                # Stili globali + design tokens
│   └── layout.tsx                 # Root layout
├── components/
│   ├── layout/                    # Componenti layout
│   │   ├── Header.tsx             # Header con nav
│   │   └── Footer.tsx             # Footer
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   └── textarea.tsx
│   ├── AdminRequired.tsx          # HOC per proteggere route admin
│   ├── DemoModeBanner.tsx         # Banner modalità demo
│   ├── SubscriptionCard.tsx       # Card piano abbonamento
│   └── SubscriptionRequired.tsx   # Protezione contenuti premium
├── context/
│   └── AuthContext.tsx            # Context autenticazione globale
├── lib/
│   ├── repositories/              # Data access layer
│   │   ├── admin-settings.ts     # Repository impostazioni
│   │   ├── courses.ts            # Repository corsi
│   │   ├── newsletter.ts         # Repository newsletter
│   │   ├── posts.ts              # Repository post community
│   │   └── users.ts              # Repository utenti
│   ├── mock/
│   │   └── data.ts               # Dati mock per demo mode
│   ├── env.ts                    # Environment variables config
│   ├── firebase-client.ts        # Firebase client SDK (SOLO client)
│   ├── types.ts                  # TypeScript type definitions
│   └── utils.ts                  # Utility functions
├── public/                        # Asset statici
├── .env.local                    # Variables d'ambiente (locale)
├── next.config.mjs               # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind config (Tailwind v4)
└── tsconfig.json                 # TypeScript config
```

---

## 🎨 Design System

### Color Tokens (globals.css)
Il progetto usa design tokens CSS personalizzati. **NON modificare** questi colori quando riporti il progetto:

```css
@theme inline {
  /* Colori brand - Mantenere esattamente questi */
  --color-background: #0a0a0a;           /* Nero quasi puro */
  --color-foreground: #f5f5f5;           /* Bianco sporco */
  --color-primary: #8b5cf6;              /* Viola brand */
  --color-primary-foreground: #ffffff;   /* Bianco */
  --color-secondary: #1e1e1e;            /* Grigio scuro */
  --color-accent: #ec4899;               /* Rosa accent */
  --color-muted: #2a2a2a;                /* Grigio medio */
  --color-border: #333333;               /* Bordi sottili */
  
  /* Font families */
  --font-sans: 'Geist', 'Geist Fallback';
  --font-mono: 'Geist Mono', 'Geist Mono Fallback';
}
```

### Typography
- **Headings**: Geist font family
- **Body**: Geist font family
- **Code**: Geist Mono

### Layout Pattern
- **Primary**: Flexbox (`flex`, `items-center`, `justify-between`)
- **Complex 2D**: CSS Grid (`grid`, `grid-cols-3`)
- **Spacing**: Gap classes (`gap-4`, `gap-x-2`)

---

## 🔐 Autenticazione - Modalità Demo

### Stato Attuale
L'app funziona **ESCLUSIVAMENTE in modalità demo** senza Firebase configurato.

### AuthContext (`context/AuthContext.tsx`)

**User demo predefinito**:
```typescript
const demoUser: User = {
  uid: 'demo-user-123',
  email: 'demo@brainhacking.academy',
  name: 'Demo User',
  role: 'admin',
  subscriptionTier: 'premium',
  subscriptionStatus: 'active',
  points: 1500,
  createdAt: '2024-01-01T00:00:00Z'
};
```

**Funzioni principali**:
- `login(email, password)` - Login demo (accetta qualsiasi credenziale)
- `register(email, password, name)` - Registrazione demo
- `logout()` - Reset a demo user
- `updateProfile(data)` - Aggiorna profilo demo (solo in memoria)

**⚠️ Compatibilità**: Quando riporti il progetto, l'`AuthContext` deve SEMPRE avere un fallback a demo mode se Firebase non è configurato.

---

## 💾 Data Layer - Repository Pattern

### Architettura
Tutti i repository usano il **Mock Data Pattern** per funzionare senza database.

### Pattern Repository Standard

```typescript
// ✅ CORRETTO - Funziona in v0
import { isDemoMode } from '@/lib/env';
import { mockCourses, mockLessons } from '@/lib/mock/data';

export const CoursesRepository = {
  async getAll() {
    // SEMPRE usa mock data in v0
    return mockCourses;
  },
  
  async getById(id: string) {
    return mockCourses.find(c => c.id === id) || null;
  }
};
```

### ❌ NON FARE in v0

```typescript
// ❌ SBAGLIATO - Causa build failure
import { getAdminDb } from '@/lib/firebase-admin'; // NO!
import admin from 'firebase-admin'; // NO!

// ❌ SBAGLIATO - Import dinamico non risolve il problema
const { getAdminDb } = await import('@/lib/firebase-admin');
```

### Repository Esistenti

1. **UsersRepository** (`lib/repositories/users.ts`)
   - `getAll()` - Lista utenti
   - `getById(uid)` - Dettagli utente
   - `create(data)` - Crea utente (mock)
   - `update(uid, data)` - Aggiorna utente (mock)
   - `delete(uid)` - Elimina utente (mock)

2. **CoursesRepository** (`lib/repositories/courses.ts`)
   - `getAll()` - Lista corsi
   - `getById(id)` - Dettaglio corso
   - `getLessons(courseId)` - Lezioni del corso
   - `getLesson(courseId, lessonId)` - Dettaglio lezione

3. **AdminSettingsRepository** (`lib/repositories/admin-settings.ts`)
   - `get()` - Ottieni impostazioni globali
   - `update(settings)` - Aggiorna impostazioni (mock)

4. **NewsletterRepository** (`lib/repositories/newsletter.ts`)
   - `getAll()` - Lista campagne
   - `create(campaign)` - Crea campagna (mock)
   - `getScheduledCampaigns()` - Campagne da inviare

5. **PostsRepository** (`lib/repositories/posts.ts`)
   - `getAll(tier?)` - Post community filtrati per tier

---

## 🗂️ Mock Data (`lib/mock/data.ts`)

### Dati Disponibili

**Users** (5 utenti demo):
```typescript
export const mockUsers: User[] = [
  { uid: 'demo-user-123', email: 'demo@...', role: 'admin', ... },
  { uid: 'user-001', email: 'mario.rossi@...', role: 'member', ... },
  // ... altri 3 utenti
];
```

**Courses** (3 corsi con 9 lezioni totali):
```typescript
export const mockCourses: Course[] = [
  {
    id: 'course-001',
    title: 'Neuroscienza Applicata',
    description: '...',
    instructor: 'Dr. Marco Bianchi',
    duration: '8 settimane',
    level: 'intermedio',
    thumbnail: '/brain-science-course.jpg',
    published: true
  },
  // ... altri corsi
];
```

**Community Posts** (10 post):
- 3 post gratuiti (`tier: 'free'`)
- 4 post basic (`tier: 'basic'`)
- 3 post premium (`tier: 'premium'`)

**Admin Settings**:
```typescript
export const mockAdminSettings: AdminSettings = {
  communityFeedVisible: true,
  visibleSubscriptionTiers: ['basic', 'premium']
};
```

**Newsletter Campaigns** (5 campagne):
- 3 inviate
- 2 programmate

**Game Scores** (15 score):
- Forecast Arcade: 10 score
- Inner Voice Studio: 5 score

---

## 🔌 API Routes

### Convenzioni
- **Protezione Admin**: Usa `AdminRequired` component o controlla `user.role === 'admin'`
- **Autenticazione**: Leggi header o usa cookie (demo mode sempre autenticato)
- **Response Format**: Sempre JSON con `{ success: boolean, data?: any, error?: string }`

### API Routes Esistenti

#### Public APIs
- `GET /api/courses` - Lista corsi pubblici
- `GET /api/courses/[courseId]` - Dettaglio corso
- `GET /api/courses/[courseId]/lessons` - Lista lezioni
- `GET /api/courses/[courseId]/lessons/[lessonId]` - Dettaglio lezione
- `POST /api/courses/[courseId]/lessons/[lessonId]/comments` - Aggiungi commento
- `GET /api/admin/settings/public` - Impostazioni pubbliche

#### Admin APIs (richiedono role=admin)
- `GET /api/admin/users` - Lista utenti
- `PATCH /api/admin/users/[uid]` - Aggiorna utente
- `DELETE /api/admin/users/[uid]` - Elimina utente
- `GET /api/admin/courses` - Gestione corsi
- `PATCH /api/admin/courses/[id]` - Aggiorna corso
- `DELETE /api/admin/courses/[id]` - Elimina corso
- `GET /api/admin/settings` - Impostazioni globali
- `PATCH /api/admin/settings` - Aggiorna impostazioni
- `GET /api/admin/newsletter` - Lista campagne newsletter
- `POST /api/admin/newsletter` - Crea campagna

#### Cron Jobs
- `POST /api/cron/newsletter-dispatch` - Invio batch newsletter programmate

#### User APIs
- `GET /api/users` - Profilo utente corrente
- `PATCH /api/users/[uid]` - Aggiorna profilo
- `POST /api/video-url` - Genera URL firmato per video protetto

---

## 🎮 Funzionalità Implementate

### ✅ Completate

1. **Autenticazione (Demo Mode)**
   - Login/Logout/Register
   - Gestione profilo
   - Context globale

2. **Area Riservata**
   - Dashboard utente
   - Lista corsi
   - Player video con protezione contenuti
   - Sistema commenti lezioni

3. **Pannello Admin**
   - Gestione utenti (CRUD)
   - Gestione corsi (view/update/delete)
   - Feature flags globali
   - Newsletter studio (creazione, scheduling)

4. **Sistema Corsi**
   - Lista corsi con thumbnail
   - Dettaglio corso con lezioni
   - Player video
   - Commenti per lezione

5. **Community Feed**
   - Post filtrati per subscription tier
   - Visibilità controllata da admin settings

6. **Gamification**
   - Pagine giochi (Forecast Arcade, Inner Voice Studio)
   - Sistema punti (mock)
   - Leaderboard (mock)

7. **Subscription System (UI Only)**
   - Card piani abbonamento
   - Protezione contenuti premium
   - NO payment gateway (Stripe rimossa)

### ⚠️ Da Implementare in Cursor (se necessario)

1. **Firebase Backend Reale**
   - Firestore per persistenza dati
   - Firebase Storage per video/immagini
   - Firebase Auth per autenticazione vera

2. **Stripe Integration**
   - Checkout flow
   - Webhook gestione subscription
   - Customer portal

3. **Resend Email**
   - Invio newsletter (attualmente mock)
   - Email transazionali

4. **Video Streaming**
   - URL firmati reali (attualmente mock)
   - CDN integration

---

## 📦 Dependencies (package.json)

### ✅ Attualmente Installate

```json
{
  "dependencies": {
    "next": "16.0.10",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "firebase": "^11.1.0",           // Client SDK only
    "bcryptjs": "^2.4.3",
    "resend": "^4.0.1",
    "@types/bcryptjs": "^2.4.6"
  }
}
```

### ❌ NON Aggiungere in v0

```json
{
  "firebase-admin": "...",  // Causa build failure
  "stripe": "...",          // Rimossa temporaneamente
  "@google-cloud/storage": "..."  // Dipendenza di firebase-admin
}
```

### ✅ Puoi Aggiungere in Cursor (per produzione)

Quando lavori in Cursor, puoi installare:
- `firebase-admin` - Per backend con Firestore
- `stripe` - Per pagamenti
- Qualsiasi altro pacchetto Node.js

**MA**: Prima di riportare in v0, devi:
1. Rimuovere `firebase-admin` da `package.json`
2. Assicurarti che i repository funzionino con mock data
3. Rimuovere import di `firebase-admin` da tutti i file

---

## 🔧 Environment Variables

### File: `.env.local`

```bash
# Firebase Client (Optional - app funziona senza)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Resend (Optional - newsletter usa mock)
RESEND_API_KEY=

# ⚠️ Stripe - RIMOSSO (non usare in v0)
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# STRIPE_WEBHOOK_SECRET=
```

### Come Gestire in Cursor

1. **In Cursor**: Aggiungi tutte le variabili reali per sviluppo locale
2. **Prima di riportare in v0**: 
   - Rimuovi valori sensibili
   - Lascia variabili vuote o commenta
   - L'app deve funzionare senza configurazione

---

## 🚀 Come Riportare il Progetto in v0

### Checklist Pre-Import

#### 1. Pulizia Dependencies

```bash
# Rimuovi da package.json
- firebase-admin
- stripe (se non reintegrato)
- @google-cloud/storage
- Qualsiasi pacchetto Node.js non compatibile browser
```

#### 2. Verifica Imports

```bash
# Cerca e rimuovi questi import:
grep -r "firebase-admin" .
grep -r "from 'stripe'" .
grep -r "@google-cloud" .

# Tutti devono essere 0 risultati o commentati
```

#### 3. Repository Check

Ogni repository (`lib/repositories/*.ts`) deve:
- ✅ Importare SOLO da `@/lib/mock/data`
- ✅ Funzionare senza database
- ❌ NON importare `firebase-admin`
- ❌ NON usare `admin.firestore()`

#### 4. Firebase Client Only

`lib/firebase-client.ts` deve:
- ✅ Usare SOLO `firebase` (client SDK)
- ✅ Gestire demo mode se config mancante
- ❌ NON importare mai `firebase-admin`

#### 5. API Routes

Tutti i file in `app/api/**/route.ts` devono:
- ✅ Usare repository con mock data
- ✅ Funzionare senza Firebase configurato
- ❌ NON chiamare firebase-admin

#### 6. Environment Variables

`.env.local` deve:
- ✅ Avere tutti i valori vuoti o placeholder
- ✅ Essere commentato con descrizioni
- ❌ NON contenere secrets reali

#### 7. Next.js Config

`next.config.mjs` deve essere pulito:
```javascript
const nextConfig = {
  // NO serverExternalPackages
  // NO webpack configuration per firebase-admin
};
```

### Procedura di Import

1. **Crea un ZIP del progetto**
   ```bash
   # Escludi node_modules e .next
   zip -r progetto.zip . -x "node_modules/*" ".next/*" ".git/*"
   ```

2. **Upload in v0**
   - Trascina ZIP nella chat v0
   - v0 estrarrà automaticamente i file

3. **Prima Verifica**
   ```bash
   # v0 eseguirà automaticamente:
   bun install
   bun run build
   
   # Se il build fallisce con errori "@google-cloud/storage",
   # torna al punto 1 della checklist
   ```

4. **Test Modalità Demo**
   - Accedi a `/auth/login`
   - Usa qualsiasi email/password
   - Verifica che il demo user funzioni
   - Naviga nell'app per testare tutte le funzionalità

---

## 🐛 Troubleshooting Comune

### Errore: "Module not found: Can't resolve 'fs'"

**Causa**: Stai importando `firebase-admin` o un pacchetto Node.js in un file che Next.js cerca di bundlare per il browser.

**Soluzione**:
1. Cerca tutti gli import di `firebase-admin`
2. Rimuovili o spostali in API routes server-only
3. Usa mock data nei repository

### Errore: "Component auth has not been registered yet"

**Causa**: Firebase client non è inizializzato correttamente.

**Soluzione**:
- Verifica che `lib/firebase-client.ts` gestisca il caso config mancante
- Assicurati che `AuthContext` usi demo mode se Firebase non configurato

### Errore: Build fallisce con "google-cloud/storage"

**Causa**: `firebase-admin` è ancora nel progetto da qualche parte.

**Soluzione**:
```bash
# Elimina file
rm lib/firebase-admin.ts

# Cerca import residui
grep -r "firebase-admin" . | grep -v node_modules

# Rimuovi da package.json
# Pulisci next.config.mjs
```

### Dati Mock Non Appaiono

**Causa**: Repository non stanno ritornando mock data.

**Soluzione**:
- Verifica che ogni repository importi da `@/lib/mock/data`
- Controlla che le API routes chiamino i repository
- Usa `console.log("[v0] data:", data)` per debug

---

## 📝 Best Practices per Cursor

### Durante lo Sviluppo in Cursor

1. **Usa Firebase Admin liberamente**
   - Crea vero backend con Firestore
   - Implementa Storage per video/immagini
   - Usa Cloud Functions se necessario

2. **Mantieni Doppia Logica**
   ```typescript
   // In repository
   async getAll() {
     if (isDemoMode()) {
       return mockCourses; // Per v0
     }
     // Logica Firebase reale
     const db = getAdminDb();
     const snapshot = await db.collection('courses').get();
     return snapshot.docs.map(doc => doc.data());
   }
   ```

3. **Environment Variables Separate**
   - `.env.local` - Per Cursor con valori reali
   - `.env.local.v0` - Per v0 con valori vuoti (commit questo)

4. **Commenta Codice Incompatibile**
   ```typescript
   // @v0-incompatible-start
   import admin from 'firebase-admin';
   // ... logica firebase-admin
   // @v0-incompatible-end
   
   // @v0-compatible
   return mockData;
   ```

5. **Test Entrambi i Mode**
   ```bash
   # Test con Firebase
   FIREBASE_CONFIG=real npm run dev
   
   # Test demo mode (compatibile v0)
   unset FIREBASE_CONFIG && npm run dev
   ```

### Prima di Riportare in v0

1. **Script di Pulizia**
   ```bash
   # crea: scripts/prepare-for-v0.sh
   #!/bin/bash
   
   # Rimuovi firebase-admin da package.json
   npm uninstall firebase-admin @google-cloud/storage
   
   # Commenta import incompatibili
   find . -name "*.ts" -exec sed -i 's/^import.*firebase-admin/\/\/ REMOVED FOR V0: &/' {} \;
   
   # Pulisci next.config
   # ... altri comandi
   ```

2. **Verifica Build**
   ```bash
   npm run build
   # Deve completare senza errori
   ```

3. **Test Demo Mode**
   ```bash
   # Rimuovi tutti gli env
   mv .env.local .env.local.backup
   npm run dev
   # App deve funzionare completamente
   ```

---

## 📋 Checklist Finale Prima dell'Import

```
[ ] package.json non contiene firebase-admin
[ ] package.json non contiene stripe (se non reintegrato)
[ ] Nessun file importa da 'firebase-admin'
[ ] lib/firebase-admin.ts NON esiste
[ ] Tutti i repository usano mock data
[ ] AuthContext funziona in demo mode
[ ] next.config.mjs è pulito
[ ] .env.local ha valori vuoti/placeholder
[ ] Build completa senza errori
[ ] App funziona senza configurazione Firebase
[ ] Login demo funziona
[ ] Admin panel accessibile
[ ] Corsi visualizzabili
[ ] Nessun console.error critico
```

---

## 🎯 Obiettivi Futuri (Post-v0)

Quando il progetto sarà in produzione (non in v0):

1. **Firebase Production**
   - Firestore per dati persistenti
   - Storage per media
   - Hosting per deploy

2. **Stripe Production**
   - Checkout reale
   - Gestione subscription
   - Webhook verified

3. **Email Service**
   - Resend configurato
   - Newsletter automatiche
   - Email transazionali

4. **Video Streaming**
   - CDN configuration
   - URL firmati reali con scadenza
   - DRM protection

5. **Analytics**
   - Google Analytics
   - User tracking
   - Conversion funnels

---

## 📞 Supporto

Quando riporti il progetto in v0 e incontri problemi:

1. **Controlla questa documentazione** - La maggior parte dei problemi è documentata
2. **Usa gli strumenti di debug** - Console logs con `[v0]` prefix
3. **Verifica la checklist** - Punto per punto prima dell'import
4. **Condividi errori specifici** - Screenshot o messaggi di errore completi

---

## 🔄 Version History

- **v1.0** (Corrente) - Demo mode only, no Firebase Admin, no Stripe
  - Data: 2024-01-XX
  - Funzionalità: Auth demo, Admin panel, Corsi, Newsletter studio
  - Limitazioni: No database persistente, no payments
  
- **v2.0** (Pianificata per Cursor) - Firebase backend + Stripe
  - Firebase Admin per backend
  - Stripe per pagamenti
  - Database persistente
  - Email service attivo

---

**NOTA FINALE**: Questa documentazione è stata scritta specificamente per garantire che il progetto sviluppato in Cursor possa essere riportato in v0 senza errori di build. Seguire attentamente le istruzioni per evitare incompatibilità.
