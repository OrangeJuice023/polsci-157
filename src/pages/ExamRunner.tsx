import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { questions } from '../data/questions';
import { writtenQuestions } from '../data/written';
import { readingById, readings } from '../data/readings';
import { topicById } from '../data/topics';
import { useStudy } from '../store/study';
import { Badge, EmptyState, PageHeader, ProgressBar } from '../components/ui';
import { DNA_BLUEPRINT, KIND_LABEL, formatRecommendation, gradeWritten } from '../utils/grading';
import type { GradeResult, QuestionResult, QuizQuestion, WrittenKind, WrittenQuestion } from '../types';

type RunMode = 'practice' | 'mock' | 'focused' | 'rapid';
type ExamFormat = 'dna' | 'enumerate' | 'define' | 'identify' | 'explain' | 'mcq' | 'mixed';
type Phase = 'interstitial' | 'running' | 'results';

type ExamItem = { t: 'choice'; q: QuizQuestion } | { t: 'written'; q: WrittenQuestion };

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

function parseMode(v: string | null): RunMode {
  return v === 'mock' || v === 'focused' || v === 'rapid' || v === 'practice' ? v : 'practice';
}

function parseFormat(v: string | null): ExamFormat {
  // 'balanced' is the Exam Center preset name for the DNA-weighted mix.
  if (v === 'balanced') return 'dna';
  return v === 'enumerate' ||
    v === 'define' ||
    v === 'identify' ||
    v === 'explain' ||
    v === 'mcq' ||
    v === 'mixed' ||
    v === 'dna'
    ? v
    : 'mixed';
}

function formatLabel(f: ExamFormat): string {
  switch (f) {
    case 'dna':
      return 'DNA mix';
    case 'mixed':
      return 'Mixed';
    case 'mcq':
      return 'Multiple choice';
    default:
      return KIND_LABEL[f];
  }
}

