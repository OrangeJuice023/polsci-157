import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Layers,
  PenLine,
} from 'lucide-react';
import { topicById, topics } from '../data/topics';
import { useStudy } from '../store/study';
import { Badge, EmptyState, PageHeader, ProgressBar } from '../components/ui';

export function ReviewerDetail() {
  const { topicId } = useParams<{ topicId: string }>();
  const topic = topicId ? topicById(topicId) : undefined;
  const { progress, toggleSubtopicRead, recordSession } = useStudy();
  const [openIds, setOpenIds] = useState<string[]>(() =>
    topic?.subtopics[0] ? [topic.subtopics[0].id] : [],
  );

  useEffect(() => {
    const first = topicId ? topicById(topicId)?.subtopics[0] : undefined;
    setOpenIds(first ? [first.id] : []);
  }, [topicId]);

  if (!topic) {
    return (
      <div className="page">
        <Link className="link back" to="/reviewer">
          <ArrowLeft size={16} aria-hidden="true" /> Back to reviewer
        </Link>
        <EmptyState
          title="Topic not found"
          description={
            topicId
              ? `No reviewer topic matches "${topicId}". It may have been renamed or removed.`
              : 'No reviewer topic was selected.'
          }
          action={
            <Link className="btn primary sm" to="/reviewer">
              Back to reviewer
            </Link>
          }
        />
      </div>
    );
  }

  const readCount = topic.subtopics.filter((s) =>
    progress.subtopicsRead.includes(s.id),
  ).length;
  const idx = topics.findIndex((t) => t.id === topic.id);
  const prev = idx > 0 ? topics[idx - 1] : undefined;
  const next = idx >= 0 && idx < topics.length - 1 ? topics[idx + 1] : undefined;

  const toggleOpen = (id: string) =>
    setOpenIds((prevIds) =>
      prevIds.includes(id) ? prevIds.filter((x) => x !== id) : [...prevIds, id],
    );

  const handleToggleRead = (subtopicId: string) => {
    const alreadyRead = progress.subtopicsRead.includes(subtopicId);
    toggleSubtopicRead(subtopicId);
    if (!alreadyRead) {
      const now = new Date().toISOString();
      recordSession({
        kind: 'reading',
        topicId: topic.id,
        startedAt: now,
        endedAt: now,
        totalItems: 1,
        correctItems: 1,
      });
    }
  };

  return (
    <div className="page">
      <Link className="link back" to="/reviewer">
        <ArrowLeft size={16} aria-hidden="true" /> Back to reviewer
      </Link>

      <PageHeader
        eyebrow={topic.code}
        title={topic.title}
        description={topic.description}
        actions={
          <>
            <Link className="btn sm" to={`/flashcards?topic=${topic.id}`}>
              <Layers size={15} aria-hidden="true" /> Flashcards
            </Link>
            <Link className="btn sm" to={`/practice?topic=${topic.id}`}>
              <PenLine size={15} aria-hidden="true" /> Practice
            </Link>
          </>
        }
      />

      <div className="card">
        <div className="row between">
          <span className="topic-meta">
            <Badge tone="outline">{topic.code}</Badge>
            {topic.sample ? <Badge tone="amber">Sample</Badge> : <Badge tone="green">Course reading</Badge>}
          </span>
          <small className="muted">
            {readCount}/{topic.subtopics.length} sections read
          </small>
        </div>
        <ProgressBar
          value={topic.subtopics.length ? (readCount / topic.subtopics.length) * 100 : 0}
        />
      </div>

      <div className="accordion">
        {topic.subtopics.map((s) => {
          const open = openIds.includes(s.id);
          const isRead = progress.subtopicsRead.includes(s.id);
          return (
            <section key={s.id} className={`acc-item${open ? ' open' : ''}`}>
              <button
                type="button"
                className="acc-head"
                aria-expanded={open}
                onClick={() => toggleOpen(s.id)}
              >
                <span className="acc-title">
                  {isRead ? (
                    <CheckCircle2 size={17} aria-hidden="true" className="read" />
                  ) : (
                    <Circle size={17} aria-hidden="true" />
                  )}
                  {s.title}
                </span>
                <ChevronDown size={17} aria-hidden="true" />
              </button>
              {open ? (
                <div className="acc-body">
                  <p className="muted">{s.summary}</p>
                  <div className="row between">
                    <small className="muted">
                      <Clock size={14} aria-hidden="true" /> {s.readingTimeMinutes} min read
                    </small>
                    <button
                      type="button"
                      className={`btn sm${isRead ? '' : ' primary'}`}
                      onClick={() => handleToggleRead(s.id)}
                    >
                      {isRead ? (
                        <>
                          <CheckCircle2 size={15} aria-hidden="true" /> Mark as unread
                        </>
                      ) : (
                        <>
                          <Circle size={15} aria-hidden="true" /> Mark as read
                        </>
                      )}
                    </button>
                  </div>

                  {s.definitions.length > 0 ? (
                    <>
                      <h3>Definitions</h3>
                      <dl className="def-list">
                        {s.definitions.map((d) => (
                          <div key={d.term}>
                            <dt>{d.term}</dt>
                            <dd>{d.definition}</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  ) : null}

                  {s.keyArguments.length > 0 ? (
                    <>
                      <h3>Key arguments</h3>
                      <ol className="arg-list">
                        {s.keyArguments.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ol>
                    </>
                  ) : null}

                  {s.scholars.length > 0 ? (
                    <>
                      <h3>Scholars</h3>
                      <ul className="scholar-list">
                        {s.scholars.map((sc) => (
                          <li key={`${sc.name}-${sc.contribution}`}>
                            <strong>{sc.name}</strong>
                            <span>{sc.contribution}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {s.examples.length > 0 ? (
                    <>
                      <h3>Examples</h3>
                      <ul className="example-list">
                        {s.examples.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}

                  {s.takeaways.length > 0 ? (
                    <>
                      <h3>Takeaways</h3>
                      <ul className="take-list">
                        {s.takeaways.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <nav className="pager" aria-label="Topic navigation">
        {prev ? (
          <Link className="btn sm" to={`/reviewer/${prev.id}`}>
            <ArrowLeft size={15} aria-hidden="true" /> {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="btn sm" to={`/reviewer/${next.id}`}>
            {next.title} <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
