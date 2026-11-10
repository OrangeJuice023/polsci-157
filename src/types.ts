export interface Definition {
  term: string;
  definition: string;
}

export interface Scholar {
  name: string;
  contribution: string;
}

export interface Subtopic {
  id: string;
  title: string;
  summary: string;
  definitions: Definition[];
  keyArguments: string[];
  scholars: Scholar[];
  examples: string[];
  takeaways: string[];
  readingTimeMinutes: number;
}

export interface ReadingSource {
  /** Original filename preserved in source-materials/ */
  file: string;
  /** Short label, e.g. "Doc 7" */
  label: string;
}

export interface Topic {
  id: string;
  code: string;
  title: string;
  description: string;
  /** Always true until real syllabus content is supplied. */
  sample: boolean;
  /** Set when this topic is backed by an assigned reading. */
  readingId?: string;
  source?: ReadingSource;
  subtopics: Subtopic[];
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Flashcard {
  id: string;
  topicId: string;
  front: string;
  back: string;
  explanation: string;
  difficulty: Difficulty;
  /** Source page reference, e.g. "PDF p. 4". */
  pageRef?: string;
  /** Concept tag linking this card to a reading annotation. */
  concept?: string;
}

export type QuestionKind = 'mcq' | 'truefalse';

export interface QuizQuestion {
  id: string;
  topicId: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  /** Defaults to 'mcq' when omitted. truefalse uses choices ["True","False"]. */
  kind?: QuestionKind;
  readingId?: string;
  /** Source page reference, e.g. "PDF p. 4". */
  pageRef?: string;
  /** Concept tag used for weakness analysis. */
  concept?: string;
  /** Why each wrong choice is wrong, in choice order (empty string for the correct one). */
  whyWrong?: string[];
}

export type CardStatus = 'new' | 'learning' | 'mastered';

export interface CardState {
  status: CardStatus;
  reviews: number;
  correct: number;
  lastReviewedAt?: string;
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  concept?: string;
}

export interface StudySession {
  id: string;
  kind: 'flashcards' | 'quiz' | 'reading' | 'exam';
  topicId?: string;
  readingId?: string;
  startedAt: string;
  endedAt: string;
  totalItems: number;
  correctItems: number;
  timeSpentSec?: number;
  details?: QuestionResult[];
}

/* ---------- Review Center: readings & annotations ---------- */

export type HighlightCategory =
  | 'concept'
  | 'definition'
  | 'argument'
  | 'scholar'
  | 'exam'
  | 'example'
  | 'distinction';

export interface Annotation {
  id: string;
  readingId: string;
  /** 1-based PDF page number. */
  page: number;
  category: HighlightCategory;
  /** Exact passage from the source text; matched against page text. */
  passage: string;
  title: string;
  /** Plain-language explanation (platform voice, not the author). */
  explanation: string;
  whyItMatters: string;
  examAngle?: string;
  relatedConcepts: string[];
  flashcardId?: string;
}

export interface ReadingPage {
  page: number;
  heading?: string;
  paragraphs: string[];
}

export interface TocEntry {
  label: string;
  page: number;
}

export interface ReadingContent {
  toc: TocEntry[];
  pages: ReadingPage[];
}

export interface Reading {
  id: string;
  docNumber: string;
  title: string;
  author: string;
  topicId: string;
  /** URL path of the web copy, e.g. "/readings/ruland-constitutional-debate.pdf". */
  pdfFile: string;
  /** Original filename preserved in source-materials/. */
  sourceFile: string;
  totalPages: number;
  overview: string;
  thesis: string;
  takeaways: string[];
  examQuestions: string[];
  content: ReadingContent;
  annotations: Annotation[];
}

/* ---------- Personal study data ---------- */

export interface PersonalNote {
  id: string;
  readingId: string;
  page: number;
  text: string;
  quote?: string;
  createdAt: string;
}

export interface Bookmark {
  readingId: string;
  page: number;
}

export interface StudyProgress {
  version: 1;
  cards: Record<string, CardState>;
  /** subtopic ids the student marked as read */
  subtopicsRead: string[];
  sessions: StudySession[];
  bookmarks: Bookmark[];
  notes: PersonalNote[];
  /** annotation ids saved for later review */
  savedConcepts: string[];
  /** reading ids marked complete */
  readingsComplete: string[];
}

export const EMPTY_PROGRESS: StudyProgress = {
  version: 1,
  cards: {},
  subtopicsRead: [],
  sessions: [],
  bookmarks: [],
  notes: [],
  savedConcepts: [],
  readingsComplete: [],
};
