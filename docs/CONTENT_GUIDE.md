# Content Guide — POLSCI 157 Reviewer

All content is plain TypeScript data. No CMS, no backend. Edit the files below,
save, and the UI updates.

- Topics: `src/data/topics.ts`
- Flashcards: `src/data/flashcards.ts`
- Questions: `src/data/questions.ts`
- Readings registry: `src/data/readings.ts`
- Reading content: `src/data/reading-<id>.ts`
- Types: `src/types.ts`

## 1. Add a Topic with Subtopics

`Topic` fields (`src/types.ts`):

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Stable slug, e.g. `t-power`. Referenced by cards/questions. |
| `code` | `string` | Short label shown as a badge, e.g. `Week 3`. |
| `title` | `string` | Full topic title. |
| `description` | `string` | 1–2 sentence summary for the list view. |
| `sample` | `boolean` | Keep `true` until replaced with real syllabus content. |
| `readingId` | `string?` | Set when backed by an assigned reading. |
| `source` | `{ file, label }?` | Original PDF filename + short label. |
| `subtopics` | `Subtopic[]` | At least one entry. |

`Subtopic` fields:

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique across all topics, e.g. `t-power-s1`. Used for read tracking. |
| `title` | `string` | Accordion heading. |
| `summary` | `string` | 1–2 sentences shown when collapsed. |
| `definitions` | `{ term, definition }[]` | Exact wording to memorize. |
| `keyArguments` | `string[]` | Claims to defend in an essay. |
| `scholars` | `{ name, contribution }[]` | Theorist + one-line contribution. |
| `examples` | `string[]` | Concrete cases per argument. |
| `takeaways` | `string[]` | Exam-ready distilled points. |
| `readingTimeMinutes` | `number` | Rough estimate, shown in the UI. |

Example:

```ts
{
  id: "t-power",
  code: "Week 1",
  title: "Power and Authority",
  description: "Coercion, persuasion, and agenda-setting as lenses on power.",
  sample: false, // set false only when this is real syllabus content
  subtopics: [
    {
      id: "t-power-s1",
      title: 'What "power" means in political analysis',
      summary: "Contrasts coercion, persuasion, and agenda-setting.",
      definitions: [
        { term: "Coercive power", definition: "Behavior shaped through threats or sanctions." },
      ],
      keyArguments: ["Observable decisions reveal only one face of power."],
      scholars: [{ name: "Author (Year)", contribution: "One-line contribution." }],
      examples: ["A committee chair declining to schedule a vote."],
      takeaways: ["State your definition of power before applying it."],
      readingTimeMinutes: 6,
    },
  ],
}
```

Rules:

- Keep `id` values stable — renaming a subtopic `id` orphans its read state.
- Keep `sample: true` on every topic until its text comes from the real
  syllabus/readings. The UI shows a `Sample` badge while any sample content remains.

## 2. Add a Flashcard

File: `src/data/flashcards.ts`. Type `Flashcard`:

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique, e.g. `fc-power-1`. Used for mastery tracking. |
| `topicId` | `string` | Must match an existing `Topic.id`. |
| `front` | `string` | Prompt — one question only. |
| `back` | `string` | Answer — one to two sentences. |
| `explanation` | `string` | Why the answer holds; shown after flipping. |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | See §5. |
| `pageRef` | `string?` | Source page, e.g. `"PDF p. 4"`. |
| `concept` | `string?` | Concept tag linking to a reading annotation. |

## 3. Add a QuizQuestion

