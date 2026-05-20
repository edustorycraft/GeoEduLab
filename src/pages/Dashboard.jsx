import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import {
  Mountain,
  CircleDot,
  Zap,
  Layers,
  Route,
  Beaker,
  Info,
} from 'lucide-react'

const modules = [
  {
    title: 'Triaxial Test Simulator',
    description: 'Simulate UU, CU, and CD triaxial shear tests. Visualise stress-strain curves, Mohr circles, and failure envelopes.',
    icon: Mountain,
    color: 'blue',
    path: '/triaxial',
  },
  {
    title: 'Mohr Circle Analysis',
    description: 'Interactive Mohr circle tool. Plot total and effective stress states, determine principal stresses and shear parameters.',
    icon: CircleDot,
    color: 'amber',
    path: '/mohr',
  },
  {
    title: 'Unconfined Compression Test',
    description: 'Determine peak strength and undrained shear strength. Generate stress-strain graphs from laboratory data.',
    icon: Zap,
    color: 'emerald',
    path: '/ucs',
  },
  {
    title: 'Soil Classification',
    description: 'Classify soils using USCS, Atterberg limits, and grain size distribution. Plot on Casagrande plasticity chart.',
    icon: Layers,
    color: 'purple',
    path: '/classification',
  },
  {
    title: 'Field to Lab Workflow',
    description: 'Visual guide from site investigation through sample collection, transportation, laboratory testing, and engineering interpretation.',
    icon: Route,
    color: 'rose',
    path: '/field-lab',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Beaker className="text-eng-500" size={28} />
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-slate-900 dark:text-white">
            GeoLabX Dashboard
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
          Virtual geotechnical laboratory modules for undergraduate soil mechanics and geotechnical engineering.
          Select a module below to begin your laboratory session.
        </p>
      </div>

      {/* Quick info card */}
      <div className="bg-gradient-to-r from-eng-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border border-eng-100 dark:border-slate-700 rounded-2xl p-5 mb-8 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-eng-100 dark:bg-eng-900/30 flex items-center justify-center flex-shrink-0">
          <Info size={20} className="text-eng-600 dark:text-eng-400" />
        </div>
        <div>
          <h2 className="font-heading font-semibold text-eng-700 dark:text-eng-400 mb-1">Welcome to GeoLabX</h2>
          <p className="text-sm text-eng-600/80 dark:text-slate-400 leading-relaxed">
            This platform follows British Standard geotechnical testing conventions (BS 1377). All results use SI units: kPa, MPa, mm, and %. Results are computed for educational purposes and are not a substitute for laboratory testing.
          </p>
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map(module => (
          <Card
            key={module.path}
            title={module.title}
            description={module.description}
            icon={module.icon}
            color={module.color}
            onLaunch={() => navigate(module.path)}
          />
        ))}
      </div>
    </div>
  )
}
