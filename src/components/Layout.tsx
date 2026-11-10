import { Fragment, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Library,
  Menu,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useStudy } from '../store/study';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end: boolean;
  center?: boolean;
}

interface NavGroup {
  label: string | null;
  links: NavItem[];
}

const groups: NavGroup[] = [
  {
    label: null,
    links: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Centers',
    links: [
      { to: '/review', label: 'Review Center', icon: Library, end: false, center: true },
      { to: '/exam', label: 'Practice Exam Center', icon: ClipboardList, end: false, center: true },
    ],
  },
  {
    label: null,
    links: [
      { to: '/flashcards', label: 'Flashcards', icon: Layers, end: false },
      { to: '/progress', label: 'Study Progress', icon: BarChart3, end: false },
    ],
  },
];

function isActivePath(pathname: string, to: string, end: boolean): boolean {
  if (pathname === to) return true;
  if (end) return false;
  return pathname.startsWith(`${to}/`);
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <GraduationCap size={18} />
      </span>
      <span className="brand-text">
        <strong>POLSCI 157</strong>
        <small>Study Reviewer</small>
      </span>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { overallPct } = useStudy();

  const closeAndGo = (to: string) => {
    setOpen(false);
    if (location.pathname !== to) navigate(to);
  };

  return (
    <div className="shell">
      <aside className="side" aria-label="Primary">
        <Brand />
        <nav className="nav">
          {groups.map((g, i) => (
            <Fragment key={g.label ?? `g-${i}`}>
              {g.label ? <p className="nav-group">{g.label}</p> : null}
              {g.links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `nav-link${l.center ? ' center-link' : ''}${isActive ? ' active' : ''}`
                  }
                >
                  <l.icon size={17} aria-hidden="true" />
                  {l.label}
                </NavLink>
              ))}
            </Fragment>
          ))}
        </nav>
        <div className="side-foot">
          <div className="side-progress">
            <span>Overall progress</span>
            <strong>{overallPct}%</strong>
          </div>
          <div className="bar small" role="progressbar" aria-valuenow={overallPct} aria-valuemin={0} aria-valuemax={100}>
            <div className="bar-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <p className="side-note">Progress saves in this browser automatically.</p>
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={19} />
          </button>
          <button type="button" className="topbar-brand" onClick={() => closeAndGo('/')} aria-label="Go to dashboard">
            <GraduationCap size={17} aria-hidden="true" />
            <strong>POLSCI 157</strong>
          </button>
          <span className="topbar-pct" aria-label={`Overall progress ${overallPct} percent`}>
            {overallPct}%
          </span>
        </header>

        <main className="main">{children}</main>
        <footer className="foot">
          <p>POLSCI 157 Reviewer · Andrea&apos;s personal review center.</p>
        </footer>
      </div>

      {open ? (
        <div className="drawer-backdrop" onClick={() => setOpen(false)}>
          <div
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <Brand />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
              >
                <X size={19} />
              </button>
            </div>
            <nav className="nav">
              {groups.map((g, i) => (
                <Fragment key={g.label ?? `g-${i}`}>
                  {g.label ? <p className="nav-group">{g.label}</p> : null}
                  {g.links.map((l) => (
                    <button
                      key={l.to}
                      type="button"
                      onClick={() => closeAndGo(l.to)}
                      className={`nav-link as-button${l.center ? ' center-link' : ''}${isActivePath(location.pathname, l.to, l.end) ? ' active' : ''}`}
                    >
                      <l.icon size={17} aria-hidden="true" />
                      {l.label}
                    </button>
                  ))}
                </Fragment>
              ))}
            </nav>
            <p className="side-note">Overall progress · {overallPct}%</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
