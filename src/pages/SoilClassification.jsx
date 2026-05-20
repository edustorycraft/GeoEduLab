import React, { useState, useMemo, useCallback } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { FileDown, RotateCcw, Info, Table2 } from 'lucide-react'
import { exportToCSV } from '../utils/exportCSV'
import { generatePDFReport } from '../utils/exportPDF'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function SoilClassification() {
  const [liquidLimit, setLiquidLimit] = useState(45)
  const [plasticLimit, setPlasticLimit] = useState(25)
  const [gravel, setGravel] = useState(35)
  const [sand, setSand] = useState(50)
  const [silt, setSilt] = useState(15)
  const [clay, setClay] = useState(10)
  const [studentName, setStudentName] = useState('')

  const classification = useMemo(() => {
    const pi = liquidLimit - plasticLimit
    const aLine = 0.73 * (liquidLimit - 20)
    const total = gravel + sand + silt + clay

    let group = 'Unknown'
    let subGroup = ''
    let description = ''

    if (gravel > sand && total > 0 && gravel / total > 0.5) {
      group = 'GW'
      description = 'Well-graded GRAVEL'
    } else if (sand >= gravel && total > 0 && sand / total > 0.5) {
      group = 'SW'
      description = 'Well-graded SAND'
    }

    // Fine-grained classification using Casagrande plasticity chart
    if (silt + clay > gravel + sand || total <= 0) {
      if (liquidLimit < 50) {
        if (pi > aLine && pi > 7) { group = 'CL'; description = 'CLAY of low plasticity' }
        else if (pi <= aLine || pi <= 7) { group = 'ML'; description = 'SILT of low plasticity' }
      } else {
        if (pi > aLine) { group = 'CH'; description = 'CLAY of high plasticity' }
        else { group = 'MH'; description = 'SILT of high plasticity' }
      }
    }

    // Dual symbol for coarse-grained with fines
    if (['GW', 'SW'].includes(group) && (silt + clay) > 0) {
      if (pi > 7 && pi > aLine) {
        subGroup = group.replace('W', 'C') + ` / ${group} - ${description} with clayey fines`
      } else {
        subGroup = group.replace('W', 'M') + ` / ${group} - ${description} with silty fines`
      }
      description = subGroup
    }

    return { pi, aLine, total, group, description, gravelPct: total > 0 ? ((gravel / total) * 100).toFixed(1) : 0, sandPct: total > 0 ? ((sand / total) * 100).toFixed(1) : 0, siltPct: total > 0 ? ((silt / total) * 100).toFixed(1) : 0, clayPct: total > 0 ? ((clay / total) * 100).toFixed(1) : 0 }
  }, [liquidLimit, plasticLimit, gravel, sand, silt, clay])

  const gradingChartData = useMemo(() => ({
    labels: ['Gravel', 'Sand', 'Silt', 'Clay'],
    datasets: [{
      data: [classification.gravelPct, classification.sandPct, classification.siltPct, classification.clayPct].map(Number),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444',],
      borderWidth: 0,
      borderRadius: 6,
    }],
  }), [classification])

  const plasticityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { type: 'linear', title: { display: true, text: 'Liquid Limit LL (%)', font: { family: 'Inter' } }, min: 0, max: 120 },
      y: { type: 'linear', title: { display: true, text: 'Plasticity Index PI', font: { family: 'Inter' } }, min: 0, max: 100 },
    },
  }

  const handleCSV = useCallback(() => {
    const data = [
      { parameter: 'Liquid Limit (LL)', value: liquidLimit },
      { parameter: 'Plastic Limit (PL)', value: plasticLimit },
      { parameter: 'Plasticity Index (PI)', value: classification.pi },
      { parameter: 'Gravel (%)', value: classification.gravelPct },
      { parameter: 'Sand (%)', value: classification.sandPct },
      { parameter: 'Silt (%)', value: classification.siltPct },
      { parameter: 'Clay (%)', value: classification.clayPct },
      { parameter: 'USCS Group Symbol', value: classification.group },
      { parameter: 'Description', value: classification.description },
    ]
    exportToCSV('Soil_Classification.csv', data, [{ key: 'parameter', label: 'Parameter' }, { key: 'value', label: 'Value' }])
  }, [liquidLimit, plasticLimit, classification])

  const handlePDF = useCallback(() => {
    generatePDFReport({
      title: 'Soil Classification Report (USCS)',
      studentName,
      date: new Date().toLocaleDateString('en-GB'),
      inputParams: {
        'Liquid Limit (LL)': `${liquidLimit}%`,
        'Plastic Limit (PL)': `${plasticLimit}%`,
        'Plasticity Index (PI)': `${classification.pi}%`,
        'Gravel': `${classification.gravelPct}%`,
        'Sand': `${classification.sandPct}%`,
        'Silt': `${classification.siltPct}%`,
        'Clay': `${classification.clayPct}%`,
      },
      results: [
        { label: 'USCS Group Symbol', value: classification.group },
        { label: 'Classification', value: classification.description },
        { label: 'A-Line PI', value: `${classification.aLine.toFixed(1)}` },
        { label: 'Actual PI', value: `${classification.pi}` },
        { label: 'Position relative to A-Line', value: classification.pi > classification.aLine ? 'Above' : 'Below' },
      ],
      data: {
        headers: ['Fraction', 'Passing (%)'],
        rows: [
          ['Gravel (>2mm)', classification.gravelPct],
          ['Sand (0.063-2mm)', classification.sandPct],
          ['Silt (0.002-0.063mm)', classification.siltPct],
          ['Clay (<0.002mm)', classification.clayPct],
        ],
      },
      graphCanvas: null,
      interpretation: `Soil classified as USCS group ${classification.group}: ${classification.description}. Liquid limit = ${liquidLimit}%, plasticity index = ${classification.pi}%. A-line PI = ${classification.aLine.toFixed(1)}. ${classification.pi > classification.aLine ? 'Point lies above the A-line, indicating clayey behaviour.' : 'Point lies below the A-line, indicating silty behaviour.'}`,
    })
  }, [studentName, liquidLimit, plasticLimit, classification])

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl md:text-2xl text-slate-900 dark:text-white">Soil Classification Module</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Unified Soil Classification System (USCS) — BS 5930</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCSV} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"><Table2 size={15} /> Export CSV</button>
          <button onClick={handlePDF} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"><FileDown size={15} /> PDF Report</button>
          <button onClick={() => { setLiquidLimit(45); setPlasticLimit(25); setGravel(35); setSand(50); setSilt(15); setClay(10) }} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"><RotateCcw size={15} /> Reset</button>
        </div>
      </div>

      {/* Inputs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Atterberg Limits &amp; Grading</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Atterberg Limits</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Liquid Limit LL (%): <span className="font-bold text-slate-900 dark:text-white">{liquidLimit}</span></label>
                <input type="range" min="10" max="120" step="1" value={liquidLimit} onChange={e => setLiquidLimit(Number(e.target.value))} className="w-full accent-eng-600" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Plastic Limit PL (%): <span className="font-bold text-slate-900 dark:text-white">{plasticLimit}</span></label>
                <input type="range" min="5" max="80" step="1" value={plasticLimit} onChange={e => setPlasticLimit(Number(e.target.value))} className="w-full accent-eng-600" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Particle Size Distribution (%)</h3>
            <div className="space-y-3">
              {[{ setter: setGravel, val: gravel, label: 'Gravel', max: 100 }, { setter: setSand, val: sand, label: 'Sand', max: 100 }, { setter: setSilt, val: silt, label: 'Silt', max: 100 }, { setter: setClay, val: clay, label: 'Clay', max: 100 }].map(item => (
                <div key={item.label}>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">{item.label}: <span className="font-bold text-slate-900 dark:text-white">{item.val}%</span></label>
                  <input type="range" min="0" max={item.max} step="1" value={item.val} onChange={e => item.setter(Number(e.target.value))} className="w-full accent-eng-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Student Name (for reports)..." className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eng-500/50 max-w-xs" />
      </div>

      {/* Classification Result */}
      <div className="bg-gradient-to-r from-eng-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl border border-eng-200 dark:border-slate-700 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">USCS Group</p>
            <p className="text-2xl font-heading font-bold text-eng-600 dark:text-eng-400">{classification.group}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Plasticity Index</p>
            <p className="text-xl font-heading font-bold text-slate-900 dark:text-white">{classification.pi}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">A-Line (PI)</p>
            <p className="text-xl font-heading font-bold text-slate-900 dark:text-white">{classification.aLine.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Position vs A-Line</p>
            <p className={`text-lg font-heading font-bold ${classification.pi > classification.aLine ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {classification.pi > classification.aLine ? 'Above' : 'Below'}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-700 dark:text-slate-300 font-medium">{classification.description}</p>
      </div>

      {/* Grading Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-3">Particle Size Distribution</h3>
          <div className="h-[250px] md:h-[300px]">
            <Line
              data={{
                labels: ['Gravel', 'Sand', 'Silt', 'Clay'],
                datasets: [{
                  label: 'Fraction (%)',
                  data: [Number(classification.gravelPct), Number(classification.sandPct), Number(classification.siltPct), Number(classification.clayPct)],
                  backgroundColor: ['rgba(59,130,246,0.6)', 'rgba(16,185,129,0.6)', 'rgba(245,158,11,0.6)', 'rgba(239,68,68,0.6)'],
                  borderWidth: 0,
                  borderRadius: 6,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { title: { display: true, text: 'Passing (%)', font: { family: 'Inter' } }, beginAtZero: true, max: 100 },
                },
              }}
            />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-3">Casagrande Plasticity Chart</h3>
          <div className="h-[250px] md:h-[300px]">
            <Line
              data={{
                datasets: [{
                  label: 'A-Line (PI = 0.73(LL - 20))',
                  data: [{ x: 20, y: 0 }, { x: 120, y: 0.73 * 100 }],
                  borderColor: '#94a3b8',
                  borderDash: [6, 4],
                  borderWidth: 2,
                  pointRadius: 0,
                  fill: false,
                }, {
                  label: 'Soil Sample',
                  data: [{ x: liquidLimit, y: classification.pi }],
                  backgroundColor: '#ef4444',
                  borderColor: '#ef4444',
                  pointRadius: 8,
                  pointHoverRadius: 10,
                  showLine: false,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { font: { family: 'Inter', size: 11 }, boxHeight: 12 } },
                  tooltip: { callbacks: { label: ctx => `LL = ${ctx.parsed.x}%, PI = ${ctx.parsed.y}` } },
                },
                scales: {
                  x: { title: { display: true, text: 'Liquid Limit LL (%)', font: { family: 'Inter' } }, min: 0, max: 120, grid: { color: 'rgba(0,0,0,0.04)' } },
                  y: { title: { display: true, text: 'Plasticity Index PI', font: { family: 'Inter' } }, min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.04)' } },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-eng-50 dark:bg-slate-800 rounded-2xl p-5 border border-eng-200 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-eng-100 dark:bg-eng-900/30 flex items-center justify-center flex-shrink-0">
            <Info size={20} className="text-eng-600 dark:text-eng-400" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-eng-700 dark:text-eng-400 mb-1">Understanding the Casagrande Chart</h3>
            <p className="text-sm text-eng-700/80 dark:text-slate-400 leading-relaxed max-w-3xl">
              The plasticity chart plots Plasticity Index (PI) against Liquid Limit (LL). The A-line (PI = 0.73(LL − 20)) separates clays from silts. Points above the A-line with PI {'>'} 7 are clays (C); points below are silts (M). Low plasticity: LL {'<'} 50 (CL, ML). High plasticity: LL ≥ 50 (CH, MH). Coarse soils have dominant gravel (G) or sand (S) fractions ({'>'}50%), with W for well-graded or P for poorly graded.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