function enumRowCount(q: WrittenQuestion): number {
  return Math.max(1, q.expectedCount ?? q.elements.length);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function maxFor(item: ExamItem): number {
  return item.t === 'written' ? item.q.maxPoints : 1;
}

function itemFormatKey(item: ExamItem): string {
  return item.t === 'written' ? item.q.kind : 'mcq';
}

const FORMAT_ROWS: Array<{ key: string; label: string }> = [
  { key: 'enumerate', label: 'Enumerate' },
  { key: 'define', label: 'Define' },
  { key: 'identify', label: 'Identify' },
  { key: 'explain', label: 'Explain' },
  { key: 'mcq', label: 'Multiple choice' },
];

interface BankResolution {
  ok: boolean;
  label: string;
  choices: QuizQuestion[];
  written: WrittenQuestion[];
  readingId?: string;
  topicId?: string;
}

function resolveBank(bank: string, missed: Set<string>): BankResolution {
  if (bank === 'combined') {
    return {
      ok: true,
      label: 'Combined POLSCI 157',
      choices: [...questions],
      written: [...writtenQuestions],
    };
  }
  if (bank === 'missed') {
    return {
      ok: true,
      label: 'Missed questions',
      choices: questions.filter((q) => missed.has(q.id)),
      written: writtenQuestions.filter((q) => missed.has(q.id)),
    };
  }
  if (bank.startsWith('topic:')) {
    const tid = bank.slice('topic:'.length);
    const t = topicById(tid);
    if (!t) return { ok: false, label: '', choices: [], written: [] };
    return {
      ok: true,
      label: t.title,
      choices: questions.filter((q) => q.topicId === tid),
      written: writtenQuestions.filter((q) => q.topicId === tid),
      topicId: tid,
    };
  }
  if (bank !== '') {
    const r = readingById(bank);
    if (r) {
      return {
        ok: true,
        label: r.title,
        choices: questions.filter((q) => q.topicId === r.topicId),
        written: writtenQuestions.filter((q) => q.topicId === r.topicId),
        readingId: r.id,
        topicId: r.topicId,
      };
    }
  }
  return { ok: false, label: '', choices: [], written: [] };
}

function largestRemainder(weights: number[], total: number): number[] {
  const exact = weights.map((w) => w * total);
  const base = exact.map((e) => Math.floor(e));
  let rest = total - base.reduce((a, b) => a + b, 0);
  const order = exact
    .map((e, i) => ({ frac: e - Math.floor(e), i }))
    .sort((a, b) => b.frac - a.frac);
  for (const o of order) {
    if (rest <= 0) break;
    base[o.i] = (base[o.i] ?? 0) + 1;
    rest -= 1;
  }
  return base;
}

function takeCount<T>(arr: T[], countParam: string): T[] {
  if (countParam === 'all') return arr;
  const n = Number.parseInt(countParam, 10);
  if (!Number.isFinite(n) || n <= 0) return arr.slice(0, Math.min(8, arr.length));
  return arr.slice(0, Math.min(n, arr.length));
}

function orderFocused(items: ExamItem[], mode: RunMode, missed: Set<string>): ExamItem[] {
  if (mode !== 'focused') return items;
  const isMissed = (it: ExamItem): boolean => missed.has(it.q.id);
  return [...shuffled(items.filter(isMissed)), ...shuffled(items.filter((it) => !isMissed(it)))];
}

function dnaSample(
  choices: QuizQuestion[],
  written: WrittenQuestion[],
  countParam: string,
): ExamItem[] {
  const totalAvail = written.length + choices.length;
  if (totalAvail === 0) return [];
  let n = totalAvail;
  if (countParam !== 'all') {
    const p = Number.parseInt(countParam, 10);
    n = Math.min(totalAvail, Number.isFinite(p) && p > 0 ? p : 8);
  }
  const quotas = largestRemainder(
    DNA_BLUEPRINT.map((b) => b.weight),
    n,
  );
  const byKind: Record<WrittenKind, WrittenQuestion[]> = {
    enumerate: [],
    define: [],
    identify: [],
    explain: [],
  };
  for (const w of shuffled(written)) byKind[w.kind].push(w);
  const picked: WrittenQuestion[] = [];
  let shortfall = 0;
  DNA_BLUEPRINT.forEach((b, bi) => {
    const pool = byKind[b.kind];
    const want = quotas[bi] ?? 0;
    const take = Math.min(want, pool.length);
    picked.push(...pool.slice(0, take));
    shortfall += want - take;
  });
  if (shortfall > 0) {
    const used = new Set(picked.map((w) => w.id));
    const leftover = shuffled(written.filter((w) => !used.has(w.id)));
    picked.push(...leftover.slice(0, shortfall));
    shortfall -= Math.min(shortfall, leftover.length);
  }
  const mcqFill = shortfall > 0 ? shuffled(choices).slice(0, shortfall) : [];
  return shuffled([
    ...picked.map((q): ExamItem => ({ t: 'written', q })),
    ...mcqFill.map((q): ExamItem => ({ t: 'choice', q })),
  ]);
}

function ensureVariety(picked: ExamItem[], all: ExamItem[]): ExamItem[] {
  if (picked.length < 2) return picked;
  const hasChoice = picked.some((it) => it.t === 'choice');
  const hasWritten = picked.some((it) => it.t === 'written');
  if (hasChoice && hasWritten) return shuffled(picked);
  const need: ExamItem['t'] = hasChoice ? 'written' : 'choice';
  const used = new Set(picked.map((it) => it.q.id));
  const swap = shuffled(all.filter((it) => it.t === need && !used.has(it.q.id)))[0];
  if (!swap) return shuffled(picked);
  const out = [...picked];
  out[Math.floor(Math.random() * out.length)] = swap;
  return shuffled(out);
}

function buildQueue(
  choices: QuizQuestion[],
  written: WrittenQuestion[],
  format: ExamFormat,
  countParam: string,
  mode: RunMode,
  missed: Set<string>,
): ExamItem[] {
  if (mode === 'rapid') {
    const pool =
      format === 'enumerate' || format === 'define' || format === 'identify' || format === 'explain'
        ? written.filter((w) => w.kind === format)
        : written;
    return takeCount(
      shuffled(pool).map((q): ExamItem => ({ t: 'written', q })),
      countParam,
    );
  }
  if (format === 'mcq') {
    return takeCount(
      shuffled(choices).map((q): ExamItem => ({ t: 'choice', q })),
      countParam,
    );
  }
  if (format === 'enumerate' || format === 'define' || format === 'identify' || format === 'explain') {
    return orderFocused(
      takeCount(
        shuffled(written.filter((w) => w.kind === format)).map((q): ExamItem => ({
          t: 'written',
          q,
        })),
        countParam,
      ),
      mode,
      missed,
    );
  }
  if (format === 'mixed') {
    const all: ExamItem[] = [
      ...choices.map((q): ExamItem => ({ t: 'choice', q })),
      ...written.map((q): ExamItem => ({ t: 'written', q })),
    ];
    return orderFocused(ensureVariety(takeCount(shuffled(all), countParam), all), mode, missed);
  }
  return orderFocused(dnaSample(choices, written, countParam), mode, missed);
}

function gradeAllMock(
  quiz: ExamItem[],
  drafts: string[],
): { grades: Array<GradeResult | null>; points: Array<number | null> } {
  const grades: Array<GradeResult | null> = quiz.map((item, i) =>
    item.t === 'written' ? gradeWritten(item.q, drafts[i] ?? '') : null,
  );
  const points: Array<number | null> = quiz.map((item, i) =>
    item.t === 'written' ? (grades[i] as GradeResult).score : null,
  );
  return { grades, points };
}

interface RunState {
  answers: Array<number | null>;
  drafts: string[];
  enumRows: string[][];
  submitted: boolean[];
  grades: Array<GradeResult | null>;
  points: Array<number | null>;
}

function freshState(items: ExamItem[]): RunState {
  return {
    answers: new Array<number | null>(items.length).fill(null),
    drafts: new Array<string>(items.length).fill(''),
    enumRows: items.map((it) =>
      it.t === 'written' && it.q.kind === 'enumerate'
        ? new Array<string>(enumRowCount(it.q)).fill('')
        : [],
    ),
    submitted: new Array<boolean>(items.length).fill(false),
    grades: new Array<GradeResult | null>(items.length).fill(null),
    points: new Array<number | null>(items.length).fill(null),
  };
}

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatSpent(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function readingFor(q: QuizQuestion | WrittenQuestion) {
  if (q.readingId) {
    const direct = readingById(q.readingId);
    if (direct) return direct;
  }
  return readings.find((r) => r.topicId === q.topicId);
}

function pageNumber(pageRef?: string): number | null {
  if (!pageRef) return null;
  const m = pageRef.match(/(\d+)/);
  if (!m || !m[1]) return null;
  const n = Number.parseInt(m[1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function SelfRateButtons({
  max,
  auto,
  value,
  disabled,
  onRate,
}: {
  max: number;
  auto: number | null;
  value: number | null;
  disabled: boolean;
  onRate: (v: 'full' | 'half' | 'zero') => void;
}) {
  return (
    <div className="self-rate">
      <p className="muted">
        {auto !== null ? (
          <>
            Auto-estimate: {round1(auto)}/{max} pts.{' '}
          </>
        ) : null}
        {value !== null ? (
          <>
            Your rating: {round1(value)}/{max} pts.
          </>
        ) : null}
      </p>
      <div className="row">
        <button type="button" className="btn" disabled={disabled} onClick={() => onRate('full')}>
          I got it
        </button>
        <button type="button" className="btn" disabled={disabled} onClick={() => onRate('half')}>
          Partial
        </button>
        <button type="button" className="btn" disabled={disabled} onClick={() => onRate('zero')}>
          Missed
        </button>
      </div>
    </div>
  );
}

function RubricLists({ q, grade }: { q: WrittenQuestion; grade: GradeResult | null }) {
  if (!grade) return null;
  const hits = q.elements.filter((_, i) => grade.matched[i]);
  const missed = q.elements.filter((_, i) => !grade.matched[i]);
  return (
    <>
      {hits.length > 0 ? (
        <ul className="rubric-list">
          {hits.map((el) => (
            <li key={el.text} className="rubric-hit">
              <CheckCircle2 size={16} aria-hidden="true" /> {el.text}
            </li>
          ))}
        </ul>
      ) : null}
      {missed.length > 0 ? (
        <ul className="rubric-list">
          {missed.map((el) => (
            <li key={el.text} className="rubric-miss">
              <XCircle size={16} aria-hidden="true" /> {el.text}
            </li>
          ))}
        </ul>
      ) : null}
      {hits.length === 0 && missed.length === 0 ? (
        <p className="muted">No rubric elements.</p>
      ) : null}
    </>
  );
}

function ReadingRef({ q }: { q: QuizQuestion | WrittenQuestion }) {
  const r = readingFor(q);
  const pg = pageNumber(q.pageRef);
  return (
    <>
      <p className="muted">
        {q.concept ? `Concept: ${q.concept}` : null}
        {q.concept && (r || q.pageRef) ? ' · ' : null}
        {r ? r.title : null}
        {r && q.pageRef ? ` · ${q.pageRef}` : (q.pageRef ?? '')}
      </p>
      {r && pg !== null ? (
        <Link className="link" to={`/read/${r.id}?page=${pg}`}>
          Open reading p. {pg}
        </Link>
      ) : r ? (
        <Link className="link" to={`/read/${r.id}`}>
          Open reading
        </Link>
      ) : null}
    </>
  );
}

export function ExamRunner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { progress, recordSession } = useStudy();

  const bankParam = searchParams.get('bank') ?? '';
  const mode = parseMode(searchParams.get('mode'));
  const format = parseFormat(searchParams.get('format'));
  const countParam = searchParams.get('count') ?? '8';
  const rawLimit = Number.parseInt(searchParams.get('timelimit') ?? '0', 10);
  const timelimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 0;
  const rawRapid = Number.parseInt(searchParams.get('rapidsec') ?? '90', 10);
  const rapidSec = Number.isFinite(rawRapid) && rawRapid > 0 ? rawRapid : 90;
  const isMock = mode === 'mock';
  const isRapid = mode === 'rapid';

  // Snapshot missed ids once per mount so recording this run never reshuffles it.
  const missedRef = useRef<Set<string> | null>(null);
  if (missedRef.current === null) {
    const s = new Set<string>();
    for (const sess of progress.sessions) {
      for (const d of sess.details ?? []) {
        if (!d.correct) s.add(d.questionId);
      }
    }
    missedRef.current = s;
  }
  const missedIds: Set<string> = missedRef.current ?? new Set<string>();

  const base = useMemo(() => resolveBank(bankParam, missedIds), [bankParam, missedIds]);

  const initialQuiz = useMemo(
    () => buildQueue(base.choices, base.written, format, countParam, mode, missedIds),
    [base, format, mode, countParam, missedIds],
  );

  const [quiz, setQuiz] = useState<ExamItem[]>(initialQuiz);
  const [answers, setAnswers] = useState<Array<number | null>>(() => freshState(initialQuiz).answers);
  const [drafts, setDrafts] = useState<string[]>(() => freshState(initialQuiz).drafts);
  const [enumRows, setEnumRows] = useState<string[][]>(() => freshState(initialQuiz).enumRows);
  const [submitted, setSubmitted] = useState<boolean[]>(() => freshState(initialQuiz).submitted);
  const [grades, setGrades] = useState<Array<GradeResult | null>>(
    () => freshState(initialQuiz).grades,
  );
  const [finalPoints, setFinalPoints] = useState<Array<number | null>>(
    () => freshState(initialQuiz).points,
  );
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(isMock ? 'interstitial' : 'running');
  const [secondsLeft, setSecondsLeft] = useState(timelimit * 60);
  const [rapidLeft, setRapidLeft] = useState(rapidSec);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [finishedAt, setFinishedAt] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const recordedRef = useRef(false);
  const nextRef = useRef<HTMLButtonElement | null>(null);

  // All config comes from query params: a param change rebuilds the run.
  const queryKey = `${bankParam}|${mode}|${format}|${countParam}|${timelimit}|${rapidSec}`;
  useEffect(() => {
    const fresh = freshState(initialQuiz);
    setQuiz(initialQuiz);
    setAnswers(fresh.answers);
    setDrafts(fresh.drafts);
    setEnumRows(fresh.enumRows);
    setSubmitted(fresh.submitted);
    setGrades(fresh.grades);
    setFinalPoints(fresh.points);
    setIndex(0);
    setPhase(isMock ? 'interstitial' : 'running');
    setSecondsLeft(timelimit * 60);
    setRapidLeft(rapidSec);
    setStartedAt(new Date().toISOString());
    setFinishedAt(null);
    setSaved(false);
    recordedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  function earnedFor(i: number): number {
    const item = quiz[i];
    if (!item) return 0;
    const fp = finalPoints[i];
    if (fp !== null && fp !== undefined) return fp;
    if (item.t === 'choice') return answers[i] === item.q.correctIndex ? 1 : 0;
    return 0;
  }

  const current: ExamItem | undefined = quiz[index];
  const picked: number | null = answers[index] ?? null;
  const isLast = index >= quiz.length - 1;
  const writtenCount = quiz.filter((it) => it.t === 'written').length;
  const choiceCount = quiz.length - writtenCount;

  const answeredCount = quiz.filter((item, i) =>
    item.t === 'choice'
      ? answers[i] !== null && answers[i] !== undefined
      : isMock
        ? (drafts[i] ?? '').trim() !== ''
        : (submitted[i] ?? false),
  ).length;

  const runningEarned = round1(
    quiz.reduce<number>((n, item, i) => {
      if (item.t === 'choice') {
        const p = answers[i];
        return n + (p !== null && p !== undefined && p === item.q.correctIndex ? 1 : 0);
      }
      return n + ((submitted[i] ?? false) ? earnedFor(i) : 0);
    }, 0),
  );

  const earnedTotal = round1(quiz.reduce<number>((n, _, i) => n + earnedFor(i), 0));
  const maxTotal = round1(quiz.reduce<number>((n, item) => n + maxFor(item), 0));
  const pct = maxTotal > 0 ? Math.round((earnedTotal / maxTotal) * 100) : 0;
  const missedCount = quiz.filter((item, i) => earnedFor(i) < maxFor(item) * 0.6).length;
  const spentSec = finishedAt
    ? Math.max(0, Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000))
    : 0;

  const breakdown = useMemo(() => {
    const rows = FORMAT_ROWS.map((r) => ({ ...r, earned: 0, max: 0, count: 0, pct: 0 }));
    quiz.forEach((item, i) => {
      const row = rows.find((r) => r.key === itemFormatKey(item));
      if (!row) return;
      row.count += 1;
      row.max += maxFor(item);
      const fp = finalPoints[i];
      if (fp !== null && fp !== undefined) row.earned += fp;
      else if (item.t === 'choice' && answers[i] === item.q.correctIndex) row.earned += 1;
    });
    for (const row of rows) {
      row.earned = round1(row.earned);
      row.pct = row.max > 0 ? Math.round((row.earned / row.max) * 100) : 0;
    }
    return rows.filter((r) => r.count > 0);
  }, [quiz, finalPoints, answers]);

  const strongest = breakdown.length
    ? breakdown.reduce((a, b) => (b.pct > a.pct ? b : a))
    : undefined;
  const weakest = breakdown.length
    ? breakdown.reduce((a, b) => (b.pct < a.pct ? b : a))
    : undefined;

  // Countdown timer (mock mode with a limit).
  useEffect(() => {
    if (!isMock || timelimit <= 0 || phase !== 'running') return;
    const t = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [isMock, timelimit, phase]);

  // Auto-submit at 0:00 (grades written answers as estimates).
  useEffect(() => {
    if (!isMock || timelimit <= 0 || phase !== 'running' || secondsLeft > 0) return;
    const g = gradeAllMock(quiz, drafts);
    setGrades(g.grades);
    setFinalPoints(g.points);
    setSubmitted(new Array<boolean>(quiz.length).fill(true));
    setFinishedAt(new Date().toISOString());
    setPhase('results');
  }, [isMock, timelimit, phase, secondsLeft, quiz, drafts]);

  // Rapid: reset the per-question countdown on every question.
  useEffect(() => {
    setRapidLeft(rapidSec);
  }, [index, rapidSec, quiz]);

  // Rapid: tick down; on timeout auto-submit an empty answer (shows the panel).
  useEffect(() => {
    if (mode !== 'rapid' || phase !== 'running') return;
    if (submitted[index] ?? false) return;
    if (rapidLeft > 0) {
      const t = window.setInterval(() => {
        setRapidLeft((s) => (s > 0 ? s - 1 : 0));
      }, 1000);
      return () => window.clearInterval(t);
    }
    const item = quiz[index];
    if (!item || item.t !== 'written') return;
    const g = gradeWritten(item.q, '');
    setDrafts((prev) => prev.map((d, ii) => (ii === index ? '' : d)));
    setEnumRows((prev) => prev.map((rows, ii) => (ii === index ? rows.map(() => '') : rows)));
    setGrades((prev) => {
      const next = [...prev];
      next[index] = g;
      return next;
    });
    setFinalPoints((prev) => {
      const next = [...prev];
      next[index] = g.score;
      return next;
    });
    setSubmitted((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  }, [mode, phase, index, rapidLeft, submitted, quiz]);

  // Rapid: focus Next as soon as the immediate panel appears.
  useEffect(() => {
    if (mode === 'rapid' && phase === 'running' && (submitted[index] ?? false)) {
      nextRef.current?.focus();
    }
  }, [mode, phase, submitted, index]);

  // Keyboard: Ctrl/Cmd+Enter submits a written answer or advances;
  // 1-4 / Enter work for choice questions (ignored inside text inputs).
  useEffect(() => {
    if (phase !== 'running') return;
    const onKeyDown = (e: KeyboardEvent): void => {
      const item = quiz[index];
      if (!item) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (item.t === 'written') {
          if (isMock) {
            if (index < quiz.length - 1) setIndex(index + 1);
            return;
          }
          if (submitted[index] ?? false) {
            if (index >= quiz.length - 1) {
              setFinishedAt(new Date().toISOString());
              setPhase('results');
            } else {
              setIndex(index + 1);
            }
          } else {
            const g = gradeWritten(item.q, drafts[index] ?? '');
            setGrades((prev) => {
              const next = [...prev];
              next[index] = g;
              return next;
            });
            setFinalPoints((prev) => {
              const next = [...prev];
              next[index] = g.score;
              return next;
            });
            setSubmitted((prev) => {
              const next = [...prev];
              next[index] = true;
              return next;
            });
          }
        } else if (isMock) {
          if (index < quiz.length - 1) setIndex(index + 1);
        } else {
          const p = answers[index];
          if (p === null || p === undefined) return;
          if (index >= quiz.length - 1) {
            setFinishedAt(new Date().toISOString());
            setPhase('results');
          } else {
            setIndex(index + 1);
          }
        }
        return;
      }
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      if (item.t !== 'choice') return;
      if (e.key >= '1' && e.key <= '4') {
        const ci = Number(e.key) - 1;
        if (ci < 0 || ci >= item.q.choices.length) return;
        if (isMock) {
          setAnswers((prev) => {
            const next = [...prev];
            next[index] = ci;
            return next;
          });
        } else {
          setAnswers((prev) => {
            const existing = prev[index];
            if (existing !== null && existing !== undefined) return prev;
            const next = [...prev];
            next[index] = ci;
            return next;
          });
        }
      } else if (e.key === 'Enter') {
        if (isMock) {
          if (index < quiz.length - 1) setIndex(index + 1);
        } else {
          const p = answers[index];
          if (p === null || p === undefined) return;
          if (index >= quiz.length - 1) {
            setFinishedAt(new Date().toISOString());
            setPhase('results');
          } else {
            setIndex(index + 1);
          }
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, quiz, index, answers, submitted, drafts, isMock]);

  function answerChoice(ci: number): void {
    const item = quiz[index];
    if (phase !== 'running' || !item || item.t !== 'choice') return;
    if (ci < 0 || ci >= item.q.choices.length) return;
    if (isMock) {
      setAnswers((prev) => {
        const next = [...prev];
        next[index] = ci;
        return next;
      });
    } else {
      setAnswers((prev) => {
        const existing = prev[index];
        if (existing !== null && existing !== undefined) return prev;
        const next = [...prev];
        next[index] = ci;
        return next;
      });
    }
  }

  function setDraft(i: number, v: string): void {
    setDrafts((prev) => prev.map((d, ii) => (ii === i ? v : d)));
  }

  function setEnumRow(i: number, ri: number, v: string): void {
    const cur = enumRows[i] ?? [];
    const next = cur.map((c, ci) => (ci === ri ? v : c));
    setEnumRows((prev) => prev.map((r, ii) => (ii === i ? next : r)));
    setDrafts((prev) => prev.map((d, ii) => (ii === i ? next.join('\n') : d)));
  }

  function addEnumRow(i: number): void {
    const cur = enumRows[i] ?? [];
    const next = [...cur, ''];
    setEnumRows((prev) => prev.map((r, ii) => (ii === i ? next : r)));
    setDrafts((prev) => prev.map((d, ii) => (ii === i ? next.join('\n') : d)));
  }

  function submitWritten(i: number, empty = false): void {
    const item = quiz[i];
    if (!item || item.t !== 'written' || phase !== 'running') return;
    if (submitted[i] ?? false) return;
    const raw = empty ? '' : (drafts[i] ?? '');
    const g = gradeWritten(item.q, raw);
    if (empty) {
      setDrafts((prev) => prev.map((d, ii) => (ii === i ? '' : d)));
      setEnumRows((prev) => prev.map((rows, ii) => (ii === i ? rows.map(() => '') : rows)));
    }
    setGrades((prev) => {
      const next = [...prev];
      next[i] = g;
      return next;
    });
    setFinalPoints((prev) => {
      const next = [...prev];
      next[i] = g.score;
      return next;
    });
    setSubmitted((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  }

  function selfRate(i: number, v: 'full' | 'half' | 'zero'): void {
    if (saved) return;
    const item = quiz[i];
    if (!item || item.t !== 'written') return;
    const max = item.q.maxPoints;
    const pts = v === 'full' ? max : v === 'zero' ? 0 : round1(max / 2);
    setFinalPoints((prev) => {
      const next = [...prev];
      next[i] = pts;
      return next;
    });
  }

  function goNext(): void {
    if (phase !== 'running') return;
    const item = quiz[index];
    if (!item) return;
    if (isMock) {
      if (index < quiz.length - 1) setIndex(index + 1);
      return;
    }
    const done =
      item.t === 'choice'
        ? answers[index] !== null && answers[index] !== undefined
        : (submitted[index] ?? false);
    if (!done) return;
    if (index >= quiz.length - 1) {
      setFinishedAt(new Date().toISOString());
      setPhase('results');
    } else {
      setIndex(index + 1);
    }
  }

  function goPrev(): void {
    if (phase !== 'running' || !isMock) return;
    if (index > 0) setIndex(index - 1);
  }

  function submitExam(): void {
    if (phase !== 'running') return;
    const g = gradeAllMock(quiz, drafts);
    setGrades(g.grades);
    setFinalPoints(g.points);
    setSubmitted(new Array<boolean>(quiz.length).fill(true));
    setFinishedAt(new Date().toISOString());
    setPhase('results');
  }

  function finishAndSave(): void {
    if (recordedRef.current || saved || quiz.length === 0) return;
    recordedRef.current = true;
    const ended = finishedAt ?? new Date().toISOString();
    const spent = Math.max(
      0,
      Math.round((new Date(ended).getTime() - new Date(startedAt).getTime()) / 1000),
    );
    const details: QuestionResult[] = quiz.map((item, i) => {
      const max = maxFor(item);
      const pts = earnedFor(i);
      const d: QuestionResult = {
        questionId: item.q.id,
        correct: pts >= max * 0.6,
        format: item.t === 'choice' ? (item.q.kind ?? 'mcq') : item.q.kind,
        points: round1(pts),
        maxPoints: max,
      };
      if (item.q.concept) d.concept = item.q.concept;
      return d;
    });
    recordSession({
      kind: 'exam',
      ...(base.readingId ? { readingId: base.readingId } : {}),
      ...(base.topicId && !base.readingId ? { topicId: base.topicId } : {}),
      startedAt,
      endedAt: ended,
      totalItems: quiz.length,
      correctItems: details.filter((d) => d.correct).length,
      timeSpentSec: spent,
      details,
    });
    setSaved(true);
  }

  function quit(): void {
    if (window.confirm('Quit this exam? Your progress in this run will be lost.')) {
      navigate('/exam');
    }
  }

  function startMock(): void {
    setStartedAt(new Date().toISOString());
    setSecondsLeft(timelimit * 60);
    setPhase('running');
  }

  // Retry missed restarts the runner with the missed subset via local state (not URL).
  function retryMissed(): void {
    const missedItems = quiz.filter((item, i) => earnedFor(i) < maxFor(item) * 0.6);
    if (missedItems.length === 0) return;
    const next = shuffled(missedItems);
    const fresh = freshState(next);
    setQuiz(next);
    setAnswers(fresh.answers);
    setDrafts(fresh.drafts);
    setEnumRows(fresh.enumRows);
    setSubmitted(fresh.submitted);
    setGrades(fresh.grades);
    setFinalPoints(fresh.points);
    setIndex(0);
    setStartedAt(new Date().toISOString());
    setFinishedAt(null);
    setSecondsLeft(timelimit * 60);
    setRapidLeft(rapidSec);
    setSaved(false);
    recordedRef.current = false;
    setPhase('running');
  }

  const modeLabel =
    mode === 'mock' ? 'Mock exam' : mode === 'rapid' ? 'Rapid fire' : mode === 'focused' ? 'Focused' : 'Practice';

  if (!base.ok) {
    return (
      <div className="page exam-runner">
        <PageHeader
          eyebrow="Exam"
          title="Unknown exam bank"
          description={`No question bank matches "${bankParam}".`}
        />
        <EmptyState
          title="Unknown bank"
          description="This exam link is invalid. Pick an exam from the Exam Center."
          action={
            <Link className="btn primary" to="/exam">
              Back to Exam Center
            </Link>
          }
        />
      </div>
    );
  }

  if (base.choices.length === 0 && base.written.length === 0) {
    return (
      <div className="page exam-runner">
        <PageHeader eyebrow="Exam" title={base.label} description="This bank has no questions yet." />
        <EmptyState
          title="Empty bank"
          description={
            bankParam === 'missed'
              ? 'No missed questions yet — take a quiz first.'
              : 'This bank has no questions yet.'
          }
          action={
            <Link className="btn primary" to="/exam">
              Back to Exam Center
            </Link>
          }
        />
      </div>
    );
  }

  if (mode === 'rapid' && base.written.length === 0) {
    return (
      <div className="page exam-runner">
        <PageHeader
          eyebrow="Rapid fire"
          title={base.label}
          description="Rapid mode needs written questions."
        />
        <EmptyState
          title="No written questions"
          description="Rapid mode uses written (enumerate / define / identify / explain) questions, and this bank has none yet."
          action={
            <Link className="btn primary" to="/exam">
              Back to Exam Center
            </Link>
          }
        />
      </div>
    );
  }

  if (initialQuiz.length === 0) {
    return (
      <div className="page exam-runner">
        <PageHeader
          eyebrow="Exam"
          title={base.label}
          description={`No ${formatLabel(format).toLowerCase()} questions in this bank yet.`}
        />
        <EmptyState
          title="No questions"
          description={`No ${formatLabel(format).toLowerCase()} questions in this bank yet. Try another format.`}
          action={
            <Link className="btn primary" to="/exam">
              Back to Exam Center
            </Link>
          }
        />
      </div>
    );
  }

  if (phase === 'interstitial') {
    return (
      <div className="page exam-runner">
        <PageHeader
          eyebrow="Mock exam"
          title={base.label}
          description={`${quiz.length} question${quiz.length === 1 ? '' : 's'} · ${formatLabel(format)}${timelimit > 0 ? ` · ${timelimit} minute limit` : ' · no time limit'}.`}
        />
        <div className="card">
          <h2>Before you start</h2>
          <p className="muted">
            {writtenCount} written · {choiceCount} multiple-choice.
          </p>
          <ul className="instruct-list">
            <li>No feedback until you submit the exam.</li>
            <li>Unanswered questions count as wrong.</li>
            <li>Written answers are auto-graded as estimates — compare with the reference answer at review.</li>
            <li>Self-rating is available at review before you save results.</li>
            <li>Use the navigator dots to jump between questions.</li>
            {timelimit > 0 ? (
              <li>The exam auto-submits when the timer hits 0:00.</li>
            ) : (
              <li>There is no time limit — pace yourself.</li>
            )}
          </ul>
          <div className="row">
            <button type="button" className="btn primary" onClick={startMock}>
              Start exam
            </button>
            <Link className="btn" to="/exam">
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'running' && current) {
    const item = current;
    const grade = grades[index] ?? null;
    const isSubmitted = submitted[index] ?? false;
    const missedElements =
      item.t === 'written' && grade ? item.q.elements.filter((_, i) => !grade.matched[i]) : [];
    return (
      <div className="page exam-runner">
        <PageHeader
          eyebrow={modeLabel}
          title={base.label}
          description={`Question ${index + 1} of ${quiz.length}.`}
        />
        {isMock && timelimit > 0 ? (
          <p className={secondsLeft < 60 ? 'exam-timer urgent' : 'exam-timer'} role="timer">
            {formatClock(secondsLeft)}
          </p>
        ) : null}
        <div className="card quiz-q">
          <div className="card-head">
            <p>
              Question {index + 1} of {quiz.length}
            </p>
            {item.t === 'choice' ? (
              <Badge>{item.q.difficulty}</Badge>
            ) : (
              <span className="row">
                <Badge>{KIND_LABEL[item.q.kind]}</Badge>
                <Badge tone="outline">{item.q.maxPoints} pts</Badge>
              </span>
            )}
          </div>
          {!isMock ? (
            <p className="muted">{runningEarned} pts so far</p>
          ) : (
            <p className="muted">
              {answeredCount} of {quiz.length} answered
            </p>
          )}
          <ProgressBar value={answeredCount} max={quiz.length} />

          {item.t === 'choice' ? (
            <>
              <h2>{item.q.question}</h2>
              <div className="choices">
                {item.q.choices.map((choice, ci) => {
                  let cls = 'choice';
                  if (isMock) {
                    if (picked === ci) cls += ' selected';
                  } else if (picked !== null) {
                    if (ci === item.q.correctIndex) cls += ' correct';
                    else if (ci === picked) cls += ' wrong';
                    else cls += ' dim';
                  }
                  return (
                    <button
                      key={ci}
                      type="button"
                      className={cls}
                      disabled={!isMock && picked !== null}
                      onClick={() => answerChoice(ci)}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>

              {!isMock && picked !== null ? (
                <div className="quiz-feedback">
                  {picked === item.q.correctIndex ? (
                    <p>
                      <CheckCircle2 size={16} aria-hidden="true" /> Correct
                    </p>
                  ) : (
                    <p>
                      <XCircle size={16} aria-hidden="true" /> Incorrect
                    </p>
                  )}
                  <p>{item.q.explanation}</p>
                  {picked !== item.q.correctIndex && (item.q.whyWrong?.[picked] ?? '') !== '' ? (
                    <ul className="weak-list">
                      <li>{item.q.whyWrong?.[picked]}</li>
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <>
              {isRapid && !isSubmitted ? (
                <div className={rapidLeft <= 10 ? 'rapid-timer urgent' : 'rapid-timer'} role="timer">
                  <span>{rapidLeft}s left</span>
                  <ProgressBar value={rapidLeft} max={rapidSec} />
                </div>
              ) : null}
              <h2>{item.q.prompt}</h2>
              {item.q.kind === 'enumerate' && item.q.expectedCount ? (
                <p className="muted">List {item.q.expectedCount}.</p>
              ) : null}

              {item.q.kind === 'enumerate' ? (
                <div className="enum-rows">
                  {(enumRows[index] ?? []).map((row, ri) => (
                    <div key={ri} className="enum-row">
                      <span className="enum-num">{ri + 1}.</span>
                      <input
                        type="text"
                        value={row}
                        disabled={!isMock && isSubmitted}
                        onChange={(e) => setEnumRow(index, ri, e.target.value)}
                        aria-label={`Item ${ri + 1}`}
                      />
                    </div>
                  ))}
                  {!isMock && isSubmitted ? null : (
                    <button type="button" className="btn" onClick={() => addEnumRow(index)}>
                      + Add row
                    </button>
                  )}
                </div>
              ) : (
                <textarea
                  className="written-answer"
                  rows={item.q.kind === 'explain' ? 8 : 4}
                  value={drafts[index] ?? ''}
                  disabled={!isMock && isSubmitted}
                  onChange={(e) => setDraft(index, e.target.value)}
                  aria-label="Your answer"
                />
              )}

              {!isMock && !isSubmitted ? (
                <div className="row">
                  <button type="button" className="btn primary" onClick={() => submitWritten(index)}>
                    Submit answer
                  </button>
                  {isRapid ? (
                    <button type="button" className="btn" onClick={() => submitWritten(index, true)}>
                      Skip
                    </button>
                  ) : null}
                  <button type="button" className="btn" onClick={quit}>
                    Quit
                  </button>
                </div>
              ) : null}

              {!isMock && isSubmitted && grade && !isRapid ? (
                <>
                  <div className="quiz-feedback">
                    <p>
                      <strong>
                        Estimated score: {round1(grade.score)}/{grade.maxScore}
                      </strong>
                    </p>
                    <p className="muted">Estimated — compare with the reference answer.</p>
                    <RubricLists q={item.q} grade={grade} />
                    <div className="ref-answer">
                      <p>
                        <strong>Reference answer</strong>
                      </p>
                      <p>{item.q.referenceAnswer}</p>
                    </div>
                    {(item.q.acceptableAlternatives ?? []).length > 0 ? (
                      <>
                        <p>
                          <strong>Acceptable alternatives</strong>
                        </p>
                        <ul>
                          {(item.q.acceptableAlternatives ?? []).map((alt) => (
                            <li key={alt}>{alt}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {(item.q.misconceptions ?? []).length > 0 ? (
                      <>
                        <p>
                          <strong>Common misconceptions</strong>
                        </p>
                        <ul>
                          {(item.q.misconceptions ?? []).map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    <p>{item.q.explanation}</p>
                    <ReadingRef q={item.q} />
                    <SelfRateButtons
                      max={item.q.maxPoints}
                      auto={grade.score}
                      value={finalPoints[index] ?? null}
                      disabled={false}
                      onRate={(v) => selfRate(index, v)}
                    />
                  </div>
                  <div className="row">
                    <button type="button" className="btn primary" onClick={goNext}>
                      {isLast ? 'See results' : 'Next'} <ArrowRight size={16} aria-hidden="true" />
                    </button>
                    <button type="button" className="btn" onClick={quit}>
                      Quit
                    </button>
                  </div>
                </>
              ) : null}

              {!isMock && isSubmitted && grade && isRapid ? (
                <>
                  <div className="quiz-feedback">
                    <p>
                      <strong>Reference answer</strong>
                    </p>
                    <div className="ref-answer">
                      <p>{item.q.referenceAnswer}</p>
                    </div>
                    <p>
                      <strong>Essential points</strong>
                    </p>
                    <ul className="rubric-list">
                      {item.q.elements.map((el) => (
                        <li key={el.text}>{el.text}</li>
                      ))}
                    </ul>
                    {missedElements.length > 0 ? (
                      <>
                        <p>
                          <strong>Missing from your answer</strong>
                        </p>
                        <ul className="rubric-list">
                          {missedElements.map((el) => (
                            <li key={el.text} className="rubric-miss">
                              <XCircle size={16} aria-hidden="true" /> {el.text}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="muted">All essential points covered.</p>
                    )}
                    <ReadingRef q={item.q} />
                  </div>
                  <div className="row">
                    <button ref={nextRef} type="button" className="btn primary" onClick={goNext}>
                      {isLast ? 'See results' : 'Next'} <ArrowRight size={16} aria-hidden="true" />
                    </button>
                    <button type="button" className="btn" onClick={quit}>
                      Quit
                    </button>
                  </div>
                </>
              ) : null}
            </>
          )}

          {isMock ? (
            <div className="q-dots" role="group" aria-label="Question navigator">
              {quiz.map((it, qi) => {
                const answered =
                  it.t === 'choice'
                    ? answers[qi] !== null && answers[qi] !== undefined
                    : (drafts[qi] ?? '').trim() !== '';
                return (
                  <button
                    key={it.q.id}
                    type="button"
                    className={`q-dot${qi === index ? ' current' : ''}${answered ? ' answered' : ''}`}
                    onClick={() => setIndex(qi)}
                    aria-label={`Go to question ${qi + 1}`}
                  >
                    {qi + 1}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="row">
            {isMock ? (
              <>
                <button type="button" className="btn" onClick={goPrev} disabled={index === 0}>
                  Previous
                </button>
                <button type="button" className="btn" onClick={goNext} disabled={isLast}>
                  Next
                </button>
                <button type="button" className="btn primary" onClick={submitExam}>
                  Submit exam <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button type="button" className="btn" onClick={quit}>
                  Quit
                </button>
              </>
            ) : item.t === 'choice' ? (
              <>
                <button
                  type="button"
                  className="btn primary"
                  onClick={goNext}
                  disabled={picked === null}
                >
                  {isLast ? 'See results' : 'Next'} <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button type="button" className="btn" onClick={quit}>
                  Quit
                </button>
              </>
            ) : null}
          </div>
          {item.t === 'choice' ? (
            <p className="muted">Press 1–4 to answer, Enter for next.</p>
          ) : isMock ? (
            <p className="muted">Ctrl+Enter (Cmd+Enter on Mac) for next question.</p>
          ) : (
            <p className="muted">Ctrl+Enter (Cmd+Enter on Mac) to submit, then again for next.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page exam-runner">
      <PageHeader
        eyebrow={modeLabel}
        title={`${base.label} — results`}
        description={
          saved ? 'Results saved. Review every question below.' : 'Adjust self-ratings, then finish & save.'
        }
      />
      <div className="card exam-results">
        <p className="score-ring">{pct}%</p>
        <p>
          {earnedTotal} / {maxTotal} pts · {formatSpent(spentSec)}
        </p>

        <div className="format-bars">
          {breakdown.map((b) => (
            <div key={b.key}>
              <p className="muted">
                {b.label} — {b.earned}/{b.max} ({b.pct}%)
              </p>
              <ProgressBar value={b.earned} max={b.max} />
            </div>
          ))}
        </div>
        {strongest ? (
          <p className="muted">
            Strongest: {strongest.label} ({strongest.pct}%)
          </p>
        ) : null}
        {weakest && breakdown.length > 1 ? (
          <p className="muted">
            Weakest: {weakest.label} ({weakest.pct}%)
          </p>
        ) : null}
        {weakest && weakest.key !== 'mcq' ? (
          <p className="muted">{formatRecommendation(weakest.key as WrittenKind)}</p>
        ) : null}

        {!saved ? (
          <div className="row">
            <button type="button" className="btn primary" onClick={finishAndSave}>
              Finish & save results
            </button>
          </div>
        ) : (
          <p className="muted">Saved — ratings are locked.</p>
        )}

        <div className="quiz-review">
          <h2>Full review</h2>
          {quiz.map((it, i) => {
            if (it.t === 'written') {
              const wq = it.q;
              const g = grades[i] ?? null;
              const max = maxFor(it);
              const earned = earnedFor(i);
              const ok = earned >= max * 0.6;
              const mine = drafts[i] ?? '';
              return (
                <div key={wq.id} className="review-item">
                  <p>
                    <Badge>{KIND_LABEL[wq.kind]}</Badge>{' '}
                    {ok ? <Badge tone="green">Correct</Badge> : <Badge tone="red">Needs work</Badge>}
                  </p>
                  <p>
                    <strong>{wq.prompt}</strong>
                  </p>
                  <p className="muted">Your answer:</p>
                  <p className="answer-verbatim">{mine.trim() !== '' ? mine : 'No answer'}</p>
                  <p>
                    Estimated: {g ? `${round1(g.score)}/${g.maxScore}` : '—'} · Self-rated:{' '}
                    {round1(earned)}/{max}
                  </p>
                  <RubricLists q={wq} grade={g} />
                  <div className="ref-answer">
                    <p>
                      <strong>Reference answer</strong>
                    </p>
                    <p>{wq.referenceAnswer}</p>
                  </div>
                  <p className="muted">{wq.explanation}</p>
                  <ReadingRef q={wq} />
                  <SelfRateButtons
                    max={max}
                    auto={g ? g.score : null}
                    value={finalPoints[i] ?? null}
                    disabled={saved}
                    onRate={(v) => selfRate(i, v)}
                  />
                </div>
              );
            }
            const q = it.q;
            const mine = answers[i] ?? null;
            const ok = mine === q.correctIndex;
            const wrongReasons = (q.whyWrong ?? [])
              .map((reason, ci) => ({ reason, ci }))
              .filter((e) => e.reason !== '' && e.ci !== q.correctIndex);
            return (
              <div key={q.id} className="review-item">
                <p>{ok ? <Badge tone="green">Correct</Badge> : <Badge tone="red">Incorrect</Badge>}</p>
                <p>
                  <strong>{q.question}</strong>
                </p>
                <p>Your answer: {mine !== null ? (q.choices[mine] ?? '—') : 'No answer'}</p>
                <p>Correct answer: {q.choices[q.correctIndex] ?? '—'}</p>
                <p>Points: {ok ? 1 : 0}/1</p>
                <p className="muted">{q.explanation}</p>
                {wrongReasons.length > 0 ? (
                  <ul className="weak-list">
                    {wrongReasons.map((e) => (
                      <li key={e.ci}>
                        {q.choices[e.ci] ?? ''} — {e.reason}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <ReadingRef q={q} />
              </div>
            );
          })}
        </div>

        <div className="row">
          {missedCount > 0 ? (
            <button type="button" className="btn primary" onClick={retryMissed}>
              Retry missed ({missedCount})
            </button>
          ) : null}
          <Link className="btn" to="/exam">
            New exam
          </Link>
          {base.readingId ? (
            <Link className="btn" to={`/read/${base.readingId}`}>
              Review reading
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
