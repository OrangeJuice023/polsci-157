import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { questions } from '../data/questions';
import { readingById, readings } from '../data/readings';
import { topicById } from '../data/topics';
import { useStudy } from '../store/study';
import { Badge, EmptyState, PageHeader, ProgressBar } from '../components/ui';
import type { QuizQuestion } from '../types';

type RunMode = 'practice' | 'mock' | 'focused';
type Phase = 'interstitial' | 'running' | 'results';

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
  return v === 'mock' || v === 'focused' || v === 'practice' ? v : 'practice';
}

interface BankResolution {
  ok: boolean;
  label: string;
  list: QuizQuestion[];
  readingId?: string;
  topicId?: string;
}

function resolveBank(bank: string, missed: Set<string>): BankResolution {
  if (bank === 'combined') {
    return { ok: true, label: 'Combined POLSCI 157', list: [...questions] };
  }
  if (bank === 'missed') {
    return { ok: true, label: 'Missed questions', list: questions.filter((q) => missed.has(q.id)) };
  }
  if (bank.startsWith('topic:')) {
    const tid = bank.slice('topic:'.length);
    const t = topicById(tid);
    if (!t) return { ok: false, label: '', list: [] };
    return {
      ok: true,
      label: t.title,
      list: questions.filter((q) => q.topicId === tid),
      topicId: tid,
    };
  }
  if (bank !== '') {
    const r = readingById(bank);
    if (r) {
      return {
        ok: true,
        label: r.title,
        list: questions.filter((q) => q.topicId === r.topicId),
        readingId: r.id,
        topicId: r.topicId,
      };
    }
  }
  return { ok: false, label: '', list: [] };
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

function readingFor(q: QuizQuestion) {
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

export function ExamRunner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { progress, recordSession } = useStudy();

  const bankParam = searchParams.get('bank') ?? '';
  const mode = parseMode(searchParams.get('mode'));
  const countParam = searchParams.get('count') ?? 'all';
  const rawLimit = Number.parseInt(searchParams.get('timelimit') ?? '0', 10);
  const timelimit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 0;
  const isMock = mode === 'mock';

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

  const initialQuiz = useMemo(() => {
    if (!base.ok) return [];
    const ordered: QuizQuestion[] =
      mode === 'focused'
        ? [
            ...shuffled(base.list.filter((q) => missedIds.has(q.id))),
            ...shuffled(base.list.filter((q) => !missedIds.has(q.id))),
          ]
        : shuffled(base.list);
    if (countParam === 'all') return ordered;
    const n = Number.parseInt(countParam, 10);
    if (!Number.isFinite(n) || n <= 0) return ordered;
    return ordered.slice(0, Math.min(n, ordered.length));
  }, [base, mode, countParam, missedIds]);

  const [quiz, setQuiz] = useState<QuizQuestion[]>(initialQuiz);
  const [answers, setAnswers] = useState<Array<number | null>>(
    () => new Array<number | null>(initialQuiz.length).fill(null),
  );
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(isMock ? 'interstitial' : 'running');
  const [secondsLeft, setSecondsLeft] = useState(timelimit * 60);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [finishedAt, setFinishedAt] = useState<string | null>(null);
  const recordedRef = useRef(false);

  // All config comes from query params: a param change rebuilds the run.
  const queryKey = `${bankParam}|${mode}|${countParam}|${timelimit}`;
  useEffect(() => {
    setQuiz(initialQuiz);
    setAnswers(new Array<number | null>(initialQuiz.length).fill(null));
    setIndex(0);
    setPhase(isMock ? 'interstitial' : 'running');
    setSecondsLeft(timelimit * 60);
    setStartedAt(new Date().toISOString());
    setFinishedAt(null);
    recordedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  const current: QuizQuestion | undefined = quiz[index];
  const picked: number | null = answers[index] ?? null;
  const answeredCount = answers.filter((a) => a !== null).length;
  const isLast = index >= quiz.length - 1;

  const correctTotal = quiz.reduce<number>(
    (n, q, i) => n + (answers[i] === q.correctIndex ? 1 : 0),
    0,
  );
  const incorrectTotal = quiz.length - correctTotal;
  const pct = quiz.length ? Math.round((correctTotal / quiz.length) * 100) : 0;
  const spentSec = finishedAt
    ? Math.max(0, Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000))
    : 0;

  const breakdown = useMemo(() => {
    const map = new Map<string, { topicId: string; total: number; correct: number }>();
    quiz.forEach((q, i) => {
      const e = map.get(q.topicId) ?? { topicId: q.topicId, total: 0, correct: 0 };
      e.total += 1;
      if (answers[i] === q.correctIndex) e.correct += 1;
      map.set(q.topicId, e);
    });
    return [...map.values()].map((e) => ({
      ...e,
      pct: e.total ? Math.round((e.correct / e.total) * 100) : 0,
    }));
  }, [quiz, answers]);

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

  // Auto-submit at 0:00.
  useEffect(() => {
    if (isMock && timelimit > 0 && phase === 'running' && secondsLeft <= 0) {
      setFinishedAt(new Date().toISOString());
      setPhase('results');
    }
  }, [isMock, timelimit, phase, secondsLeft]);

  // Record exactly one session per finished run.
  useEffect(() => {
    if (phase !== 'results' || quiz.length === 0) return;
    if (recordedRef.current) return;
    recordedRef.current = true;
    const ended = finishedAt ?? new Date().toISOString();
    const spent = Math.max(
      0,
      Math.round((new Date(ended).getTime() - new Date(startedAt).getTime()) / 1000),
    );
    recordSession({
      kind: 'exam',
      ...(base.readingId ? { readingId: base.readingId } : {}),
      ...(base.topicId && !base.readingId ? { topicId: base.topicId } : {}),
      startedAt,
      endedAt: ended,
      totalItems: quiz.length,
      correctItems: correctTotal,
      timeSpentSec: spent,
      details: quiz.map((q, i) => {
        const d: { questionId: string; correct: boolean; concept?: string } = {
          questionId: q.id,
          correct: answers[i] === q.correctIndex,
        };
        if (q.concept) d.concept = q.concept;
        return d;
      }),
    });
  }, [phase, quiz, answers, startedAt, finishedAt, correctTotal, recordSession, base.readingId, base.topicId]);

  // Keyboard: 1-4 select a choice, Enter advances.
  useEffect(() => {
    if (phase !== 'running') return;
    const onKeyDown = (e: KeyboardEvent): void => {
      const q = quiz[index];
      if (!q) return;
      if (e.key >= '1' && e.key <= '4') {
        const ci = Number(e.key) - 1;
        if (ci < 0 || ci >= q.choices.length) return;
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
  }, [phase, quiz, index, answers, isMock]);

  function answer(ci: number): void {
    const q = quiz[index];
    if (phase !== 'running' || !q) return;
    if (ci < 0 || ci >= q.choices.length) return;
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

  function goNext(): void {
    if (phase !== 'running') return;
    if (!isMock) {
      const p = answers[index];
      if (p === null || p === undefined) return;
    }
    if (index >= quiz.length - 1) {
      if (!isMock) {
        setFinishedAt(new Date().toISOString());
        setPhase('results');
      }
      return;
    }
    setIndex(index + 1);
  }

  function goPrev(): void {
    if (phase !== 'running' || !isMock) return;
    if (index > 0) setIndex(index - 1);
  }

  function submitExam(): void {
    if (phase !== 'running') return;
    setFinishedAt(new Date().toISOString());
    setPhase('results');
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
    const missedQs = quiz.filter((q, i) => answers[i] !== q.correctIndex);
    if (missedQs.length === 0) return;
    setQuiz(shuffled(missedQs));
    setAnswers(new Array<number | null>(missedQs.length).fill(null));
    setIndex(0);
    setStartedAt(new Date().toISOString());
    setFinishedAt(null);
    setSecondsLeft(timelimit * 60);
    recordedRef.current = false;
    setPhase('running');
  }

  const modeLabel = mode === 'mock' ? 'Mock exam' : mode === 'focused' ? 'Focused' : 'Practice';

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

  if (base.list.length === 0) {
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

  if (phase === 'interstitial') {
    return (
      <div className="page exam-runner">
        <PageHeader
          eyebrow="Mock exam"
          title={base.label}
          description={`${quiz.length} question${quiz.length === 1 ? '' : 's'}${timelimit > 0 ? ` · ${timelimit} minute limit` : ' · no time limit'}.`}
        />
        <div className="card">
          <h2>Before you start</h2>
          <ul className="instruct-list">
            <li>No feedback until you submit the exam.</li>
            <li>Unanswered questions count as wrong.</li>
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
            <Badge>{current.difficulty}</Badge>
          </div>
          {!isMock ? (
            <p className="muted">{correctTotal} correct so far</p>
          ) : (
            <p className="muted">
              {answeredCount} of {quiz.length} answered
            </p>
          )}
          <ProgressBar value={answeredCount} max={quiz.length} />

          <h2>{current.question}</h2>

          <div className="choices">
            {current.choices.map((choice, ci) => {
              let cls = 'choice';
              if (isMock) {
                if (picked === ci) cls += ' selected';
              } else if (picked !== null) {
                if (ci === current.correctIndex) cls += ' correct';
                else if (ci === picked) cls += ' wrong';
                else cls += ' dim';
              }
              return (
                <button
                  key={ci}
                  type="button"
                  className={cls}
                  disabled={!isMock && picked !== null}
                  onClick={() => answer(ci)}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {!isMock && picked !== null ? (
            <div className="quiz-feedback">
              {picked === current.correctIndex ? (
                <p>
                  <CheckCircle2 size={16} aria-hidden="true" /> Correct
                </p>
              ) : (
                <p>
                  <XCircle size={16} aria-hidden="true" /> Incorrect
                </p>
              )}
              <p>{current.explanation}</p>
              {picked !== current.correctIndex && (current.whyWrong?.[picked] ?? '') !== '' ? (
                <ul className="weak-list">
                  <li>{current.whyWrong?.[picked]}</li>
                </ul>
              ) : null}
            </div>
          ) : null}

          {isMock ? (
            <div className="q-dots" role="group" aria-label="Question navigator">
              {quiz.map((q, qi) => {
                const answered = answers[qi] !== null && answers[qi] !== undefined;
                return (
                  <button
                    key={q.id}
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
            ) : (
              <>
                <button type="button" className="btn primary" onClick={goNext} disabled={picked === null}>
                  {isLast ? 'See results' : 'Next'} <ArrowRight size={16} aria-hidden="true" />
                </button>
                <button type="button" className="btn" onClick={quit}>
                  Quit
                </button>
              </>
            )}
          </div>
          <p className="muted">Press 1–4 to answer, Enter for next.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page exam-runner">
      <PageHeader
        eyebrow={modeLabel}
        title={`${base.label} — results`}
        description="Review every question below."
      />
      <div className="card exam-results">
        <p className="score-ring">{pct}%</p>
        <p>
          {correctTotal} correct · {incorrectTotal} incorrect · {formatSpent(spentSec)}
        </p>

        <div className="topic-bars">
          {breakdown.map((b) => (
            <div key={b.topicId}>
              <p className="muted">
                {topicById(b.topicId)?.title ?? b.topicId} — {b.correct}/{b.total} ({b.pct}%)
              </p>
              <ProgressBar value={b.correct} max={b.total} />
            </div>
          ))}
        </div>
        {strongest ? (
          <p className="muted">
            Strongest: {topicById(strongest.topicId)?.title ?? strongest.topicId} ({strongest.pct}
            %)
          </p>
        ) : null}
        {weakest && breakdown.length > 1 ? (
          <p className="muted">
            Weakest: {topicById(weakest.topicId)?.title ?? weakest.topicId} ({weakest.pct}%)
          </p>
        ) : null}

        <div className="quiz-review">
          <h2>Full review</h2>
          {quiz.map((q, i) => {
            const mine = answers[i] ?? null;
            const ok = mine === q.correctIndex;
            const r = readingFor(q);
            const pg = pageNumber(q.pageRef);
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
                <p className="muted">
                  {r ? r.title : null}
                  {r && q.pageRef ? ` · ${q.pageRef}` : (q.pageRef ?? '')}
                </p>
                {r && pg !== null ? (
                  <Link className="link" to={`/read/${r.id}?page=${pg}`}>Open reading p. {pg}</Link>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="row">
          {incorrectTotal > 0 ? (
            <button type="button" className="btn primary" onClick={retryMissed}>
              Retry missed ({incorrectTotal})
            </button>
          ) : null}
          <Link className="btn" to="/exam">
            New exam
          </Link>
          {base.readingId ? <Link className="btn" to={`/read/${base.readingId}`}>Review reading</Link> : null}
        </div>
      </div>
    </div>
  );
}
