import { Link } from 'react-router-dom';
import { Badge, EmptyState, ProgressBar } from './ui';
import { KIND_LABEL, formatRecommendation } from '../utils/grading';
import type { QuestionResult, StudySession, WrittenKind } from '../types';

type FormatKey = WrittenKind | 'mcq';

interface FormatRow {
  key: FormatKey;
  label: string;
  attempts: number;
  earned: number;
  max: number;
  pct: number;
}

const WRITTEN_ORDER: WrittenKind[] = ['enumerate', 'define', 'identify', 'explain'];

function isWrittenKind(value: unknown): value is WrittenKind {
  return (
    value === 'enumerate' ||
    value === 'define' ||
    value === 'identify' ||
    value === 'explain'
  );
}

function formatPoints(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function FormatAnalytics({ sessions }: { sessions: StudySession[] }) {
  const details: QuestionResult[] = [];
  for (const s of sessions) {
    if (s.kind !== 'exam' && s.kind !== 'quiz') continue;
    for (const d of s.details ?? []) details.push(d);
  }

  if (details.length === 0) {
    return (
      <EmptyState
        title="No graded answers yet"
        description="Graded exam and quiz answers will appear here broken down by format."
      />
    );
  }

  const acc: Record<FormatKey, { attempts: number; earned: number; max: number }> = {
    enumerate: { attempts: 0, earned: 0, max: 0 },
    define: { attempts: 0, earned: 0, max: 0 },
    identify: { attempts: 0, earned: 0, max: 0 },
    explain: { attempts: 0, earned: 0, max: 0 },
    mcq: { attempts: 0, earned: 0, max: 0 },
  };

  for (const d of details) {
    const key: FormatKey = isWrittenKind(d.format) ? d.format : 'mcq';
    const earned = typeof d.points === 'number' ? d.points : d.correct ? 1 : 0;
    const max = typeof d.maxPoints === 'number' ? d.maxPoints : 1;
    acc[key].attempts += 1;
    acc[key].earned += earned;
    acc[key].max += max;
  }

  const rows: FormatRow[] = [
    ...WRITTEN_ORDER.map((kind): FormatRow => {
      const a = acc[kind];
      const pct = a.max > 0 ? (a.earned / a.max) * 100 : 0;
      return {
        key: kind,
        label: KIND_LABEL[kind],
        attempts: a.attempts,
        earned: a.earned,
        max: a.max,
        pct,
      };
    }),
    {
      key: 'mcq',
      label: 'MCQ',
      attempts: acc.mcq.attempts,
      earned: acc.mcq.earned,
      max: acc.mcq.max,
      pct: acc.mcq.max > 0 ? (acc.mcq.earned / acc.mcq.max) * 100 : 0,
    },
  ];

  let weakest: WrittenKind | null = null;
  let weakestPct = 101;
  for (const kind of WRITTEN_ORDER) {
    const a = acc[kind];
    if (a.attempts === 0 || a.max <= 0) continue;
    const pct = (a.earned / a.max) * 100;
    if (pct < 70 && pct < weakestPct) {
      weakest = kind;
      weakestPct = pct;
    }
  }

  return (
    <div>
      <div className="format-table" role="table" aria-label="Performance by format">
        {rows.map((row) => (
          <div className="format-row" role="row" key={row.key}>
            <Badge>{row.label}</Badge>
            <span className="muted">{row.attempts} answered</span>
            <span>
              {formatPoints(row.earned)}/{formatPoints(row.max)} ({Math.round(row.pct)}%)
            </span>
            <ProgressBar value={row.pct} />
          </div>
        ))}
      </div>
      {weakest !== null ? (
        <div className="notice" role="note">
          <p>{formatRecommendation(weakest)}</p>
          <Link
            className="link"
            to={`/exam/run?bank=combined&mode=practice&format=${weakest}`}
          >
            Practice {KIND_LABEL[weakest]}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
