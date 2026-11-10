# POLSCI 157 · Personal Review Center

A personal study workspace for **Andrea Grande**: a two-center learning platform
built around the actual POLSCI 157 assigned readings.

- **Review Center** — read the original PDFs, guided annotations, companion
  notes, personal notes and bookmarks.
- **Practice Exam Center** — practice quizzes, timed mock exams, focused
  review of missed questions, and weakness analysis.
- **Flashcards** — active recall linked to readings and concepts.
- **Study Progress** — mastery tracking, exam history, weakness analysis.

> All reviewer content comes from the two assigned readings (Rüland,
> Pilapil), sourced from the PDFs in `source-materials/` plus supplementary
> lecture notes. See [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).

## Features

- **Dashboard** — greeting, two center cards, per-reading progress, recent activity.
- **Review Center** — reading library; per-reading pages with PDF viewer,
  extracted-text reader, guided concept highlights, companion panel, personal
  notes, bookmarks, completion tracking.
- **Practice Exam Center** — per-reading, combined, focused, and missed-question
  exams; practice and timed mock modes; full answer review with page references.
- **Flashcards** — topic filter, missed/hard modes, 3D flip, keyboard shortcuts,
  session summaries; cards carry source page references.
- **Study Progress** — per-topic mastery, quiz/exam performance, weakness
  analysis linking back to readings, export/import/reset.
- **Local-first** — all progress persists in `localStorage`; no account or backend.

## Tech stack

- React 19 + TypeScript + Vite
- React Router (`BrowserRouter` + SPA fallback for static hosting)
- Lucide icons
- Plain CSS design system (`src/index.css`), Fraunces + Inter via Google Fonts
- Native browser PDF embedding (`<iframe>`) — no PDF.js dependency

## Local development

```bash
npm install
npm run dev      # start dev server
npm run build    # typecheck + production build to dist/
npm run preview  # preview the production build
```

Requires Node.js 18+.

## Content & readings

All course content lives in typed data files:

- `src/data/topics.ts` — topics and subtopics
- `src/data/flashcards.ts` — flashcards
- `src/data/questions.ts` — quiz/exam questions
- `src/data/readings.ts` — reading metadata registry
- `src/data/reading-ruland.ts`, `src/data/reading-pilapil.ts` — extracted text + annotations
- `source-materials/` — original PDFs (preserved) + `.extracted.txt` page text
- `public/readings/` — web-served PDF copies (URL-safe filenames)
- `scripts/extract_text.py` — PDF → page-text extractor (text layer or OCR)

Full field reference and the "how to add a future PDF" workflow:
**[docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)**.

## Deploying to Cloudflare Pages

1. Push this repo to GitHub, then in the Cloudflare dashboard click **Workers & Pages → Create → Pages → Connect to Git**.
2. Select this repo, set the production branch to **`main`**, and choose the **Vite** framework preset.
3. Set the build command to **`npm run build`**, the build output directory to **`dist`**, and the project root to **`/`**.
4. Deploy. No `_redirects` file is needed — Cloudflare Pages automatically serves `index.html` for unmatched client-side routes, so deep links (`/review`, `/read/:id`, `/reviewer`, `/flashcards`, `/exam`, `/practice`, `/progress`) resolve on refresh and direct visits.

> **WARNING — wrong project type:** if the project was created as a **Worker** (for example the dashboard's deploy command shows `npx wrangler deploy`), that is the wrong target for this static Vite SPA and the deploy will fail. Delete the Worker project and recreate it as **Pages → Connect to Git** (or switch the project type to Pages in the dashboard), then redeploy with the settings above.

## Routing note

The app uses `BrowserRouter`. Deep links work through Cloudflare Pages' built-in SPA fallback, which serves `index.html` for any unmatched route — no `_redirects` file or extra configuration required. Locally, `npm run preview` serves the production build with the same fallback behavior, so refresh/direct-link behavior can be verified before deploying.

## License note

Personal study use only. Course excerpts remain the property of their
authors/instructors. Do not publish instructor-provided materials without permission.
