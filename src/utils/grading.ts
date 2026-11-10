import type { GradeResult, WrittenQuestion } from '../types';

/** Normalize free text for transparent rubric matching. */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Grade a written answer against its rubric.
 * An element matches when ANY of its match terms appears in the answer.
 * Scoring is deliberately transparent and always labeled an estimate in the UI:
 * Andrea compares against the reference answer and can override via self-rating.
 */
export function gradeWritten(q: WrittenQuestion, rawAnswer: string): GradeResult {
  const answer = normalizeAnswer(rawAnswer);
  const matched = q.elements.map((el) => {
    if (answer.length < 2) return false;
    return el.match.some((term) => {
      const t = normalizeAnswer(term);
      return t.length > 1 && answer.includes(t);
    });
  });
  const hits = matched.filter(Boolean).length;
  const total = q.elements.length;
  const score =
    total === 0 ? 0 : Math.round((hits / total) * q.maxPoints * 10) / 10;
  return { score, maxScore: q.maxPoints, matched, estimated: true as const };
}

/** Split an enumerate response (one item per line) into trimmed items. */
export function splitListItems(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\d+[.)\]-]?|[-*•])\s*/, '').trim())
    .filter((line) => line.length > 0);
}

export const KIND_LABEL: Record<WrittenQuestion['kind'], string> = {
  enumerate: 'Enumerate',
  define: 'Define',
  identify: 'Identify',
  explain: 'Explain',
};

export const KIND_POINTS: Record<WrittenQuestion['kind'], number> = {
  enumerate: 5,
  define: 4,
  identify: 2,
  explain: 5,
};

/** Default DNA exam blueprint weights (preparation default, not the professor's format). */
export const DNA_BLUEPRINT: Array<{ kind: WrittenQuestion['kind']; weight: number }> = [
  { kind: 'enumerate', weight: 0.25 },
  { kind: 'define', weight: 0.25 },
  { kind: 'identify', weight: 0.2 },
  { kind: 'explain', weight: 0.3 },
];

/** Targeted follow-up recommendation per written format. */
export function formatRecommendation(kind: WrittenQuestion['kind']): string {
  switch (kind) {
    case 'enumerate':
      return 'Prioritize complete lists, classifications, and frameworks in the reading notes.';
    case 'define':
      return 'Prioritize terminology and conceptual precision — drill definitions as flashcards.';
    case 'identify':
      return 'Prioritize associations between scholars, arguments, concepts, and institutions.';
    case 'explain':
      return 'Review the author’s arguments and practice written explanations from memory.';
  }
}
