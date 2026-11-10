import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ExternalLink,
  GraduationCap,
  HelpCircle,
  Highlighter,
  Layers,
  PenLine,
  Quote,
  Search,
  Sparkles,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import { readingById } from '../data/readings';
import { topicById } from '../data/topics';
import { writtenQuestions } from '../data/written';
import { KIND_LABEL } from '../utils/grading';
import type { WrittenKind } from '../types';
import { useStudy } from '../store/study';
import { Badge, EmptyState, PageHeader, ProgressBar } from '../components/ui';
import type { Annotation } from '../types';

type ReaderMode = 'pdf' | 'text' | 'guided';

function clampPage(n: number, total: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(1, Math.floor(n)), Math.max(1, total));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderWithMarks(
  text: string,
  query: string,
  firstMark: { used: boolean },
): ReactNode {
  const q = query.trim();
  if (q === '') return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'gi'));
  const test = new RegExp(`^${escapeRegExp(q)}$`, 'i');
  return parts.map((part, i) => {
    if (!test.test(part)) return <span key={i}>{part}</span>;
    if (!firstMark.used) {
      firstMark.used = true;
      return (
        <mark key={i} id="reader-match">
          {part}
        </mark>
      );
    }
    return <mark key={i}>{part}</mark>;
  });
}

interface FoundSegment {
  start: number;
  end: number;
  anno: Annotation;
}

function renderGuidedParagraph(
  para: string,
  annos: Annotation[],
  query: string,
  firstMark: { used: boolean },
  selectedId: string | null,
  onSelect: (id: string) => void,
): ReactNode {
  const found: FoundSegment[] = [];
  for (const anno of annos) {
    if (anno.passage === '') continue;
    const idx = para.indexOf(anno.passage);
    if (idx >= 0) found.push({ start: idx, end: idx + anno.passage.length, anno });
  }
  found.sort((a, b) => a.start - b.start);
  const kept: FoundSegment[] = [];
  for (const seg of found) {
    const prev = kept[kept.length - 1];
    if (!prev || seg.start >= prev.end) kept.push(seg);
  }
  if (kept.length === 0) return renderWithMarks(para, query, firstMark);

  const out: ReactNode[] = [];
  let cursor = 0;
  kept.forEach((seg, i) => {
    if (seg.start > cursor) {
      out.push(
        <span key={`t${i}`}>{renderWithMarks(para.slice(cursor, seg.start), query, firstMark)}</span>,
      );
    }
    out.push(
      <button
        key={`h${i}`}
        type="button"
        className={`hl hl-${seg.anno.category}${selectedId === seg.anno.id ? ' active' : ''}`}
        title={seg.anno.title}
        onClick={() => onSelect(seg.anno.id)}
      >
        {seg.anno.passage}
      </button>,
    );
    cursor = seg.end;
  });
  if (cursor < para.length) {
    out.push(
      <span key="tail">{renderWithMarks(para.slice(cursor), query, firstMark)}</span>,
    );
  }
  return out;
}

