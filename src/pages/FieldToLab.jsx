import React from 'react'
import {
  Mountain,
  Truck,
  FlaskConical,
  ChartBar,
  Search,
  ClipboardCheck,
  Droplets,
  Ruler,
  Layers,
  ArrowDown,
} from 'lucide-react'

const steps = [
  {
    icon: Search,
    title: '1. Site Investigation',
    color: 'from-blue-400 to-blue-600',
    description: 'Desk study, walkover survey, and trial pits to understand subsurface conditions and geological context.',
    details: [
      'Review geological maps',
      'Identify soil types and groundwater levels',
      'Plan borehole locations',
      'Collect disturbed samples',
    ],
  },
  {
    icon: Truck,
    title: '2. Soil Sampling',
    color: 'from-emerald-400 to-emerald-600',
    description: 'Collect representative soil samples using appropriate samplers for the soil type and test requirements.',
    details: [
      'Undisturbed sampling with Shelby tubes (BS 1377-1)',
      'Disturbed samples for classification',
      'Bulk samples for large-scale testing',
      'In-situ tests: SPT, CPT, vane shear',
    ],
  },
  {
    icon: Droplets,
    title: '3. Sample Transportation',
    color: 'from-amber-400 to-amber-600',
    description: 'Careful transport of samples to the laboratory maintaining moisture content and structural integrity.',
    details: [
      'Seal samples immediately in the field',
      'Maintain natural moisture content',
      'Label with location, depth, and date',
      'Store in controlled environment',
    ],
  },
  {
    icon: FlaskConical,
    title: '4. Laboratory Testing',
    color: 'from-purple-400 to-purple-600',
    description: 'Perform standard soil tests following British Standards to determine engineering properties.',
    details: [
      'Atterberg limits (BS 1377-2)',
      'Particle size distribution (BS 1377-2)',
      'Compaction tests (BS 1377-4)',
      'Shear strength tests (BS 1377-7/8)',
      'Consolidation tests (BS 1377-5)',
      'Permeability tests (BS 1377-6)',
    ],
  },
  {
    icon: ChartBar,
    title: '5. Data Analysis',
    color: 'from-rose-400 to-rose-600',
    description: 'Process test results, generate graphs, and calculate engineering parameters.',
    details: [
      'Plot stress-strain curves',
      'Generate Mohr circles and failure envelopes',
      'Calculate shear strength parameters',
      'Determine consolidation coefficients',
      'Statistical analysis of results',
    ],
  },
  {
    icon: Ruler,
    title: '6. Engineering Interpretation',
    color: 'from-slate-400 to-slate-600',
    description: 'Interpret laboratory results for geotechnical design and construction recommendations.',
    details: [
      'Bearing capacity calculations',
      'Settlement predictions',
      'Slope stability analysis',
      'Earth pressure determination',
      'Construction recommendations',
    ],
  },
]

export default function FieldToLab() {
  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading font-bold text-xl md:text-2xl text-slate-900 dark:text-white">Field to Lab Workflow</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visual guide to the geotechnical investigation process from site to engineering design</p>
      </div>

      {/* Main workflow diagram */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
        <h2 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Workflow Overview</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-2 overflow-x-auto pb-2">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <React.Fragment key={step.title}>
                <div className="flex flex-col items-center flex-shrink-0 min-w-[90px]">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-2 shadow-sm`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">{step.title.split('. ')[1] || step.title}</span>
                </div>
                {i < steps.length - 1 && (
                  <ArrowDown size={20} className="text-slate-300 dark:text-slate-600 flex-shrink-0 rotate-0 md:rotate-0 md:min-w-max" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Detail cards */}
      <div className="space-y-4">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={step.title} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 transition-shadow hover:shadow-md">
              <div className="flex flex-col md:flex-row gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="md:flex-1">
                  <h3 className="font-heading font-semibold text-lg text-slate-900 dark:text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{step.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {step.details.map((detail, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-eng-500 dark:bg-eng-400 mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Educational footer */}
      <div className="bg-eng-50 dark:bg-slate-800 rounded-2xl p-5 border border-eng-200 dark:border-slate-700">
        <h3 className="font-heading font-semibold text-eng-700 dark:text-eng-400 mb-2">Key Principles of Soil Investigation</h3>
        <ul className="text-sm text-eng-700/80 dark:text-slate-400 space-y-1.5 max-w-2xl">
          <li>&bull; Sampling should be representative of the ground conditions encountered on site</li>
          <li>&bull; All tests should follow relevant British Standards (BS 1377 series)</li>
          <li>&bull; Sample preservation is critical for accurate laboratory results</li>
          <li>&bull; Results from multiple tests should be cross-checked for consistency</li>
          <li>&bull; Laboratory tests provide design parameters, not definitive answers</li>
          <li>&bull; Site investigation reports should include limitations and assumptions</li>
        </ul>
      </div>
    </div>
  )
}
