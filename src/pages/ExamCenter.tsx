import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { questions } from '../data/questions';
import { writtenQuestions } from '../data/written';
import { readingById, readings } from '../data/readings';
import { topicById } from '../data/topics';
import { useStudy } from '../store/study';
import { Badge, EmptyState, PageHeader } from '../components/ui';
import { DNA_BLUEPRINT, KIND_LABEL } from '../utils/grading';
import type { StudySession, WrittenKind } from '../types';

type ExamMode = 'practice' | 'mock' | 'focused';
type CountSel = '5' | '10' | 'all';
type DnaCountSel = '5' | '10' | '15' | 'all';
type RapidCountSel = '5' | '10';
type FormatPreset =
  | 'balanced'
  | 'enumerate'
  | 'define'
  | 'identify'
  | 'explain'
  | 'mcq'
  | 'mixed';

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

const DNA_COUNTS: Array<{ value: DnaCountSel; label: string }> = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '15', label: '15' },
  { value: 'all', label: 'All' },
];

const RAPID_COUNTS: Array<{ value: RapidCountSel; label: string }> = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
];

const PRESETS: Array<{ value: FormatPreset; label: string }> = [
  { value: 'balanced', label: 'DNA Balanced' },
  { value: 'enumerate', label: 'Enumeration drill' },
  { value: 'define', label: 'Definition drill' },
  { value: 'identify', label: 'Identification drill' },
  { value: 'explain', label: 'Explanation drill' },
  { value: 'mcq', label: 'MCQ supplementary' },
  { value: 'mixed', label: 'Mixed all' },
];

const FORMAT_ONE_LINERS: Record<WrittenKind, string> = {
  enumerate: 'List the elements, types, or steps of a concept.',
  define: 'State the precise meaning of a key term.',
  identify: 'Name the scholar, concept, or institution described.',
  explain: 'Explain an argument or mechanism in your own words.',
};

