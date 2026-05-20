import { createContext, useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const DarkModeContext = createContext();

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('geolabx-dark') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('geolabx-dark', dark); } catch {}
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const toggle = () => setDark((p) => !p);
  return <DarkModeContext.Provider value={{ dark, toggle }}>{children}</DarkModeContext.Provider>;
}

export const useDarkMode = () => useContext(DarkModeContext);

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/triaxial', label: 'Triaxial Test' },
  { to: '/mohr', label: 'Mohr Circle' },
  { to: '/ucs', label: 'UCS Test' },
  { to: '/classification', label: 'Soil Classification' },
];

export default function Navbar() {
  const { dark, toggle } = useDarkMode();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMenuOpen(false)}>
            <div className="w-8 h-8 bg-engineering-600 rounded-lg flex items-center justify-center text-white font-heading text-sm font-bold">GX</div>
            <span className="font-heading text-lg font-bold text-gray-900 dark:text-white">GeoLabX</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === l.to
                    ? 'bg-engineering-50 dark:bg-engineering-900/30 text-engineering-700 dark:text-engineering-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Toggle dark mode"
            >
              {dark ? '\u2600' : '\u263D'}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-3 border-t border-gray-100 dark:border-gray-700 pt-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === l.to
                    ? 'bg-engineering-50 dark:bg-engineering-900/30 text-engineering-700 dark:text-engineering-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
