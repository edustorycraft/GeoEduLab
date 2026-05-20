import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import {
  LayoutDashboard,
  Mountain,
  CircleDot,
  Zap,
  Layers,
  Route,
  Menu,
  X,
  FlaskConical,
} from 'lucide-react'
import { useEffect } from 'react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/triaxial', label: 'Triaxial Test', icon: Mountain },
  { path: '/mohr', label: 'Mohr Circle Analysis', icon: CircleDot },
  { path: '/ucs', label: 'UCS Test', icon: Zap },
  { path: '/classification', label: 'Soil Classification', icon: Layers },
  { path: '/field-lab', label: 'Field to Lab', icon: Route },
]

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, setMobileOpen])

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 z-40 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-eng-500 to-eng-700 flex items-center justify-center">
              <FlaskConical className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-slate-900 dark:text-white leading-tight">GeoLabX</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase">Virtual Laboratory</p>
            </div>
            <button className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X size={20} className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-eng-50 dark:bg-eng-900/30 text-eng-700 dark:text-eng-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-eng-600 dark:text-eng-400' : ''} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="text-base">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
