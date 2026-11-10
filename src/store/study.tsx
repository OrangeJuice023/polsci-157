import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { EMPTY_PROGRESS, type StudyProgress, type StudySession } from '../types';
import { flashcards } from '../data/flashcards';
import { topics } from '../data/topics';

const STORAGE_KEY = 'polsci157.progress.v1';

function loadProgress(): StudyProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<StudyProgress>;
    if ((parsed as StudyProgress).version !== 1) return EMPTY_PROGRESS;
    return {
      version: 1,
      cards: parsed.cards ?? {},
      subtopicsRead: Array.isArray(parsed.subtopicsRead) ? parsed.subtopicsRead : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      savedConcepts: Array.isArray(parsed.savedConcepts) ? parsed.savedConcepts : [],
      readingsComplete: Array.isArray(parsed.readingsComplete) ? parsed.readingsComplete : [],
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

interface StudyApi {
  progress: StudyProgress;
  markCard: (cardId: string, known: boolean) => void;
  toggleSubtopicRead: (subtopicId: string) => void;
  recordSession: (s: Omit<StudySession, 'id'>) => void;
  resetProgress: () => void;
  toggleBookmark: (readingId: string, page: number) => void;
  addNote: (readingId: string, page: number, text: string, quote?: string) => void;
  deleteNote: (id: string) => void;
  toggleSavedConcept: (annotationId: string) => void;
  toggleReadingComplete: (readingId: string) => void;
  masteredCount: number;
  reviewedCount: number;
  needsReviewCount: number;
  totalSubtopics: number;
  readSubtopicsCount: number;
  overallPct: number;
}

const StudyContext = createContext<StudyApi | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<StudyProgress>(() => loadProgress());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // storage full or unavailable — keep in-memory state
    }
  }, [progress]);

  const api = useMemo<StudyApi>(() => {
    const masteredCount = flashcards.filter(
      (c) => progress.cards[c.id]?.status === 'mastered',
    ).length;
    const reviewedCount = Object.values(progress.cards).filter((c) => c.reviews > 0).length;
    const needsReviewCount = flashcards.length - masteredCount;
    const totalSubtopics = topics.reduce((n, t) => n + t.subtopics.length, 0);
    const readSubtopicsCount = progress.subtopicsRead.length;
    const cardPct = flashcards.length ? masteredCount / flashcards.length : 0;
    const readPct = totalSubtopics ? readSubtopicsCount / totalSubtopics : 0;
    const overallPct = Math.round(((cardPct + readPct) / 2) * 100);

    return {
      progress,
      masteredCount,
      reviewedCount,
      needsReviewCount,
      totalSubtopics,
      readSubtopicsCount,
      overallPct,
      markCard: (cardId, known) =>
        setProgress((p) => {
          const prev = p.cards[cardId] ?? { status: 'new', reviews: 0, correct: 0 };
          const reviews = prev.reviews + 1;
          const correct = prev.correct + (known ? 1 : 0);
          return {
            ...p,
            cards: {
              ...p.cards,
              [cardId]: {
                status: known ? (reviews >= 2 || correct >= 1 ? 'mastered' : 'learning') : 'learning',
                reviews,
                correct,
                lastReviewedAt: new Date().toISOString(),
              },
            },
          };
        }),
      toggleSubtopicRead: (subtopicId) =>
        setProgress((p) => ({
          ...p,
          subtopicsRead: p.subtopicsRead.includes(subtopicId)
            ? p.subtopicsRead.filter((id) => id !== subtopicId)
            : [...p.subtopicsRead, subtopicId],
        })),
      recordSession: (s) =>
        setProgress((p) => ({
          ...p,
          sessions: [
            { ...s, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
            ...p.sessions,
          ].slice(0, 80),
        })),
      resetProgress: () => setProgress(EMPTY_PROGRESS),
      toggleBookmark: (readingId, page) =>
        setProgress((p) => {
          const exists = p.bookmarks.some((b) => b.readingId === readingId && b.page === page);
          return {
            ...p,
            bookmarks: exists
              ? p.bookmarks.filter((b) => !(b.readingId === readingId && b.page === page))
              : [...p.bookmarks, { readingId, page }],
          };
        }),
      addNote: (readingId, page, text, quote) =>
        setProgress((p) => ({
          ...p,
          notes: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              readingId,
              page,
              text,
              ...(quote ? { quote } : {}),
              createdAt: new Date().toISOString(),
            },
            ...p.notes,
          ].slice(0, 200),
        })),
      deleteNote: (id) =>
        setProgress((p) => ({ ...p, notes: p.notes.filter((n) => n.id !== id) })),
      toggleSavedConcept: (annotationId) =>
        setProgress((p) => ({
          ...p,
          savedConcepts: p.savedConcepts.includes(annotationId)
            ? p.savedConcepts.filter((id) => id !== annotationId)
            : [...p.savedConcepts, annotationId],
        })),
      toggleReadingComplete: (readingId) =>
        setProgress((p) => ({
          ...p,
          readingsComplete: p.readingsComplete.includes(readingId)
            ? p.readingsComplete.filter((id) => id !== readingId)
            : [...p.readingsComplete, readingId],
        })),
    };
  }, [progress]);

  return <StudyContext.Provider value={api}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyApi {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
}

export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
