import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, RefreshCw, RotateCcw, Shuffle } from 'lucide-react';
import { topicById, topics } from '../data/topics';
import { flashcards } from '../data/flashcards';
import { useStudy } from '../store/study';
import { Badge, EmptyState, PageHeader, ProgressBar } from '../components/ui';
import type { Flashcard } from '../types';

type Mode = 'all' | 'missed' | 'hard';
type Phase = 'setup' | 'session' | 'summary';

const MODES: { id: Mode; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'missed', label: 'Missed' },
  { id: 'hard', label: 'Hard' },
];

function shuffleCopy<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatDuration(startedAt: string, endedAt: string): string {
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (Number.isNaN(ms) || ms < 0) return '0s';
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function difficultyTone(d: Flashcard['difficulty']): 'green' | 'amber' | 'red' {
  if (d === 'easy') return 'green';
  if (d === 'medium') return 'amber';
  return 'red';
}

function isValidMode(v: string | null): v is Mode {
  return v === 'all' || v === 'missed' || v === 'hard';
}

export function Flashcards() {
  const { progress, markCard, recordSession } = useStudy();
  const [searchParams] = useSearchParams();

  const [phase, setPhase] = useState<Phase>('setup');
  const [topicFilter, setTopicFilter] = useState<string>(() => {
    const t = searchParams.get('topic');
    return t && topics.some((topic) => topic.id === t) ? t : 'all';
  });
  const [mode, setMode] = useState<Mode>(() => {
    const m = searchParams.get('mode');
    return isValidMode(m) ? m : 'all';
  });
  const [shuffleOnStart, setShuffleOnStart] = useState(true);

  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [initialDeck, setInitialDeck] = useState<Flashcard[]>([]);
  const [initialTotal, setInitialTotal] = useState(0);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [missedIds, setMissedIds] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const recordedRef = useRef(false);

  const topicCards = useMemo(
    () =>
      topicFilter === 'all'
        ? flashcards
        : flashcards.filter((c) => c.topicId === topicFilter),
    [topicFilter],
  );

  const isMissed = (card: Flashcard): boolean => {
    const st = progress.cards[card.id];
    if (!st) return false;
    if (st.status === 'learning') return true;
    return st.status !== 'mastered' && st.reviews > 0;
  };

  const isHard = (card: Flashcard): boolean =>
    card.difficulty === 'hard' || progress.cards[card.id]?.status === 'learning';

  const counts = useMemo(
    () => ({
      all: topicCards.length,
      missed: topicCards.filter(isMissed).length,
      hard: topicCards.filter(isHard).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topicCards, progress],
  );

  const filtered = useMemo(() => {
    if (mode === 'missed') return topicCards.filter(isMissed);
    if (mode === 'hard') return topicCards.filter(isHard);
    return topicCards;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicCards, mode, progress]);

  const card = queue[index];

  function startSession(cards: Flashcard[]): void {
    const ordered = shuffleOnStart ? shuffleCopy(cards) : [...cards];
    setQueue(ordered);
    setInitialDeck([...cards]);
    setInitialTotal(cards.length);
    setIndex(0);
    setFlipped(false);
    setKnownCount(0);
    setReviewCount(0);
    setMissedIds([]);
    setStartedAt(new Date().toISOString());
    setEndedAt('');
    recordedRef.current = false;
    setPhase('session');
  }

  function finishSession(finalKnown: number, total: number): void {
    const end = new Date().toISOString();
    setEndedAt(end);
    setPhase('summary');
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordSession({
        kind: 'flashcards',
        ...(topicFilter !== 'all' ? { topicId: topicFilter } : {}),
        startedAt,
        endedAt: end,
        totalItems: total,
        correctItems: finalKnown,
      });
    }
  }

  function grade(known: boolean): void {
    const current = queue[index];
    if (!current || phase !== 'session') return;
    markCard(current.id, known);
    if (known) {
      const nextKnown = knownCount + 1;
      setKnownCount(nextKnown);
      const next = queue.filter((_, i) => i !== index);
      if (next.length === 0) {
        finishSession(nextKnown, initialTotal);
        return;
      }
      setQueue(next);
      setIndex(index >= next.length ? 0 : index);
      setFlipped(false);
    } else {
      setReviewCount((n) => n + 1);
      setMissedIds((prev) => (prev.includes(current.id) ? prev : [...prev, current.id]));
      const next = [...queue.slice(0, index), ...queue.slice(index + 1), current];
      setQueue(next);
      // Items after index shift left into index; if we were last, wrap to the front.
      setIndex(index === queue.length - 1 ? 0 : index);
      setFlipped(false);
    }
  }

  function goPrev(): void {
    if (queue.length === 0) return;
    setIndex((i) => (i - 1 + queue.length) % queue.length);
    setFlipped(false);
  }

  function goNext(): void {
    if (queue.length === 0) return;
    setIndex((i) => (i + 1) % queue.length);
    setFlipped(false);
  }

  function shuffleQueue(): void {
    setQueue((q) => shuffleCopy(q));
    setIndex(0);
    setFlipped(false);
  }

  function restart(): void {
    startSession(initialDeck);
  }

  useEffect(() => {
    if (phase !== 'session') return;
    const onKey = (e: KeyboardEvent): void => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.repeat) return;
      if (e.code === 'KeyK') {
        grade(true);
        return;
      }
      if (e.code === 'KeyR') {
        grade(false);
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        // Let the focused card element handle its own flip to avoid double-toggling.
        if (el && typeof el.closest === 'function' && el.closest('.flash-card')) return;
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, queue, index, knownCount, reviewCount, initialTotal, startedAt, topicFilter]);

  const accuracy = initialTotal > 0 ? Math.round((knownCount / initialTotal) * 100) : 0;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Flashcards"
        title="Active recall"
        description="Flip cards, grade honestly, and clear the queue."
      />


      {phase === 'setup' && (
        <div className="flash-setup card">
          <label>
            Topic
            <select
              className="select"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              aria-label="Topic"
            >
              <option value="all">All topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.title}
                </option>
              ))}
            </select>
          </label>

          <div className="chip-row" role="group" aria-label="Mode">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chip${mode === m.id ? ' active' : ''}`}
                aria-pressed={mode === m.id}
                onClick={() => setMode(m.id)}
              >
                {m.label} ({counts[m.id]})
              </button>
            ))}
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={shuffleOnStart}
              onChange={(e) => setShuffleOnStart(e.target.checked)}
            />
            Shuffle cards
          </label>

          <p className="muted" aria-live="polite">
            {filtered.length} card{filtered.length === 1 ? '' : 's'} in this filter
          </p>

          {filtered.length === 0 ? (
            <EmptyState
              title="No cards match this filter"
              description="Try a different topic or mode to build a deck."
              action={
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setTopicFilter('all');
                    setMode('all');
                  }}
                >
                  Reset filter
                </button>
              }
            />
          ) : (
            <button type="button" className="btn primary" onClick={() => startSession(filtered)}>
              Start session
            </button>
          )}
        </div>
      )}

      {phase === 'session' && card && (
        <div className="card">
          <ProgressBar value={((index + 1) / queue.length) * 100} />
          <div className="row">
            <p className="muted">
              Card {index + 1} of {queue.length}
            </p>
            <Badge>{topicById(card.topicId)?.code ?? card.topicId}</Badge>
            <Badge tone={difficultyTone(card.difficulty)}>{card.difficulty}</Badge>
          </div>

          <div
            className={`flash-card${flipped ? ' flipped' : ''}`}
            role="button"
            tabIndex={0}
            aria-pressed={flipped}
            onClick={() => setFlipped((f) => !f)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setFlipped((f) => !f);
              }
            }}
          >
            <div className="flash-front">
              <p>{card.front}</p>
            </div>
            <div className="flash-back">
              <p>{card.back}</p>
              <p className="muted">{card.explanation}</p>
            </div>
          </div>

          <div className="row">
            <button type="button" className="btn sm" onClick={goPrev} disabled={queue.length <= 1}>
              <ArrowLeft size={15} aria-hidden="true" /> Prev
            </button>
            <button type="button" className="btn sm" onClick={goNext} disabled={queue.length <= 1}>
              Next <ArrowRight size={15} aria-hidden="true" />
            </button>
            <button type="button" className="btn sm" onClick={shuffleQueue}>
              <Shuffle size={15} aria-hidden="true" /> Shuffle
            </button>
            <button type="button" className="btn sm" onClick={restart}>
              <RotateCcw size={15} aria-hidden="true" /> Restart
            </button>
          </div>

          <div className="row">
            <button type="button" className="btn" onClick={() => grade(false)}>
              <RefreshCw size={15} aria-hidden="true" /> Review again (R)
            </button>
            <button type="button" className="btn primary" onClick={() => grade(true)}>
              <Check size={15} aria-hidden="true" /> Know it (K)
            </button>
          </div>
        </div>
      )}

      {phase === 'summary' && (
        <div className="flash-summary card">
          <h2>Session complete</h2>
          <p className="muted">
            {initialTotal} card{initialTotal === 1 ? '' : 's'} · {knownCount} known ·{' '}
            {reviewCount} review-again · {accuracy}% accuracy ·{' '}
            {startedAt && endedAt ? formatDuration(startedAt, endedAt) : '0s'}
          </p>
          <ProgressBar value={accuracy} />
          <div className="row">
            <button
              type="button"
              className="btn"
              disabled={missedIds.length === 0}
              onClick={() => {
                const missed = initialDeck.filter((c) => missedIds.includes(c.id));
                startSession(missed.length > 0 ? missed : initialDeck);
              }}
            >
              <RefreshCw size={15} aria-hidden="true" /> Retry missed
            </button>
            <button type="button" className="btn" onClick={() => setPhase('setup')}>
              New session
            </button>
            <Link
              className="btn primary"
              to={topicFilter !== 'all' ? `/practice?topic=${topicFilter}` : '/practice'}
            >
              Practice quiz for topic
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