export function ReadingPage() {
  const { readingId } = useParams<{ readingId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const reading = readingId ? readingById(readingId) : undefined;
  const totalPages = reading?.totalPages ?? 1;

  const {
    progress,
    toggleBookmark,
    addNote,
    deleteNote,
    toggleSavedConcept,
    toggleReadingComplete,
    recordSession,
  } = useStudy();

  const [mode, setMode] = useState<ReaderMode>('guided');
  const [page, setPage] = useState<number>(() =>
    clampPage(Number(searchParams.get('page') ?? '1'), totalPages),
  );
  const [pageInput, setPageInput] = useState<string>(String(page));
  const [query, setQuery] = useState<string>('');
  const [matchIdx, setMatchIdx] = useState<number>(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [noteQuote, setNoteQuote] = useState<string>('');

  // Honor ?page=N whenever it changes.
  useEffect(() => {
    setPage(clampPage(Number(searchParams.get('page') ?? '1'), totalPages));
  }, [searchParams, totalPages]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  const gotoPage = (n: number): void => {
    const clamped = clampPage(n, totalPages);
    setPage(clamped);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(clamped));
        return next;
      },
      { replace: true },
    );
  };

  const matchPages = useMemo<number[]>(() => {
    if (!reading) return [];
    const q = query.trim().toLowerCase();
    if (q === '') return [];
    return reading.content.pages
      .filter((p) => p.paragraphs.join('\n').toLowerCase().includes(q))
      .map((p) => p.page);
  }, [reading, query]);

  useEffect(() => {
    setMatchIdx(0);
  }, [query]);

  useEffect(() => {
    document.getElementById('reader-match')?.scrollIntoView({ block: 'center' });
  }, [matchIdx, page, query, mode]);

  if (!reading) {
    return (
      <div className="page">
        <Link className="link back" to="/review">
          <ArrowLeft size={16} aria-hidden="true" /> Back to library
        </Link>
        <EmptyState
          title="Reading not found"
          description={
            readingId
              ? `No reading matches "${readingId}". It may have been renamed or removed.`
              : 'No reading was selected.'
          }
          action={
            <Link className="btn primary sm" to="/review">
              Back to library
            </Link>
          }
        />
      </div>
    );
  }

  const topic = topicById(reading.topicId);
  const contentPage = reading.content.pages.find((p) => p.page === page);
  const pageAnnos = reading.annotations.filter((a) => a.page === page);
  const selected: Annotation | undefined = reading.annotations.find((a) => a.id === selectedId);
  const isBookmarked = progress.bookmarks.some(
    (b) => b.readingId === reading.id && b.page === page,
  );
  const isComplete = progress.readingsComplete.includes(reading.id);
  const isLastPage = page >= totalPages;
  const myBookmarks = progress.bookmarks
    .filter((b) => b.readingId === reading.id)
    .sort((a, b) => a.page - b.page);
  const myNotes = progress.notes.filter((n) => n.readingId === reading.id);
  const savedAnnos = reading.annotations.filter((a) => progress.savedConcepts.includes(a.id));
  const keyArguments = topic?.subtopics.flatMap((s) => s.keyArguments).slice(0, 6) ?? [];
  const tocHasPage = reading.content.toc.some((e) => e.page === page);
  const firstMark = { used: false };

  const jumpMatch = (dir: 1 | -1): void => {
    if (matchPages.length === 0) return;
    const next = (matchIdx + dir + matchPages.length) % matchPages.length;
    setMatchIdx(next);
    gotoPage(matchPages[next]);
  };

  const handleToggleComplete = (): void => {
    toggleReadingComplete(reading.id);
    if (!isComplete) {
      const now = new Date().toISOString();
      recordSession({
        kind: 'reading',
        topicId: reading.topicId,
        readingId: reading.id,
        startedAt: now,
        endedAt: now,
        totalItems: 1,
        correctItems: 1,
      });
    }
  };

  const handleAddNote = (): void => {
    const text = noteText.trim();
    if (text === '') return;
    const quote = noteQuote.trim();
    addNote(reading.id, page, text, quote === '' ? undefined : quote);
    setNoteText('');
    setNoteQuote('');
  };

  const handleCaptureQuote = (): void => {
    const sel = window.getSelection()?.toString().trim() ?? '';
    if (sel !== '') setNoteQuote(sel.slice(0, 500));
  };

  const handleDeleteNote = (id: string): void => {
    if (window.confirm('Delete this note?')) deleteNote(id);
  };

  const commitPageInput = (): void => {
    gotoPage(Number(pageInput));
  };

  const toneFor = (category: Annotation['category']): 'neutral' | 'green' | 'amber' => {
    if (category === 'exam') return 'amber';
    if (category === 'argument') return 'green';
    return 'neutral';
  };

  return (
    <div className="page reader">
      <Link className="link back" to="/review">
        <ArrowLeft size={16} aria-hidden="true" /> Back to library
      </Link>

      <PageHeader
        eyebrow={`${reading.docNumber} · ${reading.author}`}
        title={reading.title}
        description={reading.overview}
        actions={
          <>
            <a className="btn sm" href={reading.pdfFile} target="_blank" rel="noreferrer">
              <ExternalLink size={15} aria-hidden="true" /> Open original
            </a>
            <Link className="btn sm" to={`/flashcards?topic=${reading.topicId}`}>
              <Layers size={15} aria-hidden="true" /> Flashcards
            </Link>
            <Link className="btn sm" to={`/exam/run?bank=${reading.id}&mode=practice`}>
              <PenLine size={15} aria-hidden="true" /> Practice exam
            </Link>
          </>
        }
      />

      <div className="reader-bar">
        <div className="reader-modes" role="tablist" aria-label="Reader mode">
          {(['pdf', 'text', 'guided'] as ReaderMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              className={`btn sm${mode === m ? ' primary' : ''}`}
              onClick={() => setMode(m)}
            >
              {m === 'pdf' ? 'PDF' : m === 'text' ? 'Text' : 'Guided'}
            </button>
          ))}
        </div>
        <div className="row">
          <button type="button" className="btn sm" onClick={() => toggleBookmark(reading.id, page)}>
            {isBookmarked ? (
              <>
                <BookmarkCheck size={15} aria-hidden="true" /> Bookmarked
              </>
            ) : (
              <>
                <Bookmark size={15} aria-hidden="true" /> Bookmark page
              </>
            )}
          </button>
          <button
            type="button"
            className={`btn sm${isComplete ? '' : ' primary'}`}
            onClick={handleToggleComplete}
          >
            {isComplete ? (
              <>
                <CheckCircle2 size={15} aria-hidden="true" /> Completed
              </>
            ) : (
              <>
                <Circle size={15} aria-hidden="true" /> Mark reading complete
              </>
            )}
          </button>
        </div>
      </div>

      <div className="reader-grid">
        <div className="reader-main">
          {mode === 'pdf' ? (
            <div className="reader-pdf">
              <iframe src={reading.pdfFile} title={`${reading.title} (PDF)`} />
              <div className="row">
                <a className="btn sm" href={reading.pdfFile} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} aria-hidden="true" /> Open original in new tab
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="reader-toc">
                <label>
                  <span className="muted">Contents</span>
                  <select
                    className="select"
                    value={tocHasPage ? String(page) : `page-${page}`}
                    onChange={(e) => {
                      const v = e.target.value;
                      gotoPage(Number(v.startsWith('page-') ? v.slice(5) : v));
                    }}
                    aria-label="Table of contents"
                  >
                    {!tocHasPage ? (
                      <option value={`page-${page}`}>Page {page}</option>
                    ) : null}
                    {reading.content.toc.map((entry) => (
                      <option key={`${entry.page}-${entry.label}`} value={String(entry.page)}>
                        {entry.label} (p. {entry.page})
                      </option>
                    ))}
                  </select>
                </label>
                <div className="reader-search">
                  <Search size={15} aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    placeholder="Search in this reading…"
                    aria-label="Search in this reading"
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query.trim() !== '' && (
                    <span className="muted">
                      {matchPages.length === 0
                        ? 'no matches'
                        : `match ${matchIdx + 1}/${matchPages.length}`}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn sm"
                    disabled={matchPages.length === 0}
                    onClick={() => jumpMatch(-1)}
                    aria-label="Previous match"
                  >
                    <ChevronLeft size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn sm"
                    disabled={matchPages.length === 0}
                    onClick={() => jumpMatch(1)}
                    aria-label="Next match"
                  >
                    <ChevronRight size={15} aria-hidden="true" />
                  </button>
                  {query !== '' && (
                    <button type="button" className="btn sm" onClick={() => setQuery('')}>
                      <X size={15} aria-hidden="true" /> Clear
                    </button>
                  )}
                </div>
              </div>

              <article className="reader-text" aria-label={`Page ${page}`}>
                <div className="reader-page">
                  <small className="muted">
                    Page {page} of {totalPages}
                    {contentPage?.heading ? ` · ${contentPage.heading}` : ''}
                    {mode === 'guided' && pageAnnos.length > 0
                      ? ` · ${pageAnnos.length} guided concepts`
                      : ''}
                  </small>
                  {contentPage ? (
                    contentPage.paragraphs.map((para, i) => (
                      <p key={i}>
                        {mode === 'guided'
                          ? renderGuidedParagraph(
                              para,
                              pageAnnos,
                              query,
                              firstMark,
                              selectedId,
                              (id) => setSelectedId(id),
                            )
                          : renderWithMarks(para, query, firstMark)}
                      </p>
                    ))
                  ) : (
                    <p className="muted">
                      Page text for p. {page} has not been transcribed yet. Use PDF mode to read
                      the original.
                    </p>
                  )}
                </div>
              </article>

              <nav className="reader-pager" aria-label="Page navigation">
                <button
                  type="button"
                  className="btn sm"
                  disabled={page <= 1}
                  onClick={() => gotoPage(page - 1)}
                >
                  <ChevronLeft size={15} aria-hidden="true" /> Prev
                </button>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitPageInput();
                  }}
                >
                  <input
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={commitPageInput}
                    inputMode="numeric"
                    aria-label="Go to page"
                    size={4}
                  />
                  <span className="muted"> / {totalPages}</span>
                </form>
                <button
                  type="button"
                  className="btn sm"
                  disabled={page >= totalPages}
                  onClick={() => gotoPage(page + 1)}
                >
                  Next <ChevronRight size={15} aria-hidden="true" />
                </button>
                <div className="pager-progress">
                  <ProgressBar value={(page / totalPages) * 100} />
                </div>
              </nav>

              {isLastPage && (
                <section className="complete-banner" aria-label="Reading complete">
                  <h2>
                    <Sparkles size={17} aria-hidden="true" /> You reached the end — lock it in
                  </h2>
                  <p>
                    <strong>Main argument:</strong> {reading.thesis}
                  </p>
                  <h3>Top concepts</h3>
                  <ul>
                    {reading.annotations.slice(0, 8).map((a) => (
                      <li key={a.id}>{a.title}</li>
                    ))}
                  </ul>
                  <h3>Takeaways</h3>
                  <ul>
                    {reading.takeaways.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <h3>Exam questions to try</h3>
                  <ul>
                    {reading.examQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                  <div className="row">
                    <button
                      type="button"
                      className={`btn sm${isComplete ? '' : ' primary'}`}
                      onClick={handleToggleComplete}
                    >
                      {isComplete ? 'Completed' : 'Mark reading complete'}
                    </button>
                    <Link className="btn sm" to={`/flashcards?topic=${reading.topicId}`}>
                      <Layers size={15} aria-hidden="true" /> Flashcards
                    </Link>
                    <Link className="btn sm" to={`/exam/run?bank=${reading.id}&mode=practice`}>
                      <PenLine size={15} aria-hidden="true" /> Practice exam
                    </Link>
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <aside className="companion" aria-label="Reading companion">
          {selected && (
            <section className="anno-panel" aria-label="Concept guide">
              <div className="row between">
                <Badge tone={toneFor(selected.category)}>{selected.category}</Badge>
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close concept panel"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
              <h2>{selected.title}</h2>
              <small className="muted">Page {selected.page}</small>
              <blockquote>“{selected.passage}”</blockquote>
              <h3>Guide explanation</h3>
              <p>{selected.explanation}</p>
              <h3>Why it matters</h3>
              <p>{selected.whyItMatters}</p>
              {selected.examAngle && (
                <>
                  <h3>
                    <GraduationCap size={15} aria-hidden="true" /> Potential exam angle
                  </h3>
                  <p>{selected.examAngle}</p>
                </>
              )}
              {selected.relatedConcepts.length > 0 && (
                <>
                  <h3>Related concepts</h3>
                  <div className="row">
                    {selected.relatedConcepts.map((c) => (
                      <Badge key={c}>{c}</Badge>
                    ))}
                  </div>
                </>
              )}
              <div className="row">
                <button
                  type="button"
                  className="btn sm"
                  onClick={() => toggleSavedConcept(selected.id)}
                >
                  <Highlighter size={15} aria-hidden="true" />{' '}
                  {progress.savedConcepts.includes(selected.id) ? 'Saved' : 'Save concept'}
                </button>
                <Link className="btn sm" to={`/flashcards?topic=${reading.topicId}`}>
                  <Layers size={15} aria-hidden="true" /> Flashcards
                </Link>
                <Link className="btn sm" to={`/exam/run?bank=${reading.id}&mode=practice`}>
                  <HelpCircle size={15} aria-hidden="true" /> Related quiz
                </Link>
              </div>
            </section>
          )}

          <section className="companion-section">
            <h2>Overview</h2>
            <p className="muted">{reading.overview}</p>
            <h3>Thesis</h3>
            <p>{reading.thesis}</p>
          </section>

          {keyArguments.length > 0 && (
            <section className="companion-section">
              <h2>Key arguments</h2>
              <ol>
                {keyArguments.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ol>
              {topic && (
                <Link className="link" to={`/reviewer/${topic.id}`}>
                  Open topic notes
                </Link>
              )}
            </section>
          )}

          <section className="companion-section">
            <h2>Takeaways</h2>
            <ul>
              {reading.takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>

          <section className="companion-section">
            <h2>
              <GraduationCap size={15} aria-hidden="true" /> Exam questions
            </h2>
            <ol>
              {reading.examQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </section>

          <section className="companion-section">
            <h2>
              <GraduationCap size={15} aria-hidden="true" /> Exam Preparation Guide
            </h2>
            <p className="muted">
              Potential examination points from this reading — practice prompts, not guaranteed
              exam questions.
            </p>
            {(['enumerate', 'define', 'identify', 'explain'] as WrittenKind[]).map((kind) => {
              const items = writtenQuestions.filter(
                (q) => q.readingId === reading.id && q.kind === kind,
              );
              if (items.length === 0) return null;
              const verb =
                kind === 'enumerate'
                  ? 'What to enumerate'
                  : kind === 'define'
                    ? 'Terms to define'
                    : kind === 'identify'
                      ? 'People, concepts & institutions to identify'
                      : 'Arguments to explain';
              return (
                <div key={kind} className="guide-kind">
                  <h3>{verb}</h3>
                  <ul>
                    {items.map((q) => (
                      <li key={q.id}>
                        {q.prompt}
                        {q.pageRef ? <small className="muted"> ({q.pageRef})</small> : null}
                      </li>
                    ))}
                  </ul>
                  <Link
                    className="link"
                    to={`/exam/run?bank=${reading.id}&mode=practice&format=${kind}&count=all&timelimit=0`}
                  >
                    Practice {KIND_LABEL[kind]} questions
                  </Link>
                </div>
              );
            })}
          </section>

          <section className="companion-section">
            <h2>Author says vs guide explains</h2>
            <p className="muted">
              Plain text is the author&apos;s voice. Highlighted passages carry a guide note —
              click any highlight to read the explanation, why it matters, and the exam angle.
            </p>
          </section>

          <section className="companion-section">
            <h2>
              <StickyNote size={15} aria-hidden="true" /> My notes (p. {page})
            </h2>
            <div className="note-form">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a note about this page…"
                aria-label="Note text"
                rows={3}
              />
              <input
                value={noteQuote}
                onChange={(e) => setNoteQuote(e.target.value)}
                placeholder="Optional quote (or capture a selection)"
                aria-label="Note quote"
              />
              <div className="row">
                <button type="button" className="btn sm" onClick={handleCaptureQuote}>
                  <Quote size={15} aria-hidden="true" /> Quote selection
                </button>
                <button
                  type="button"
                  className="btn sm primary"
                  disabled={noteText.trim() === ''}
                  onClick={handleAddNote}
                >
                  Add note
                </button>
              </div>
            </div>
            {myNotes.length === 0 ? (
              <p className="muted">No notes for this reading yet.</p>
            ) : (
              <ul>
                {myNotes.map((n) => (
                  <li key={n.id} className="note-item">
                    <small className="muted">p. {n.page}</small>
                    {n.quote && <blockquote>“{n.quote}”</blockquote>}
                    <p>{n.text}</p>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => handleDeleteNote(n.id)}
                    >
                      <Trash2 size={14} aria-hidden="true" /> Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="companion-section">
            <h2>
              <Bookmark size={15} aria-hidden="true" /> Bookmarks
            </h2>
            {myBookmarks.length === 0 ? (
              <p className="muted">No bookmarks yet. Bookmark pages to jump back to them.</p>
            ) : (
              <ul className="bookmark-list">
                {myBookmarks.map((b) => (
                  <li key={`${b.readingId}-${b.page}`}>
                    <button type="button" className="link" onClick={() => gotoPage(b.page)}>
                      Page {b.page}
                    </button>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => toggleBookmark(reading.id, b.page)}
                      aria-label={`Remove bookmark on page ${b.page}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="companion-section">
            <h2>
              <Highlighter size={15} aria-hidden="true" /> Saved concepts
            </h2>
            {savedAnnos.length === 0 ? (
              <p className="muted">Save concepts from the guide panel to review them here.</p>
            ) : (
              <ul className="bookmark-list">
                {savedAnnos.map((a) => (
                  <li key={a.id}>
                    <button type="button" className="link" onClick={() => {
                      gotoPage(a.page);
                      setSelectedId(a.id);
                    }}>
                      {a.title} (p. {a.page})
                    </button>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => toggleSavedConcept(a.id)}
                      aria-label={`Unsave ${a.title}`}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
