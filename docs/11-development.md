# 11 — Développement (Runbook)

## Prérequis

- Node.js >= 18
- npm

## Installation

```bash
npm install
```

## Configuration

Créer `.env` à la racine :

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Lancer en local

```bash
npm run dev
```

## Scripts

- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run typecheck`

## Conventions

- Typage Supabase : `src/lib/database.types.ts`
- Toute fonctionnalité DB doit être ajoutée via migration SQL.
- Toute UI textuelle doit être i18n (`src/i18n/translations.ts`).

