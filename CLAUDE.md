# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Читательский Дневник (Reader's Diary) — a Next.js gamification app for daily reading motivation with voice notes, AI-powered note formatting, spaced repetition, and Telegram bot integration. The UI is in Russian.

## Commands

```bash
npm run dev      # Dev server with Turbopack
npm run build    # Production build
npm run lint     # ESLint
npm start        # Run production build
```

No test framework is configured.

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client config
- `SUPABASE_SERVICE_ROLE_KEY` — server-side Supabase (bypasses RLS)
- `TELEGRAM_BOT_TOKEN` — grammy bot
- `OPENAI_API_KEY` — Whisper transcription + GPT-4o-mini formatting
- `NEXT_PUBLIC_APP_URL` — app URL (e.g. `http://localhost:3000`)
- `CRON_SECRET` — protects cron API endpoints
- `TELEGRAM_WEBHOOK_SECRET` — verifies Telegram webhook requests (set via `setWebhook` API `secret_token` param)

## Architecture

**Next.js 16 App Router** with TypeScript strict mode. Path alias `@/` maps to `src/`.

### Route Groups
- `src/app/(app)/` — authenticated routes (dashboard, books, notes, review, achievements, settings)
- `src/app/(auth)/` — login/signup, OAuth callback
- `src/app/api/` — API routes (ai, transcribe, cron, telegram webhook)

### Auth Flow
Supabase Auth with email/password. Middleware (`src/middleware.ts`) enforces auth on all routes except `/login`, `/callback`, `/api/*`, and `/`. Two Supabase client factories:
- `@/lib/supabase/server.ts` — server components/API routes (cookie-based session)
- `@/lib/supabase/client.ts` — browser (singleton pattern, lazy init)

All database tables have RLS policies restricting users to their own data. Service role is used only in cron jobs.

### Key Libraries
- `src/lib/gamification.ts` — XP rewards, level formula (`floor(sqrt(xp/100))+1`), streak tracking, 9 achievement types
- `src/lib/spaced-repetition.ts` — SM-2 algorithm for review cards (ease factor, interval progression)
- `src/lib/ai.ts` — OpenAI wrapper: Whisper transcription, GPT-4o-mini note formatting, review card generation (lazy client init)
- `src/lib/telegram.ts` — grammy bot: `/start CODE` account linking, `/stats`, `/books`, voice→note pipeline

### Data Hooks
Custom React hooks in `src/hooks/` manage client-side data fetching and mutations:
- `use-books.ts` — book CRUD, reading session logging
- `use-profile.ts` — user profile
- `use-review.ts` — review card fetching, SM-2 grade submission

### Database (Supabase PostgreSQL)
Tables: `profiles`, `books` (status enum: reading|finished|paused|want), `reading_sessions`, `notes` (source: voice|manual), `review_cards` (SM-2 fields), `achievements`. Migrations in `supabase/migrations/`. Atomic RPC functions `add_xp` and `update_streak` prevent race conditions on concurrent XP/streak updates.

### Cron Endpoints
`/api/cron/note-digest`, `/api/cron/reading-reminder`, `/api/cron/review-reminder` — all validate `CRON_SECRET` header, use service role, send Telegram messages in parallel batches.

### Telegram Bot
Webhook at `/api/telegram`. Voice messages go through: download → Supabase Storage (voice-notes bucket) → Whisper transcription → GPT formatting → save note → generate review cards. Text messages are saved directly as notes.

## Conventions

- Client components use `'use client'` directive; server components are the default
- File naming: kebab-case. Component exports: PascalCase
- UI: shadcn/ui (new-york style) + Radix primitives + Tailwind CSS 4 + Framer Motion
- Dark mode is the default (`html` has `className="dark"`)
- Dynamic imports used for client-heavy components (e.g. ReadingChart with Recharts)
- Routes needing fresh auth use `export const dynamic = 'force-dynamic'`
- `cn()` from `@/lib/utils` for merging Tailwind classes
- Toast notifications via sonner

## Deployment

Автодеплой с GitHub отключён. Деплой выполняется вручную через Vercel CLI.

```bash
# Слинковать проект (один раз)
vercel link --yes --project=read-note

# Получить env-переменные для локальной разработки
vercel env pull .env.local --yes --environment=production

# Деплой в production
vercel --prod --yes
```

**После изменения переменных окружения** в Vercel Dashboard — обязательно редеплой (`vercel --prod --yes`), иначе новые значения не применятся.

**Telegram webhook:** если меняется `TELEGRAM_WEBHOOK_SECRET`, нужно обновить webhook:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://read-note-puce.vercel.app/api/telegram&secret_token=<SECRET>"
```

## Skills

**Всегда используй установленные skills через инструмент Skill вместо ручного выполнения.** Скиллы содержат экспертные знания и best practices, которые нужно применять при соответствующих задачах. Установлены из [skills.sh](https://skills.sh).

### Обязательные к использованию скиллы:

- `/frontend-design` (anthropics/skills) — **использовать при создании или изменении любых UI-компонентов, страниц, макетов.** Обеспечивает production-grade дизайн высокого качества вместо generic шаблонного вида
- `/vercel-react-best-practices` (vercel-labs/agent-skills) — **использовать при написании или рефакторинге React/Next.js кода.** 40+ правил оптимизации производительности по 8 категориям от Vercel Engineering
- `/vercel-composition-patterns` (vercel-labs/agent-skills) — **использовать при проектировании компонентов и их взаимодействия.** Compound components, state lifting, внутренняя композиция вместо boolean prop proliferation
- `/web-design-guidelines` (vercel-labs/agent-skills) — **использовать при ревью UI-кода.** Аудит по 100+ правилам: accessibility, performance, UX
- `/supabase-postgres-best-practices` (supabase/agent-skills) — **использовать при написании, ревью или оптимизации SQL-запросов, схемы БД, RLS-политик.** Postgres performance optimization от Supabase
- `/webapp-testing` (anthropics/skills) — **использовать при написании или запуске тестов веб-приложения.** Playwright-based тестирование
- `/keybindings-help` — **использовать при настройке горячих клавиш** Claude Code
