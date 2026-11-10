import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { questions } from '../data/questions';
import { readingById, readings } from '../data/readings';
import { topicById } from '../data/topics';
import { useStudy } from '../store/study';
import { Badge, EmptyState, PageHeader } from '../components/ui';
import type { StudySession } from '../types';

type ExamMode = 'practice' | 'mock' | 'focused';
type CountSel = '5' | '10' | 'all';

const MODES: Array<{ value: ExamMode; label: string }> = [
  { value: 'practice', label: 'Practice' },
  { value: 'mock', label: 'Mock exam' },
  { value: 'focused', label: 'Focused' },
];

const COUNTS: Array<{ value: CountSel; label: string }> = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: 'all', label: 'All' },
];

function missedIdsFrom(sessions: StudySession[]): Set<string> {
  const ids = new Set<string>();
  for (const s of sessions) {
    for (const d of s.details ?? []) {
      if (!d.correct) ids.add(d.questionId);
    }
  }
  return ids;
}

function formatDuration(sec?: number): string {
  if (sec === undefined || !Number.isFinite(sec)) return '—';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function bankLabelFor(s: StudySession): string {
  if (s.readingId) return readingById(s.readingId)?.title ?? s.readingId;
  if (s.topicId) return topicById(s.topicId)?.title ?? s.topicId;
  return 'Combined POLSCI 157';
}

function retakeHref(s: StudySession): string {
  const bank = s.readingId ?? (s.topicId ? `topic:${s.topicId}` : 'combined');
  const mode: ExamMode = s.kind === 'exam' ? 'mock' : 'practice';
  return `/exam/run?bank=${encodeURIComponent(bank)}&mode=${mode}&count=${s.totalItems}&timelimit=0`;
}

function ExamCard({
  title,
  description,
  bank,
  count,
  emptyNote,
  defaultMode,
}: {
  title: string;
  description: string;
  bank: string;
  count: number;
  emptyNote?: string;
  defaultMode: ExamMode;
}) {
  const [mode, setMode] = useState<ExamMode>(defaultMode);
  const [countSel, setCountSel] = useState<CountSel>('5');
  const [timelimit, setTimelimit] = useState('0');
  const est = Math.ceil(count * 1.2);
  const empty = count === 0;
  const href = `/exam/run?bank=${encodeURIComponent(bank)}&mode=${mode}&count=${countSel}&timelimit=${timelimit}`;

  return (
    <div className="exam-card">
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      <p className="muted">
        {empty ? '0 questions' : `${count} question${count === 1 ? '' : 's'} · ~${est} min`}
      </p>
      {empty && emptyNote ? <p className="muted">{emptyNote}</p> : null}
      <div className="mode-picker" role="group" aria-label={`${title} mode`}>
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            className={m.value === mode ? 'chip active' : 'chip'}
            aria-pressed={m.value === mode}
            onClick={() => setMode(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="chip-row" role="group" aria-label={`${title} question count`}>
        {COUNTS.map((c) => (
          <button
            key={c.value}
            type="button"
            className={c.value === countSel ? 'chip active' : 'chip'}
            aria-pressed={c.value === countSel}
            onClick={() => setCountSel(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
      <label className="muted">
        Time limit{' '}
        <select
          className="select"
          value={timelimit}
          onChange={(e) => setTimelimit(e.target.value)}
          aria-label={`${title} mock time limit`}
        >
          <option value="0">No limit</option>
          <option value="10">10 min</option>
          <option value="20">20 min</option>
          <option value="30">30 min</option>
        </select>
      </label>
      <div className="row">
        {empty ? (
          <button type="button" className="btn primary" disabled>
            Start
          </button>
        ) : (
          <Link className="btn primary" to={href}>
            Start
          </Link>
        )}
      </div>
    </div>
  );
}

export function ExamCenter() {
  const { progress } = useStudy();
  const missedIds = useMemo(() => missedIdsFrom(progress.sessions), [progress.sessions]);
  const missedCount = useMemo(
    () => questions.filter((q) => missedIds.has(q.id)).length,
    [missedIds],
  );
  const attempts = useMemo(
    () => progress.sessions.filter((s) => s.kind === 'exam' || s.kind === 'quiz'),
    [progress.sessions],
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Exam"
        title="Exam Center"
        description="Per-reading mocks, the combined bank, and remediation built from your misses."
      />

      <div className="exam-grid">
        {readings.map((r) => {
          const count = questions.filter((q) => q.topicId === r.topicId).length;
          return (
            <ExamCard
              key={r.id}
              title={r.title}
              description={r.author}
              bank={r.id}
              count={count}
              defaultMode="mock"
            />
          );
        })}
        <ExamCard
          title="Combined POLSCI 157"
          description="Every question in the bank."
          bank="combined"
          count={questions.length}
          defaultMode="mock"
        />
        <ExamCard
          title="Focused review"
          description="Drill questions you previously missed, missed-first."
          bank="missed"
          count={missedCount}
          emptyNote="Take a quiz first — your misses will appear here."
          defaultMode="focused"
        />
        <ExamCard
          title="Incorrect remediation"
          description="Remediation pool: every question you have ever answered incorrectly."
          bank="missed"
          count={missedCount}
          emptyNote="Take a quiz first — your misses will appear here."
          defaultMode="practice"
        />
      </div>

      <h2 className="section-title">Previously attempted</h2>
      {attempts.length === 0 ? (
        <EmptyState
          title="No attempts yet"
          description="Finished quizzes and exams will appear here with scores and retake links."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bank</th>
                <th>Score</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((s) => {
                const pct = s.totalItems ? Math.round((s.correctItems / s.totalItems) * 100) : 0;
                return (
                  <tr key={s.id}>
                    <td>{new Date(s.startedAt).toLocaleString()}</td>
                    <td>
                      {bankLabelFor(s)} <Badge>{s.kind}</Badge>
                    </td>
                    <td>
                      {s.correctItems}/{s.totalItems} ({pct}%)
                    </td>
                    <td>{formatDuration(s.timeSpentSec)}</td>
                    <td>
                      <Link className="link" to={retakeHref(s)}>Retake</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
