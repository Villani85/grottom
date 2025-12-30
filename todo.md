# Brain Hacking Academy - Frontend Next.js 14

## Design Guidelines

### Design References
- **Stile**: Moderno, minimalista, orientato alla neuroscienza
- **Tema**: Dark mode predominante con accenti psichedelici
- **Font**: Inter per leggibilità, Plus Jakarta Sans per titoli

### Color Palette
- Primary: #0A0A0A (Dark Background)
- Secondary: #1A1A1A (Cards/Sections)
- Accent: #8B5CF6 (Violet - neuroscienza/mente)
- Secondary Accent: #10B981 (Green - crescita)
- Text: #FFFFFF (White), #B0B0B0 (Light Gray)

### Typography
- Heading1: Plus Jakarta Sans 700 (48px)
- Heading2: Plus Jakarta Sans 600 (36px)
- Heading3: Plus Jakarta Sans 500 (24px)
- Body: Inter 400 (16px)
- Small: Inter 400 (14px)

### Component Styles
- Cards: bg-gray-900, border-gray-800, rounded-xl
- Buttons: bg-purple-600 hover:bg-purple-700, text-white, rounded-lg
- Forms: bg-gray-800, border-gray-700, focus:border-purple-500

---

## Development Tasks

### 1. Setup & Configuration
- [ ] Configurare NEXT_PUBLIC_API_BASE_URL in .env.local
- [ ] Installare dipendenze aggiuntive: axios, react-icons
- [ ] Configurare struttura delle cartelle

### 2. API Client & Authentication
- [ ] Creare `lib/apiClient.ts` per gestire chiamate API
- [ ] Implementare gestione token JWT in localStorage
- [ ] Creare context/auth provider per stato autenticazione

### 3. Layout & Navigation
- [ ] Creare `app/layout.tsx` con navbar condizionale
- [ ] Implementare Header/Footer component
- [ ] Creare ProtectedRoute per pagine riservate

### 4. Pagine Pubbliche
- [ ] `app/page.tsx` - Homepage pubblica
- [ ] `app/marketing/come-funziona/page.tsx`
- [ ] `app/marketing/gamification/page.tsx`
- [ ] `app/marketing/abbonamento/page.tsx`

### 5. Autenticazione
- [ ] `app/auth/login/page.tsx`
- [ ] `app/auth/register/page.tsx`

### 6. Area Riservata
- [ ] `app/area-riservata/dashboard/page.tsx`
- [ ] `app/area-riservata/live/page.tsx`
- [ ] `app/area-riservata/live/[id]/page.tsx`
- [ ] `app/area-riservata/replay/[id]/page.tsx`
- [ ] `app/area-riservata/community/page.tsx`
- [ ] `app/area-riservata/leaderboard/page.tsx`

### 7. Componenti Riutilizzabili
- [ ] `components/community/PostCard.tsx`
- [ ] `components/gamification/LevelBadge.tsx`
- [ ] `components/live/LiveEventCard.tsx`
- [ ] `components/ui/Button.tsx`
- [ ] `components/ui/Card.tsx`

### 8. Styling & Responsive
- [ ] Configurare tema Tailwind
- [ ] Assicurare responsive design
- [ ] Aggiungere animazioni e transizioni

### 9. Testing & Build
- [ ] Testare tutte le chiamate API
- [ ] Eseguire build di produzione
- [ ] Verificare compatibilità con backend

---

## API Endpoints Integration

### Autenticazione
- POST `/api/auth/register` - Registrazione
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Profilo utente

### Utenti
- GET `/api/users/:id` - Dettagli utente
- GET `/api/users/:id/activity` - Attività utente

### Live Events
- GET `/api/live-events` - Lista eventi
- GET `/api/live-events/:id` - Dettaglio evento
- GET `/api/live-events/status/:status` - Eventi per stato

### Community
- GET `/api/community/posts` - Lista post
- POST `/api/community/posts` - Crea post
- POST/DELETE `/api/community/posts/:id/like` - Like/Unlike

### Gamification
- GET `/api/gamification/levels` - Livelli
- GET `/api/gamification/my-progress` - Progresso utente
- GET `/api/gamification/:userId/achievements` - Achievements

### Abbonamenti
- GET `/api/subscriptions/my-subscription` - Stato abbonamento
- GET `/api/subscriptions/check-feature/:feature` - Verifica feature
- POST `/api/subscriptions/subscribe` - Attiva abbonamento
