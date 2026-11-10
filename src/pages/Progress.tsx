import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { Download, Target, Trash2, Trophy, Upload } from 'lucide-react';
import { topics } from '../data/topics';
import { flashcards } from '../data/flashcards';
import { questions } from '../data/questions';
import { readingById } from '../data/readings';
import { useStudy } from '../store/study';
import { Badge, EmptyState, PageHeader, ProgressBar, StatCard } from '../components/ui';
import { FormatAnalytics } from '../components/FormatAnalytics';
import type { StudyProgress, StudySession } from '../types';

const STORAGE_KEY = 'polsci157.progress.v1';

function sessionPct(s: StudySession): number {
  if (s.totalItems <= 0) return 0;
  return Math.round((s.correctItems / s.totalItems) * 100);
}

function kindLabel(kind: StudySession['kind']): string {
  if (kind === 'quiz') return 'Quiz';
  if (kind === 'exam') return 'Exam';
  if (kind === 'flashcards') return 'Flashcards';
  return 'Reading';
}

function kindTone(kind: StudySession['kind']): 'neutral' | 'green' | 'outline' {
  if (kind === 'quiz' || kind === 'exam') return 'green';
  if (kind === 'reading') return 'outline';
  return 'neutral';
}

function topicTitle(topicId: string | undefined): string {
  if (!topicId) return 'All topics';
  return topics.find((t) => t.id === topicId)?.title ?? 'Unknown topic';
}

interface WeaknessRow {
  concept: string;
  attempts: number;
  correct: number;
  accuracy: number;
  topicId?: string;
  readingId?: string;
  page?: number;
}

function parsePageNumber(pageRef: string | undefined): number | undefined {
  if (!pageRef) return undefined;
  const m = /(?:p\.?|page)\s*(\d+)/i.exec(pageRef);
  if (!m) return undefined;
  const n = Number.parseInt(m[1] ?? '', 10);
  return Number.isNaN(n) ? undefined : n;
}

function buildWeaknessRows(sessions: StudySession[]): { rows: WeaknessRow[]; hasDetails: boolean } {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const agg = new Map<
    string,
    { attempts: number; correct: number; topicId?: string; readingId?: string; page?: number }
  >();
  let hasDetails = false;
  for (const s of sessions) {
    if (s.kind !== 'quiz' && s.kind !== 'exam') continue;
    if (!s.details || s.details.length === 0) continue;
    hasDetails = true;
    for (const d of s.details) {
      const q = byId.get(d.questionId);
      const concept = d.concept ?? q?.concept ?? (q ? topicTitle(q.topicId) : 'Unknown concept');
      const entry = agg.get(concept) ?? { attempts: 0, correct: 0 };
      entry.attempts += 1;
      if (d.correct) entry.correct += 1;
      if (!entry.topicId && q?.topicId) entry.topicId = q.topicId;
      if (!entry.readingId && q?.readingId) {
        entry.readingId = q.readingId;
        const p = parsePageNumber(q.pageRef);
        if (p !== undefined) entry.page = p;
      }
      agg.set(concept, entry);
    }
  }
  const rows: WeaknessRow[] = [...agg.entries()]
    .map(([concept, v]) => ({
      concept,
      attempts: v.attempts,
      correct: v.correct,
      accuracy: v.attempts > 0 ? Math.round((v.correct / v.attempts) * 100) : 0,
      topicId: v.topicId,
      readingId: v.readingId,
      page: v.page,
    }))
    .filter((r) => r.attempts >= 1 && r.accuracy < 70)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, 5);
  return { rows, hasDetails };
}