File: `src/data/questions.ts`. Type `QuizQuestion`:

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Unique, e.g. `q-power-1`. |
| `topicId` | `string` | Must match an existing `Topic.id`. |
| `question` | `string` | Stem — one idea per question. |
| `choices` | `string[]` | 4 options recommended; exactly one correct. |
| `correctIndex` | `number` | Zero-based index into `choices`. |
| `explanation` | `string` | Shown after answering; teach the discriminator. |
| `difficulty` | `'easy' \| 'medium' \| 'hard'` | See §5. |
| `kind` | `'mcq' \| 'truefalse'?` | Default `mcq`. `truefalse` uses `["True","False"]`. |
| `readingId` | `string?` | Owning reading, for exam banks and review links. |
| `pageRef` | `string?` | Source page, e.g. `"PDF p. 4"` — parsed for deep links. |
| `concept` | `string?` | Concept tag used for weakness analysis. |
| `whyWrong` | `string[]?` | Parallel to `choices`; `""` for the correct one. |

## 4. Add an assigned reading (full workflow)

Each reading has: a preserved original PDF, a web-served copy, extracted page
text, structured content + annotations, a linked topic, flashcards, and questions.

**Step 1 — preserve the original.**

Copy the PDF into `source-materials/` with its exact original filename.

**Step 2 — extract page text.**

```bash
python -m pip install pypdf pymupdf rapidocr-onnxruntime  # once
python scripts/extract_text.py
```

Text-layer PDFs extract exactly; scanned PDFs fall back to OCR (slower, first
run downloads models). Output: `source-materials/<name>.extracted.txt` with
`===== PDF PAGE N =====` markers. Commit the `.extracted.txt` alongside the PDF.

**Step 3 — stage the web copy.**

Copy the PDF to `public/readings/` with a URL-safe lowercase-hyphen name, e.g.
`ruland-constitutional-debate.pdf`. The reader embeds it via `<iframe>` and links
"Open original" in a new tab.

**Step 4 — structure the content.**

Create `src/data/reading-<id>.ts` exporting:

```ts
export const META = { overview, thesis, takeaways: string[], examQuestions: string[] };
export const CONTENT: ReadingContent = { toc: [{ label, page }], pages: [{ page, heading?, paragraphs: string[] }] };
export const ANNOTATIONS: Annotation[] = [ ... ];
```

- `paragraphs` must preserve the author's wording and order; split on the
  source's paragraph breaks. Page numbers are 1-based PDF pages.
- `Annotation.passage` must be an **exact substring** of its page's text — the
  reader highlights by substring match. `category` is one of
  `concept | definition | argument | scholar | exam | example | distinction`.
- Explanations are platform voice: label them as guide notes, never as quotes.
  Never fabricate quotations or page numbers; flag uncertain OCR passages.

**Step 5 — register the reading.**

Add an entry to `readings` in `src/data/readings.ts` with metadata, `topicId`,
`pdfFile`, `sourceFile`, and the content/annotation imports.

**Step 6 — link topic, cards, questions.**

Add a `Topic` with `sample: false`, `readingId`, and `source`; add flashcards
(`pageRef`, `concept`) and questions (`readingId`, `pageRef`, `concept`,
`whyWrong`) pointing at the new `topicId`.

## 5. Difficulty guidance

- **easy** — recall of a single definition, term, or fact taught directly in the notes.
- **medium** — application: compare two concepts, identify the right example, or pick the mechanism.
- **hard** — synthesis under a twist: same stem rated under rival definitions, scope conditions, or tradeoffs.

Aim for a rough 40 / 40 / 20 split per topic. Tag honestly — filters and
recommendations use this field.

## 6. Sample-flag rule

- Every illustrative topic has `sample: true` until replaced with real content.
- Flip a topic to `sample: false` only when **all** its subtopics are real.
- Reading-backed topics ship with `sample: false`, `readingId`, and `source`.

## 7. Progress storage + reset

- Key: **`polsci157.progress.v1`** in `localStorage` (see `src/store/study.tsx`).
- Shape: `{ version, cards, subtopicsRead, sessions, bookmarks, notes,
  savedConcepts, readingsComplete }`. Missing fields default to empty.
- Reset paths: in-app **Reset progress** on Study Progress, or DevTools →
  Application → Local Storage → delete the key, then reload.
- Content edits never migrate progress: deleting a card/subtopic id leaves
  orphaned state that is ignored; renaming an id resets that item's history.
