import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { SAMPLE_NOTICE, topics } from '../data/topics';
import { useStudy } from '../store/study';
import { Badge, PageHeader, ProgressBar, SampleNotice, SearchInput, EmptyState } from '../components/ui';

export function ReviewerList() {
  const [query, setQuery] = useState('');
  const { progress } = useStudy();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((t) => {
      const hay = [
        t.title,
        t.description,
        t.code,
        ...t.subtopics.map((s) => `${s.title} ${s.summary}`),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Course Reviewer"
        title="Structured notes, built for revision."
        description="Search topics, open a subtopic, and mark sections read as you finish them."
        actions={
          <SearchInput value={query} onChange={setQuery} placeholder="Search topics…" label="Search reviewer topics" />
        }
      />
      <SampleNotice text={SAMPLE_NOTICE} />

      {filtered.length === 0 ? (
        <EmptyState
          title="No topics match your search"
          description={`Nothing in the reviewer matches “${query}”. Try a shorter term or clear the search.`}
          action={
            <button type="button" className="btn sm" onClick={() => setQuery('')}>
              Clear search
            </button>
          }
        />
      ) : (
        <section className="topic-list">
          {filtered.map((t) => {
            const read = t.subtopics.filter((s) => progress.subtopicsRead.includes(s.id)).length;
            return (
              <Link key={t.id} className="topic-row" to={`/reviewer/${t.id}`}>
                <span className="topic-icon" aria-hidden="true">
                  <BookOpen size={18} />
                </span>
                <span className="topic-main">
                  <span className="topic-meta">
                    <Badge tone="outline">{t.code}</Badge>
                    {t.sample ? <Badge tone="amber">Sample</Badge> : null}
                    <small className="muted">
                      {read}/{t.subtopics.length} sections read
                    </small>
                  </span>
                  <strong>{t.title}</strong>
                  <small className="muted">{t.description}</small>
                  <ProgressBar value={t.subtopics.length ? (read / t.subtopics.length) * 100 : 0} />
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            );
          })}
        </section>
      )}

      <section className="card legend">
        <h2>How to read an entry</h2>
        <ul>
          <li>
            <CheckCircle2 size={15} aria-hidden="true" /> <strong>Definitions</strong> are the exact
            wording to memorize.
          </li>
          <li>
            <Circle size={15} aria-hidden="true" /> <strong>Arguments</strong> are the claims you
            would defend in an essay.
          </li>
          <li>
            <Circle size={15} aria-hidden="true" /> <strong>Examples</strong> are the cases that
            make an argument concrete.
          </li>
        </ul>
      </section>
    </div>
  );
}
