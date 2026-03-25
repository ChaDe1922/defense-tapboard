import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useGame } from '../lib/GameContext';

function ZapIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}
function BarChartIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20V10" /><path d="M12 20V4" /><path d="M20 20v-6" />
    </svg>
  );
}
function SettingsIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

const navItems = [
  { to: '/', label: 'Entry', icon: ZapIcon },
  { to: '/dashboard', label: 'Dashboard', icon: BarChartIcon },
  { to: '/setup', label: 'Setup', icon: SettingsIcon },
];

export default function Layout() {
  const location = useLocation();
  const isEntry = location.pathname === '/';
  const { toast } = useGame();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col relative">
      {/* Global toast overlay */}
      {toast && (
        <div className="fixed left-4 right-4 top-4 z-50 rounded-xl bg-slate-900 px-4 py-3 text-base font-medium text-white shadow-lg animate-slide-in md:left-auto md:right-6 md:max-w-sm pointer-events-none">
          {toast}
        </div>
      )}
      {/* Desktop top nav — hidden on mobile */}
      <header className="hidden md:block sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900 text-sm">Defense Tapboard</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Page content */}
      {isEntry ? (
        <div className="mx-auto w-full max-w-5xl flex-1 flex flex-col h-[calc(100vh-0px)] md:h-[calc(100vh-57px)]">
          <Outlet />
          {/* Mobile bottom nav — hidden on desktop */}
          <nav className="md:hidden shrink-0 border-t border-slate-200 bg-white">
            <div className="flex items-center justify-around h-14">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 px-4 py-1.5 text-[10px] font-medium transition-colors ${
                      isActive ? 'text-violet-600' : 'text-slate-400'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-5xl flex-1 flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <nav className="md:hidden shrink-0 border-t border-slate-200 bg-white sticky bottom-0">
            <div className="flex items-center justify-around h-14">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 px-4 py-1.5 text-[10px] font-medium transition-colors ${
                      isActive ? 'text-violet-600' : 'text-slate-400'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
