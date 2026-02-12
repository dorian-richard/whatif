# WhatIf — Simulateur de decisions freelance

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- Supabase (PostgreSQL + Auth + RLS)
- Stripe (Checkout + Customer Portal + Webhooks)
- Prisma ORM
- Zustand (state management)
- Recharts (graphs)
- Framer Motion (animations)
- Vitest (tests)

## Architecture

- `src/lib/simulation-engine.ts` — Moteur de calcul (coeur du produit). Tout cote client, pas d'API.
- `src/stores/` — Zustand stores: `useProfileStore` (profil freelance + clients) et `useSimulatorStore` (params de simulation)
- `src/types/index.ts` — Types partages
- `src/lib/constants.ts` — Saisonnalite, presets, couleurs
- `src/components/simulator/` — Composants du simulateur
- `src/components/ui/` — shadcn/ui

## Regles metier cles

3 types de facturation (TJM, Forfait, Mission) avec regles differentes :
- **Vacances** : TJM → 0, Forfait → continue, Mission → 0
- **Variation tarifs** : TJM → applique, Forfait/Mission → non
- **Reduction jours/semaine** : TJM → proportionnel, Forfait/Mission → non
- **Saisonnalite** : TJM → appliquee, Forfait/Mission → non

## Commandes

- `npm run dev` — Dev server
- `npm run build` — Production build
- `npm run test` — Tests (vitest)
- `npm run test:run` — Tests one-shot
