# Jimi AI Planner

Jimi is a multi-user AI planning dashboard built for day-to-day execution:
- AI chat for natural-language planning
- smart daily schedule generation
- anchors (fixed time blocks)
- goals and checklists
- per-user private workspace (auth + scoped data)

---

## What You Get

- **Structured dashboard flow**
  - Top: daily schedule + chat
  - Middle: collapsible anchors + goals
  - Bottom: actionable checklists
- **AI-assisted planning**
  - Uses Gemini to translate user intent into concrete actions
  - Generates a daily schedule based on anchors, goals, and lists
- **Multi-user isolation**
  - Email/password login
  - Cookie session (HTTP-only, signed)
  - All data scoped by `userId`
- **One-click cleanup**
  - `Reset All` clears the current user's data only

---

## Tech Stack

- **Frontend:** Next.js App Router, React, Tailwind CSS
- **Backend:** Next.js Server Actions
- **ORM:** Prisma
- **Database:** PostgreSQL (Neon/Supabase-compatible)
- **AI:** Google Generative AI SDK (Gemini)

---

## Project Structure

```text
src/
  app/
    actions.ts              # Core server actions and AI router
    dashboard/page.tsx      # Main authenticated dashboard
    login/                  # Sign in / sign up pages + actions
  components/
    ChatArea.tsx
    SchedulePanel.tsx
    ProcessGrid.tsx
    AnchorsSidebar.tsx
    GoalsSidebar.tsx
    ResetAllButton.tsx
  lib/
    auth.ts                 # Session + current user utilities
    db.ts                   # Prisma client
prisma/
  schema.prisma
DEPLOYMENT.md              # Production deployment runbook
```

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env` from `.env.example` and fill:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require"
AUTH_SECRET="replace-with-long-random-secret"
GOOGLE_API_KEY="replace-with-gemini-api-key"
```

### 3. Prepare database

```bash
npm run db:generate
npm run db:push
```

### 4. Run app

```bash
npm run dev
```

Open: `http://localhost:3000`

---

## NPM Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run db:generate` - Prisma client generation
- `npm run db:push` - push schema to database
- `npm run db:studio` - open Prisma Studio

---

## Auth & Security Notes

- Login is email/password based.
- Session cookie is signed and HTTP-only.
- In production, `AUTH_SECRET` is mandatory.
- Data operations are scoped to the authenticated user.

---

## Deployment

Follow the full production steps in:

- [DEPLOYMENT.md](./DEPLOYMENT.md)

Includes:
- Vercel setup
- environment variable setup
- Prisma schema push
- domain connection checklist

---

## Current Status

This repository reflects the **first deployed production baseline** of Jimi with:
- working multi-user auth
- PostgreSQL backend
- AI schedule/chat workflow
- deployed and verified build pipeline
