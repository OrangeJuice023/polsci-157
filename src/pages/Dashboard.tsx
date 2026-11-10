import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ClipboardList, Layers, Library } from 'lucide-react';
import { SAMPLE_NOTICE, topics } from '../data/topics';
import { readings } from '../data/readings';
import { flashcards } from '../data/flashcards';
import { questions } from '../data/questions';
import { useStudy } from '../store/study';
import { Badge, PageHeader, ProgressBar, SampleNotice, StatCard } from '../components/ui';
import type { StudySession } from '../types';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return 'just now';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

function sessionLabel(kind: StudySession['kind']): string {
  if (kind === 'quiz') return 'Practice quiz';
  if (kind === 'exam') return 'Practice exam';
  if (kind === 'flashcards') return 'Flashcard session';
  return 'Reading';
}

export function Dashboard() {
  const { progress, masteredCount, readSubtopicsCount, totalSubtopics, overallPct } = useStudy();

  const readSet = new Set(progress.subtopicsRead);
  const sessions = progress.sessions.slice(0, 5);
  const examSessions = progress.sessions.filter((s) => s.kind === 'exam');
  const lastExam = examSessions[0];
  const lastExamPct =
    lastExam && lastExam.totalItems > 0
      ? Math.round((lastExam.correctItems / lastExam.totalItems) * 100)
      : null;
  const avgExamScore =
    examSessions.length > 0
      ? Math.round(
          examSessions.reduce(
            (sum, s) => sum + (s.totalItems > 0 ? (s.correctItems / s.totalItems) * 100 : 0),
            0,
          ) / examSessions.length,
        )
      : null;

  const readingsComplete = progress.readingsComplete.length;

  const readingRows = readings.map((reading) => {
    const topic = topics.find((t) => t.id === reading.topicId);
    const cardCount = flashcards.filter((c) => c.topicId === reading.topicId).length;
    const questionCount = questions.filter(
      (q) => q.topicId === reading.topicId || q.readingId === reading.id,
    ).length;
    const sectionsTotal = topic?.subtopics.length ?? 0;
    const sectionsRead = topic ? topic.subtopics.filter((s) => readSet.has(s.id)).length : 0;
    const complete = progress.readingsComplete.includes(reading.id);
    const ratio = complete ? 1 : sectionsTotal > 0 ? sectionsRead / sectionsTotal : 0;
    return {
      reading,
      topic,
      cardCount,
      questionCount,
      sectionsRead,
      sectionsTotal,
      complete,
      ratio,
    };
  });

  const continueReading =
    [...readingRows].filter((r) => !r.complete).sort((a, b) => a.ratio - b.ratio)[0] ??
    readingRows[0];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Dashboard"
        title="Hi Miss Grande, this is for your review."
        description="Your readings-first review hub: annotated readings, flashcards, and exam practice."
        actions={
          <>
            <Link className="btn primary" to="/review">
              <Library size={16} aria-hidden="true" /> Open Review Center
            </Link>
            <Link className="btn" to="/exam">
              <ClipboardList size={16} aria-hidden="true" /> Practice Exam Center
            </Link>
          </>
        }
      />

      <SampleNotice text={SAMPLE_NOTICE} />

      <section className="grid two" aria-label="Study centers">
        <div className="card">
          <div className="card-head">
            <h2>
              <Library size={16} aria-hidden="true" /> Review Center
            </h2>
            <Badge tone="green">{readings.length} readings</Badge>
          </div>
          <p className="card-title">Read with annotations, not alone.</p>
          <p className="muted">
            {readingsComplete} of {readings.length} readings complete · {readSubtopicsCount}/
            {totalSubtopics} sections read.
          </p>
          {continueReading ? (
            <p className="muted">
              Continue reading:{' '}
              <Link className="link" to={`/read/${continueReading.reading.id}`}>
                {continueReading.reading.title}
              </Link>{' '}
              ({continueReading.reading.docNumber}).
            </p>
          ) : (
            <p className="muted">No readings assigned yet.</p>
          )}
          <div className="row">
            <Link className="btn primary sm" to="/review">
              Open Review Center <ArrowRight size={15} aria-hidden="true" />
            </Link>
            {continueReading ? (
              <Link className="btn sm" to={`/read/${continueReading.reading.id}`}>
                <BookOpen size={15} aria-hidden="true" /> Continue reading
              </Link>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>
              <ClipboardList size={16} aria-hidden="true" /> Practice Exam Center
            </h2>
            <Badge>{questions.length} questions</Badge>
          </div>
          <p className="card-title">Drill the bank under exam conditions.</p>
          <p className="muted">
            {examSessions.length === 0
              ? 'No exams taken yet. Start with a focused set or a full run.'
              : `Last exam: ${lastExamPct ?? 0}% · ${examSessions.length} exam${examSessions.length === 1 ? '' : 's'} taken.`}
          </p>
          <div className="row">
            <Link className="btn primary sm" to="/exam/run?bank=combined&mode=practice&count=5&timelimit=0">
              Start practice exam <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <Link className="btn sm" to="/exam">
              Open Exam Center
            </Link>
          </div>
        </div>
      </section>

      <section className="grid stats" aria-label="Study statistics">
        <StatCard label="Overall progress" value={`${overallPct}%`} hint={`${readSubtopicsCount}/${totalSubtopics} sections read`} />
        <StatCard
          label="Readings complete"
          value={`${readingsComplete}/${readings.length}`}
          hint={readingsComplete >= readings.length && readings.length > 0 ? 'All readings done' : 'Keep going'}
        />
        <StatCard label="Cards mastered" value={String(masteredCount)} hint={`${flashcards.length} cards total`} />
        <StatCard
          label="Avg exam score"
          value={avgExamScore === null ? '—' : `${avgExamScore}%`}
          hint={examSessions.length === 0 ? 'No exams yet' : `${examSessions.length} exam${examSessions.length === 1 ? '' : 's'} taken`}
        />
      </section>

      <section className="grid two" aria-label="Reading progress">
        {readingRows.map((row) => (
          <div className="card" key={row.reading.id}>
            <div className="card-head">
              <h2>{row.reading.title}</h2>
              <Badge tone={row.complete ? 'green' : 'neutral'}>{row.reading.docNumber}</Badge>
            </div>
            <p className="muted">
              {row.reading.author} · {row.reading.totalPages} pages ·{' '}
              {row.reading.annotations.length} annotations · {row.cardCount} cards ·{' '}
              {row.questionCount} questions
            </p>
            <p className="muted">
              <small>
                {row.sectionsRead}/{row.sectionsTotal} sections read
                {row.complete ? ' · marked complete' : ''}.
              </small>
            </p>
            <ProgressBar
              value={row.sectionsTotal > 0 ? (row.sectionsRead / row.sectionsTotal) * 100 : 0}
            />
            <div className="row">
              <Link className="btn primary sm" to={`/read/${row.reading.id}`}>
                Open reader <ArrowRight size={15} aria-hidden="true" />
              </Link>
              {row.topic ? (
                <Link className="btn sm" to={`/reviewer/${row.topic.id}`}>
                  <BookOpen size={15} aria-hidden="true" /> Topic notes
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <section className="grid two">
        <div className="card">
          <div className="card-head">
            <h2>Recent activity</h2>
            <Link className="link" to="/progress">View all</Link>
          </div>
          {sessions.length === 0 ? (
            <p className="muted">
              Nothing yet. Your flashcard sessions, quizzes, exams, and reading marks will appear
              here.
            </p>
          ) : (
            <ul className="activity">
              {sessions.map((s) => (
                <li key={s.id}>
                  <span className={`dot ${s.kind === 'exam' ? 'quiz' : s.kind}`} aria-hidden="true" />
                  <div>
                    <p>
                      <strong>{sessionLabel(s.kind)}</strong>
                      {' · '}
                      {s.correctItems}/{s.totalItems} correct
                      {s.topicId ? ` · ${topics.find((t) => t.id === s.topicId)?.title ?? ''}` : ''}
                    </p>
                    <small className="muted">{timeAgo(s.endedAt)}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Quick access</h2>
          </div>
          <div className="quick">
            <Link className="quick-row" to="/review">
              <Library size={17} aria-hidden="true" />
              <span>
                <strong>Review Center</strong>
                <small>Annotated readings · {readings.length} readings</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="quick-row" to="/exam">
              <ClipboardList size={17} aria-hidden="true" />
              <span>
                <strong>Practice Exam Center</strong>
                <small>Timed + focused runs · {questions.length} questions</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="quick-row" to="/flashcards">
              <Layers size={17} aria-hidden="true" />
              <span>
                <strong>Flashcards</strong>
                <small>Active recall · {flashcards.length} cards</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link className="quick-row" to="/reviewer">
              <BookOpen size={17} aria-hidden="true" />
              <span>
                <strong>Course Reviewer</strong>
                <small>Notes, definitions, arguments, examples</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
