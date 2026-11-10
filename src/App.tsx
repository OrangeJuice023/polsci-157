import { Suspense, lazy } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PageHeader } from './components/ui';
import { StudyProvider } from './store/study';
import { Dashboard } from './pages/Dashboard';
import { Practice } from './pages/Practice';

const ReviewCenter = lazy(() => import('./pages/ReviewCenter').then((m) => ({ default: m.ReviewCenter })));
const ReadingPage = lazy(() => import('./pages/ReadingPage').then((m) => ({ default: m.ReadingPage })));
const ReviewerList = lazy(() => import('./pages/ReviewerList').then((m) => ({ default: m.ReviewerList })));
const ReviewerDetail = lazy(() => import('./pages/ReviewerDetail').then((m) => ({ default: m.ReviewerDetail })));
const Flashcards = lazy(() => import('./pages/Flashcards').then((m) => ({ default: m.Flashcards })));
const ExamCenter = lazy(() => import('./pages/ExamCenter').then((m) => ({ default: m.ExamCenter })));
const ExamRunner = lazy(() => import('./pages/ExamRunner').then((m) => ({ default: m.ExamRunner })));
const Progress = lazy(() => import('./pages/Progress').then((m) => ({ default: m.Progress })));

function RouteFallback() {
  return (
    <div className="page">
      <div className="empty" aria-busy="true" aria-live="polite">
        <p>Loading…</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="404"
        title="Page not found"
        description="That page doesn't exist. Head back to the dashboard to keep studying."
        actions={
          <Link className="btn primary sm" to="/">
            Go home
          </Link>
        }
      />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <StudyProvider>
        <Layout>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/review" element={<ReviewCenter />} />
              <Route path="/read/:readingId" element={<ReadingPage />} />
              <Route path="/reviewer" element={<ReviewerList />} />
              <Route path="/reviewer/:topicId" element={<ReviewerDetail />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/exam" element={<ExamCenter />} />
              <Route path="/exam/run" element={<ExamRunner />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </StudyProvider>
    </BrowserRouter>
  );
}