const BANK_OPTIONS: Array<{ value: string; label: string }> = [
  ...readings.map((r) => ({ value: r.id, label: r.title })),
  { value: 'combined', label: 'Combined POLSCI 157' },
  { value: 'missed', label: 'Missed questions' },
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

function HowToUseSection() {
  return (
    <details className="howto" aria-label="How to use this page">
      <summary>How to use this page</summary>
      <div className="howto-body">
        <p>
          This center asks <strong>questions only</strong> — no flashcards here.
          Every exam mixes as many of the six formats as the bank allows:
        </p>
        <ul>
          <li><strong>Enumerate</strong> — list the elements, types, or steps of a concept.</li>
          <li><strong>Define</strong> — state the precise meaning of a key term.</li>
          <li><strong>Identify</strong> — name the scholar, concept, or institution described.</li>
          <li><strong>Explain</strong> — explain an argument or mechanism in your own words.</li>
          <li><strong>Multiple choice</strong> — pick the best answer; wrong options are explained.</li>
          <li><strong>True / False</strong> — judge a claim about the readings.</li>
        </ul>
        <p><strong>Pick a mode:</strong></p>
        <ul>
          <li><strong>Practice</strong> — feedback and explanations after every question.</li>
          <li><strong>Mock exam</strong> — real-exam conditions: no feedback until you submit (optional time limit).</li>
          <li><strong>Focused</strong> — questions you previously missed come first.</li>
          <li><strong>Rapid Recall</strong> — timed written drill, one clock per question.</li>
        </ul>
        <p><strong>Scoring:</strong> choice questions are auto-scored.
          Written answers get an automatic rubric estimate, then you confirm or
          adjust your own score before saving — one saved record per exam.</p>
        <p><strong>Suggested flow:</strong> run a per-reading mock → check the
          Progress page for your weakest format → drill it with a DNA preset →
          finish with Rapid Recall.</p>
      </div>
    </details>
  );
}

function DnaBlueprintSection() {
  const [preset, setPreset] = useState<FormatPreset>('balanced');
  const [bank, setBank] = useState<string>('combined');
  const [mode, setMode] = useState<ExamMode>('mock');
  const [countSel, setCountSel] = useState<DnaCountSel>('10');
  const [timelimit, setTimelimit] = useState<string>('0');
  const href =
    `/exam/run?bank=${encodeURIComponent(bank)}&mode=${mode}` +
    `&format=${preset}&count=${countSel}&timelimit=${timelimit}`;

  return (
    <section className="dna-blueprint" aria-labelledby="dna-title">
      <h2 id="dna-title">Exam DNA blueprint</h2>
      <p className="muted">
        The professor&apos;s written exam uses four formats. Pick a preset to drill one
        format or a balanced mix of all four.
      </p>
      <ul className="dna-weights">
        {DNA_BLUEPRINT.map((entry) => (
          <li key={entry.kind}>
            <strong>{KIND_LABEL[entry.kind]}</strong>
            {' — '}
            {FORMAT_ONE_LINERS[entry.kind]}{' '}
            <span className="muted">· default {Math.round(entry.weight * 100)}%</span>
          </li>
        ))}
      </ul>
      <p className="muted">
        Weights 25/25/20/30 are a preparation default, not the professor&apos;s exact format.
      </p>

      <div className="preset-row" role="group" aria-label="Format preset">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={p.value === preset ? 'chip active' : 'chip'}
            aria-pressed={p.value === preset}
            onClick={() => setPreset(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="row">
        <label className="muted">
          Bank{' '}
          <select
            className="select"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            aria-label="DNA blueprint bank"
          >
            {BANK_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="muted">
          Time limit{' '}
          <select
            className="select"
            value={timelimit}
            onChange={(e) => setTimelimit(e.target.value)}
            aria-label="DNA blueprint mock time limit"
          >
            <option value="0">No limit</option>
            <option value="10">10 min</option>
            <option value="20">20 min</option>
            <option value="30">30 min</option>
          </select>
        </label>
      </div>

      <div className="mode-picker" role="group" aria-label="DNA blueprint mode">
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

      <div className="chip-row" role="group" aria-label="DNA blueprint question count">
        {DNA_COUNTS.map((c) => (
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

      <div className="row">
        <Link className="btn primary" to={href}>
          Start
        </Link>
      </div>
    </section>
  );
}

function RapidRecallSection() {
  const [bank, setBank] = useState<string>('combined');
  const [countSel, setCountSel] = useState<RapidCountSel>('5');
  const [perq, setPerq] = useState<string>('60');
  const href =
    `/exam/run?bank=${encodeURIComponent(bank)}&mode=rapid&format=mixed` +
    `&count=${countSel}&timelimit=0&rapidsec=${perq}`;

  return (
    <section className="rapid-box" aria-labelledby="rapid-title">
      <h2 id="rapid-title">Rapid Recall</h2>
      <p className="muted">
        Timed drill: answer each question before the per-question clock runs out.
      </p>
      <div className="row">
        <label className="muted">
          Bank{' '}
          <select
            className="select"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            aria-label="Rapid recall bank"
          >
            {BANK_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="muted">
          Seconds per question{' '}
          <select
            className="select"
            value={perq}
            onChange={(e) => setPerq(e.target.value)}
            aria-label="Rapid recall seconds per question"
          >
            <option value="60">60s</option>
            <option value="90">90s</option>
            <option value="120">120s</option>
          </select>
        </label>
      </div>
      <div className="chip-row" role="group" aria-label="Rapid recall question count">
        {RAPID_COUNTS.map((c) => (
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
      <div className="row">
        <Link className="btn primary" to={href}>
          Start rapid
        </Link>
      </div>
    </section>
  );
}

function ExamCard({
  title,
  description,
  bank,
  choiceCount,
  writtenCount,
  emptyNote,
  defaultMode,
}: {
  title: string;
  description: string;
  bank: string;
  choiceCount: number;
  writtenCount: number;
  emptyNote?: string;
  defaultMode: ExamMode;
}) {
  const [mode, setMode] = useState<ExamMode>(defaultMode);
  const [countSel, setCountSel] = useState<CountSel>('5');
  const [timelimit, setTimelimit] = useState('0');
  const total = choiceCount + writtenCount;
  const est = Math.ceil(total * 1.2);
  const empty = total === 0;
  const href = `/exam/run?bank=${encodeURIComponent(bank)}&mode=${mode}&count=${countSel}&timelimit=${timelimit}`;

  return (
    <div className="exam-card">
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      <p className="muted">
        {empty
          ? '0 questions'
          : `${choiceCount} choice + ${writtenCount} written · ~${est} min`}
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
  const missedChoice = useMemo(
    () => questions.filter((q) => missedIds.has(q.id)).length,
    [missedIds],
  );
  const missedWritten = useMemo(
    () => writtenQuestions.filter((q) => missedIds.has(q.id)).length,
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

      <HowToUseSection />

      <DnaBlueprintSection />

      <div className="exam-grid">
        {readings.map((r) => {
          const choiceCount = questions.filter((q) => q.topicId === r.topicId).length;
          const writtenCount = writtenQuestions.filter(
            (q) => q.readingId === r.id || q.topicId === r.topicId,
          ).length;
          return (
            <ExamCard
              key={r.id}
              title={r.title}
              description={r.author}
              bank={r.id}
              choiceCount={choiceCount}
              writtenCount={writtenCount}
              defaultMode="mock"
            />
          );
        })}
        <ExamCard
          title="Combined POLSCI 157"
          description="Every question in the bank."
          bank="combined"
          choiceCount={questions.length}
          writtenCount={writtenQuestions.length}
          defaultMode="mock"
        />
        <ExamCard
          title="Focused review"
          description="Drill questions you previously missed, missed-first."
          bank="missed"
          choiceCount={missedChoice}
          writtenCount={missedWritten}
          emptyNote="Take a quiz first — your misses will appear here."
          defaultMode="focused"
        />
        <ExamCard
          title="Incorrect remediation"
          description="Remediation pool: every question you have ever answered incorrectly."
          bank="missed"
          choiceCount={missedChoice}
          writtenCount={missedWritten}
          emptyNote="Take a quiz first — your misses will appear here."
          defaultMode="practice"
        />
      </div>

      <RapidRecallSection />

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
