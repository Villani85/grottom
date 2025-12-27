# V0-Friendly Membership Gamificata (Next.js + Firebase + Stripe + Resend)

✅ UI pronta e navigabile appena importi lo ZIP in v0  
✅ `npm run build` stabile anche senza backend (DEMO mode automatico)  
✅ API Routes per cron e webhook (Vercel Cron / QStash)  
✅ Integrazione reale opzionale: Firebase Admin/Firestore/Storage, Stripe, Resend (attivata via env)

## Quickstart (DEMO)
```bash
npm i
cp .env.local.example .env.local
npm run dev
```

Apri:
- `/` (landing)
- `/login` (switch DEMO user)
- `/admin/settings` (solo demo_admin)
- `/admin/newsletter` (Newsletter Studio)

## Demo Mode (auto)
DEMO mode è attivo se:
- `NEXT_PUBLIC_DEMO_MODE=true` **oppure**
- mancano le env server di Firebase Admin.

In DEMO:
- niente invio email reale (Resend simulato)
- niente Stripe reale
- Storage signed URL è mock
- database è in-memory (non persistente)

## Real Mode
Configura in Vercel:
- Firebase client env (public)
- Firebase admin env (private)
- `CRON_SECRET`
- (opzionale) `RESEND_API_KEY`
- (opzionale) `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`

## Cron
Chiama con header `x-cron-secret: <CRON_SECRET>`:
- `POST /api/cron/newsletter-dispatch`
- `POST /api/cron/publish-scheduled`

## Note
- Alias `@/` configurato via `tsconfig.json` ✅
- Firebase Admin è server-only ✅
- Le API admin/newsletter sono protette via `requireAdmin()` ✅
