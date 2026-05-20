import { Link } from 'react-router-dom';

const modules = [
  {
    to: '/triaxial',
    title: 'Triaxial Test Simulator',
    desc: 'Simulate UU, CU, and CD triaxial tests. Input confining pressure, axial load, and deformation data to generate stress–strain curves and Mohr circles.',
    icon: '\u25B3',
    color: 'from-blue-500 to-blue-700',
  },
  {
    to: '/mohr',
    title: 'Mohr Circle Tool',
    desc: 'Visualise stress states using Mohr circles. Compute principal stresses, max shear stress, and failure envelope in total and effective stress modes.',
    icon: '\u25CB',
    color: 'from-emerald-500 to-emerald-700',
  },
  {
    to: '/ucs',
    title: 'Unconfined Compression Test',
    desc: 'Analyse UCS data to determine unconfined compressive strength (q\u1D64) and undrained shear strength (s\u1D64) with failure point indication.',
    icon: '\u2191',
    color: 'from-amber-500 to-amber-700',
  },
  {
    to: '/classification',
    title: 'Soil Classification',
    desc: 'Classify soils using the USCS system. Input Atterberg limits and particle size data to generate plasticity charts and soil descriptions.',
    icon: '\u2630',
    color: 'from-purple-500 to-purple-700',
  },
];

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 dark:text-white">
          Virtual Geotechnical Laboratory
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">
          Interactive modules for undergraduate civil engineering students to learn soil mechanics and geotechnical engineering.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {modules.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all hover:border-engineering-300 dark:hover:border-engineering-600"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-white text-xl shrink-0`}>
                {m.icon}
              </div>
              <div>
                <h2 className="font-heading font-semibold text-gray-900 dark:text-white group-hover:text-engineering-700 dark:group-hover:text-engineering-400 transition-colors">
                  {m.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-5 bg-engineering-50 dark:bg-engineering-900/20 rounded-xl border border-engineering-100 dark:border-engineering-800">
        <h3 className="font-heading font-semibold text-engineering-800 dark:text-engineering-200 mb-2">Getting Started</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
          <li>Select a module above to begin your virtual laboratory session</li>
          <li>Each module includes example datasets for quick demonstration</li>
          <li>Export your results as CSV data or formatted PDF reports</li>
          <li>Toggle dark mode using the sun/moon icon in the navigation bar</li>
          <li>All calculations follow British Standard conventions with SI units</li>
        </ul>
      </div>
    </div>
  );
}
