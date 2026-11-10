# POLSCI 157 · Personal Review Center

A personal study workspace for **Andrea Grande**: a two-center learning platform
built around the actual POLSCI 157 assigned readings.

- **Review Center** — read the original PDFs, guided annotations, companion
  notes, personal notes and bookmarks.
- **Practice Exam Center** — practice quizzes, timed mock exams, focused
  review of missed questions, and weakness analysis.
- **Flashcards** — active recall linked to readings and concepts.
- **Study Progress** — mastery tracking, exam history, weakness analysis.

> The five illustrative sample topics are placeholders. The two assigned
> readings (Ruland, Pilapil) are real course content sourced from the PDFs in
> `source-materials/`. See [docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md).

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

1. Push this repo to GitHub and click **Create application → Pages → Connect to Git**.
2. Select the repo, branch **`main`**, framework preset **Vite**.
3. Build command: **`npm run build`**, build output directory: **`dist`**.
4. Deploy. `public/_redirects` ships `/* /index.html 200`, so client-side routes
   (`/review`, `/read/:id`, `/exam`, `/flashcards`, `/progress`) resolve on
   refresh and direct links.

## Routing note

The app uses `BrowserRouter`. The SPA fallback in `public/_redirects` is required
on static hosts; without it, deep links return 404.

## License note

Personal study use only. Course excerpts remain the property of their
authors/instructors. Do not publish instructor-provided materials without permission.
