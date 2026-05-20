import { ArrowRight, Database, FileText, Settings2 } from 'lucide-react'

export default function Card({ title, description, icon: Icon, color = 'blue', href, onLaunch }) {
  const colors = {
    blue: 'from-eng-500 to-eng-600',
    amber: 'from-soil-400 to-soil-600',
    emerald: 'from-emerald-400 to-emerald-600',
    purple: 'from-purple-500 to-purple-700',
    rose: 'from-rose-400 to-rose-600',
    slate: 'from-slate-400 to-slate-600',
  }

  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <Icon size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white mb-1">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={onLaunch}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-eng-600 hover:bg-eng-700 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-sm hover:shadow"
          >
            Launch Module
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </article>
  )
}
