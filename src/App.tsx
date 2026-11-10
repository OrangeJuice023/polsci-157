import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PageHeader } from './components/ui';
import { StudyProvider } from './store/study';
import { Dashboard } from './pages/Dashboard';
import { ReviewCenter } from './pages/ReviewCenter';
import { ReadingPage } from './pages/ReadingPage';
import { ReviewerList } from './pages/ReviewerList';
import { ReviewerDetail } from './pages/ReviewerDetail';
import { Flashcards } from './pages/Flashcards';
import { ExamCenter } from './pages/ExamCenter';
import { ExamRunner } from './pages/ExamRunner';
import { Practice } from './pages/Practice';
import { Progress } from './pages/Progress';

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
        </Layout>
      </StudyProvider>
    </BrowserRouter>
  );
}
