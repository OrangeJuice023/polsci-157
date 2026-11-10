import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  GraduationCap,
  Layers,
  PenLine,
} from 'lucide-react';
import { readings } from '../data/readings';
import { topicById, topics } from '../data/topics';
import { flashcards } from '../data/flashcards';
import { questions } from '../data/questions';
import { useStudy } from '../store/study';
import { Badge, EmptyState, PageHeader, ProgressBar } from '../components/ui';

export function ReviewCenter() {
  const { progress } = useStudy();

  if (readings.length === 0) {
    return (
      <div className="page">
        <PageHeader
          eyebrow="Review Center"
          title="Reading library"
          description="Guided readings with companion notes, concepts, and exam links."
        />
        <EmptyState
          title="No readings yet"
          description="Course readings have not been added. Browse the topic notes instead."
          action={
            <Link className="btn primary sm" to="/reviewer">
              Open topic notes
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Review Center"
        title="Reading library"
        description="Open a reading in the guided reader, drill its flashcards, or sit its practice exam."
        actions={
          <Link className="btn sm" to="/reviewer">
            <BookOpen size={15} aria-hidden="true" /> Topic notes
          </Link>
        }
      />

      <div className="library">
        {readings.map((reading) => {
          const topic = topicById(reading.topicId);
          const totalSections = topic?.subtopics.length ?? 0;
          const readSections =
            topic?.subtopics.filter((s) => progress.subtopicsRead.includes(s.id)).length ?? 0;
          const isComplete = progress.readingsComplete.includes(reading.id);
          const cardCount = flashcards.filter((c) => c.topicId === reading.topicId).length;
          const quizCount = questions.filter(
            (q) => q.topicId === reading.topicId || q.readingId === reading.id,
          ).length;

          return (
            <article key={reading.id} className="card reading-card">
              <div className="reading-meta">
                <Badge tone="outline">{reading.docNumber}</Badge>
                {isComplete ? (
                  <Badge tone="green">
                    <CheckCircle2 size={13} aria-hidden="true" /> Complete
                  </Badge>
                ) : (
                  <Badge>
                    <Circle size={13} aria-hidden="true" /> In progress
                  </Badge>
                )}
              </div>

              <h2 className="card-title">{reading.title}</h2>
              <p className="muted">{reading.author}</p>
              <p className="muted">{reading.overview}</p>

              <div className="reading-stats">
                <span>{reading.totalPages} pages</span>
                <span>{reading.annotations.length} guided concepts</span>
                <span>{cardCount} flashcards</span>
                <span>{quizCount} quiz questions</span>
              </div>

              <div className="row between">
                <small className="muted">
                  {totalSections > 0
                    ? `${readSections}/${totalSections} topic sections read`
                    : 'No linked topic sections'}
                </small>
                <small className="muted">
                  <GraduationCap size={13} aria-hidden="true" />{' '}
                  {reading.examQuestions.length > 0
                    ? `${reading.examQuestions.length} essay prompts ready`
                    : 'Essay prompts coming soon'}
                </small>
              </div>
              <ProgressBar
                value={totalSections > 0 ? (readSections / totalSections) * 100 : 0}
              />

              <div className="row">
                <Link className="btn primary sm" to={`/read/${reading.id}`}>
                  <FileText size={15} aria-hidden="true" /> Open reader
                </Link>
                <Link className="btn sm" to={`/flashcards?topic=${reading.topicId}`}>
                  <Layers size={15} aria-hidden="true" /> Flashcards
                </Link>
                <Link
                  className="btn sm"
                  to={`/exam/run?bank=${reading.id}&mode=practice`}
                >
                  <PenLine size={15} aria-hidden="true" /> Practice exam
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <section className="card" aria-label="Topic notes">
        <div className="card-head">
          <h2>
            <BookOpen size={16} aria-hidden="true" /> Topic notes
          </h2>
          <Link className="link" to="/reviewer">
            All notes <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <ul className="quick">
          {topics.map((t) => (
            <li key={t.id}>
              <Link className="quick-row" to={`/reviewer/${t.id}`}>
                <span>
                  <strong>{t.title}</strong>
                  <small>
                    {t.code} · {t.subtopics.length} sections
                  </small>
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