export function Progress() {
  const { progress, masteredCount, needsReviewCount, overallPct, resetProgress } = useStudy();
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalCards = flashcards.length;
  const quizSessions = progress.sessions.filter((s) => s.kind === 'quiz' || s.kind === 'exam');
  const quizzesTaken = quizSessions.length;
  const quizScores = quizSessions.map(sessionPct);
  const avgQuizScore =
    quizScores.length > 0
      ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
      : 0;
  const bestQuizScore = quizScores.length > 0 ? Math.max(...quizScores) : 0;
  const lastFiveQuiz = quizSessions.slice(0, 5).reverse();
  const recentSessions = progress.sessions.slice(0, 10);
  const { rows: weaknessRows, hasDetails: hasWeaknessData } = buildWeaknessRows(progress.sessions);

  const readSet = new Set(progress.subtopicsRead);
  const topicRows = topics.map((t) => {
    const cardIds = flashcards.filter((c) => c.topicId === t.id).map((c) => c.id);
    const mastered = cardIds.filter((id) => progress.cards[id]?.status === 'mastered').length;
    const read = t.subtopics.filter((s) => readSet.has(s.id)).length;
    const cardRatio = cardIds.length > 0 ? mastered / cardIds.length : 0;
    const readRatio = t.subtopics.length > 0 ? read / t.subtopics.length : 0;
    const pct = Math.round(((cardRatio + readRatio) / 2) * 100);
    return { topic: t, totalCards: cardIds.length, mastered, read, totalSections: t.subtopics.length, pct };
  });

  function handleResetClick(): void {
    if (!confirmingReset) {
      setConfirmingReset(true);
      setResetDone(false);
      return;
    }
    resetProgress();
    setConfirmingReset(false);
    setResetDone(true);
  }

  function handleExport(): void {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'polsci157-progress.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(file: File): void {
    setImportError(null);
    setImportDone(false);
    void file
      .text()
      .then((text) => {
        let parsed: StudyProgress;
        try {
          parsed = JSON.parse(text) as StudyProgress;
        } catch {
          setImportError('That file is not valid JSON.');
          return;
        }
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          parsed.version !== 1 ||
          typeof parsed.cards !== 'object' ||
          parsed.cards === null ||
          !Array.isArray(parsed.subtopicsRead) ||
          !Array.isArray(parsed.sessions)
        ) {
          setImportError('Invalid progress file: expected version 1 export with cards, subtopicsRead, and sessions.');
          return;
        }
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              version: 1,
              cards: parsed.cards,
              subtopicsRead: parsed.subtopicsRead,
              sessions: parsed.sessions.slice(0, 60),
              bookmarks: parsed.bookmarks ?? [],
              notes: parsed.notes ?? [],
              savedConcepts: parsed.savedConcepts ?? [],
              readingsComplete: parsed.readingsComplete ?? [],
            } satisfies StudyProgress),
          );
        } catch {
          setImportError('Could not save imported progress: storage is unavailable.');
          return;
        }
        setImportDone(true);
        window.location.reload();
      })
      .catch(() => {
        setImportError('Could not read that file.');
      });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) handleImportFile(file);
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Study Progress"
        title="Know exactly where you stand."
        description="Mastery by topic, quiz performance, recent sessions, and backup controls."
      />

      <section className="grid stats" aria-label="Progress statistics">
        <StatCard label="Total flashcards" value={String(totalCards)} hint="Across all topics" />
        <StatCard
          label="Cards mastered"
          value={String(masteredCount)}
          hint={`${totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0}% of deck`}
          icon={<Trophy size={16} aria-hidden="true" />}
        />
        <StatCard
          label="Cards needing review"
          value={String(needsReviewCount)}
          hint={needsReviewCount === 0 ? 'Deck fully mastered' : 'Still in new or learning'}
        />
        <StatCard
          label="Quizzes taken"
          value={String(quizzesTaken)}
          hint={quizzesTaken > 0 ? `Average score ${avgQuizScore}%` : 'No quizzes yet'}
          icon={<Target size={16} aria-hidden="true" />}
        />
      </section>

      <section className="grid" aria-label="Weakness analysis">
        <div className="card">
          <div className="card-head">
            <h2>Weakness analysis</h2>
            {weaknessRows.length > 0 ? (
              <Badge tone="red">
                {weaknessRows.length} weak spot{weaknessRows.length === 1 ? '' : 's'}
              </Badge>
            ) : (
              <Badge tone="green">All clear</Badge>
            )}
          </div>
          {!hasWeaknessData ? (
            <EmptyState
              title="Not enough data"
              description="Finish a quiz or practice exam with per-question results to see your weakest concepts here."
              action={
                <Link className="btn primary sm" to="/exam">
                  Take a practice exam
                </Link>
              }
            />
          ) : weaknessRows.length === 0 ? (
            <p className="muted">
              No weak spots: every attempted concept is at 70% accuracy or above. Keep it up.
            </p>
          ) : (
            <div>
              {weaknessRows.map((row) => (
                <div key={row.concept} className="bar-row">
                  <div>
                    <p className="card-title">{row.concept}</p>
                    <small className="muted">
                      {row.accuracy}% accuracy · {row.correct}/{row.attempts} correct ·{' '}
                      {row.attempts} attempt{row.attempts === 1 ? '' : 's'}
                    </small>
                    <ProgressBar value={row.accuracy} />
                    <div className="row">
                      {row.readingId && readingById(row.readingId) ? (
                        <Link
                          className="link"
                          to={
                            row.page !== undefined
                              ? `/read/${row.readingId}?page=${row.page}`
                              : `/read/${row.readingId}`
                          }
                        >
                          Review reading{row.page !== undefined ? ` (p. ${row.page})` : ''}
                        </Link>
                      ) : null}
                      <Link
                        className="link"
                        to={row.topicId ? `/flashcards?topic=${row.topicId}` : '/flashcards'}
                      >
                        Practice flashcards
                      </Link>
                      <Link className="link" to="/exam/run?bank=missed&mode=focused">
                        Retry missed
                      </Link>
                    </div>
                  </div>
                  <Badge tone={row.accuracy < 40 ? 'red' : 'amber'}>{row.accuracy}%</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid" aria-label="Performance by exam format">
        <div className="card">
          <div className="card-head">
            <h2>Performance by exam format</h2>
            <Badge>Exam DNA</Badge>
          </div>
          <FormatAnalytics sessions={progress.sessions} />
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <div className="card-head">
            <h2>Topic completion</h2>
            <Badge tone="green">{overallPct}% overall</Badge>
          </div>
          <ProgressBar value={overallPct} />
          <div>
            {topicRows.map((row) => (
              <div key={row.topic.id} className="bar-row">
                <div>
                  <p className="card-title">
                    <Link className="link" to={`/reviewer/${row.topic.id}`}>
                      {row.topic.title}
                    </Link>
                  </p>
                  <small className="muted">
                    {row.mastered}/{row.totalCards} cards mastered · {row.read}/{row.totalSections}{' '}
                    sections read
                  </small>
                  <ProgressBar value={row.pct} />
                </div>
                <Link className="link" to={`/reviewer/${row.topic.id}`}>
                  Open topic
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Quiz performance</h2>
            {quizzesTaken > 0 ? <Badge>{quizzesTaken} taken</Badge> : null}
          </div>
          {quizzesTaken === 0 ? (
            <EmptyState
              title="No quizzes yet"
              description="Take a practice quiz or exam to see your average, best score, and trend here."
              action={
                <Link className="btn primary sm" to="/exam">
                  Practice now
                </Link>
              }
            />
          ) : (
            <>
              <p className="muted">
                Average score <strong>{avgQuizScore}%</strong> · Best score{' '}
                <strong>{bestQuizScore}%</strong>
              </p>
              <div className="mini-bars" aria-label="Last quiz scores">
                {lastFiveQuiz.map((s) => {
                  const pct = sessionPct(s);
                  return (
                    <span
                      key={s.id}
                      title={`${pct}% · ${s.correctItems}/${s.totalItems}`}
                      style={{ height: `${Math.max(pct, 6)}%` }}
                    />
                  );
                })}
              </div>
              <p className="muted">
                <small>Last {lastFiveQuiz.length} scored session{lastFiveQuiz.length === 1 ? '' : 's'} (quizzes + exams).</small>
              </p>
            </>
          )}
        </div>
      </section>

      <section className="grid two">
        <div className="card">
          <div className="card-head">
            <h2>Recent sessions</h2>
            {recentSessions.length > 0 ? <Badge>{recentSessions.length} shown</Badge> : null}
          </div>
          {recentSessions.length === 0 ? (
            <EmptyState
              title="No sessions yet"
              description="Study flashcards, take a quiz, or mark a section as read to start your history."
              action={
                <Link className="btn primary sm" to="/flashcards">
                  Start studying
                </Link>
              }
            />
          ) : (
            <ul className="session-list">
              {recentSessions.map((s) => (
                <li key={s.id}>
                  <Badge tone={kindTone(s.kind)}>{kindLabel(s.kind)}</Badge>
                  <div>
                    <p>
                      <strong>{topicTitle(s.topicId)}</strong> · {s.correctItems}/{s.totalItems}{' '}
                      correct · {sessionPct(s)}%
                    </p>
                    <small className="muted">{new Date(s.endedAt).toLocaleString()}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card danger-zone">
          <div className="card-head">
            <h2>Danger zone</h2>
          </div>
          <p className="muted">Reset, back up, or restore your local study progress.</p>
          <div className="row">
            <button type="button" className="btn danger" onClick={handleResetClick}>
              <Trash2 size={16} aria-hidden="true" />
              {confirmingReset ? 'Click again to confirm' : 'Reset all progress'}
            </button>
            {confirmingReset ? (
              <button type="button" className="btn" onClick={() => setConfirmingReset(false)}>
                Cancel
              </button>
            ) : null}
          </div>
          {resetDone ? <p className="muted">Progress has been reset.</p> : null}
          <div className="row">
            <button type="button" className="btn" onClick={handleExport}>
              <Download size={16} aria-hidden="true" /> Export progress
            </button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              <Upload size={16} aria-hidden="true" /> Import progress
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              aria-label="Import progress file"
            />
          </div>
          {importError ? <p className="muted">{importError}</p> : null}
          {importDone ? <p className="muted">Progress imported. Reloading…</p> : null}
        </div>
      </section>
    </div>
  );
}
