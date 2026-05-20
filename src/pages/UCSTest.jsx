import React, { useState, useMemo, useCallback } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { FileDown, RotateCcw, Info, Table2 } from 'lucide-react'
import { exportToCSV } from '../utils/exportCSV'
import { generatePDFReport } from '../utils/exportPDF'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const SAMPLE_LUCS = [
  { load: 0, def: 0 }, { load: 12, def: 0.25 }, { load: 28, def: 0.55 }, { load: 45, def: 0.92 },
  { load: 62, def: 1.35 }, { load: 78, def: 1.85 }, { load: 92, def: 2.42 }, { load: 105, def: 3.08 },
  { load: 114, def: 3.82 }, { load: 118, def: 4.65 }, { load: 115, def: 5.52 }, { load: 106, def: 6.41 },
]

export default function UCSTest() {
  const [studentName, setStudentName] = useState('')
  const [sampleDiameter, setSampleDiameter] = useState(38)
  const [sampleHeight, setSampleHeight] = useState(76)
  const [manualData, setManualData] = useState(false)
  const [rawRows, setRawRows] = useState(SAMPLE_LUCS)

  const area = Math.PI * (sampleDiameter / 2) ** 2
  const results = useMemo(() => {
    const data = rawRows.map(r => {
      const strain = (r.def / sampleHeight) * 100
      const correctedArea = area * (1 - strain / 100)
      const stress = correctedArea > 0 ? (r.load / correctedArea) * 1000 : 0
      return { load: r.load, deformation: r.def, strain: Math.round(strain * 100) / 100, stress: Math.round(stress * 10) / 10 }
    })

    let maxStress = 0
    let failureIdx = 0
    data.forEach((d, i) => { if (d.stress > maxStress) { maxStress = d.stress; failureIdx = i } })

    return { data, qu: maxStress, su: maxStress / 2, failureStrain: data[failureIdx]?.strain ?? 0 }
  }, [rawRows, area, sampleHeight])

  const chartData = useMemo(() => ({
    labels: results.data.map(d => d.strain),
    datasets: [{
      label: `Stress σ (kPa)`,
      data: results.data.map(d => d.stress),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: results.data.length <= 15 ? 4 : 2,
      pointBackgroundColor: results.data.map((_, i) => {
        const maxS = Math.max(...results.data.map(d => d.stress))
        return results.data[i].stress === maxS ? '#ef4444' : '#3b82f6'
      }),
      pointRadius: results.data.map(d => {
        return d.stress === results.qu ? 7 : 3
      }),
      borderWidth: 2,
    }],
  }), [results.data, results.qu])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { font: { family: 'Inter' } } },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        callbacks: { label: ctx => `σ: ${ctx.parsed.y.toFixed(1)} kPa, ε: ${ctx.parsed.x}%` },
      },
      annotation: {},
    },
    scales: {
      x: { title: { display: true, text: 'Axial Strain ε (%)', font: { family: 'Inter' } }, grid: { color: 'rgba(0,0,0,0.04)' } },
      y: { title: { display: true, text: 'Axial Stress σ (kPa)', font: { family: 'Inter' } }, grid: { color: 'rgba(0,0,0,0.04)' } },
    },
  }

  const handleCSV = useCallback(() => {
    const headers = [
      { key: 'load', label: 'Load (N)' },
      { key: 'deformation', label: 'Deformation (mm)' },
      { key: 'strain', label: 'Axial Strain (%)' },
      { key: 'stress', label: 'Axial Stress (kPa)' },
    ]
    exportToCSV('UCS_Test_Data.csv', results.data, headers)
  }, [results.data])

  const handlePDF = useCallback(() => {
    const canvas = document.querySelector('#ucs-chart canvas')
    generatePDFReport({
      title: 'Unconfined Compression Test Report',
      studentName,
      date: new Date().toLocaleDateString('en-GB'),
      inputParams: {
        'Sample Diameter': `${sampleDiameter} mm`,
        'Sample Height': `${sampleHeight} mm`,
        'Initial Area': `${(area).toFixed(1)} mm²`,
      },
      results: [
        { label: 'Peak Strength qᵤ', value: `${results.qu.toFixed(1)} kPa` },
        { label: 'Undrained Shear Strength sᵤ', value: `${results.su.toFixed(1)} kPa` },
        { label: 'Strain at Failure', value: `${results.failureStrain}%` },
      ],
      data: {
        headers: ['Load (N)', 'Deformation (mm)', 'Strain (%)', 'Stress (kPa)'],
        rows: results.data.map(d => [d.load, d.deformation, d.strain, d.stress]),
      },
      graphCanvas: canvas,
      interpretation: `Unconfined compression test on a sample of ${sampleDiameter} mm diameter × ${sampleHeight} mm height. Peak strength qᵤ = ${results.qu.toFixed(1)} kPa at ${results.failureStrain}% strain. Undrained shear strength sᵤ = qᵤ/2 = ${results.su.toFixed(1)} kPa.`,
    })
  }, [results, studentName, sampleDiameter, sampleHeight, area])

  const handleReset = () => {
    setRawRows(SAMPLE_LUCS)
    setManualData(false)
  }

  const handleCellChange = (rowIdx, field, value) => {
    const newRow = [...rawRows]
    newRow[rowIdx] = { ...newRow[rowIdx], [field]: parseFloat(value) || 0 }
    setRawRows(newRow)
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl md:text-2xl text-slate-900 dark:text-white">Unconfined Compression Test</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">BS 1377 Part 7 — Determine qᵤ and sᵤ from unconfined compression</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCSV} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
            <Table2 size={15} /> Export CSV
          </button>
          <button onClick={handlePDF} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
            <FileDown size={15} /> PDF Report
          </button>
          <button onClick={handleReset} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>

      {/* Inputs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Sample Geometry &amp; Data</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Diameter (mm)</label>
            <input type="number" value={sampleDiameter} onChange={e => setSampleDiameter(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eng-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Height (mm)</label>
            <input type="number" value={sampleHeight} onChange={e => setSampleHeight(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eng-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Student Name</label>
            <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Your name..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eng-500 text-sm" />
          </div>
        </div>
        <button onClick={() => { setManualData(!manualData) }} className="text-sm text-eng-600 dark:text-eng-400 hover:underline">
          {manualData ? '← Use sample data' : '→ Enter manual data'}
        </button>
      </div>

      {manualData && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-3">Manual Data Input</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-2 px-2 text-slate-500 dark:text-slate-400 font-medium">Load (N)</th>
                  <th className="text-left py-2 px-2 text-slate-500 dark:text-slate-400 font-medium">Deformation (mm)</th>
                </tr>
              </thead>
              <tbody>
                {rawRows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-1 px-2"><input type="number" value={r.load} onChange={e => handleCellChange(i, 'load', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" /></td>
                    <td className="py-1 px-2"><input type="number" value={r.def} onChange={e => handleCellChange(i, 'def', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setRawRows([...rawRows, { load: 0, def: 0 }]) } className="mt-3 text-sm text-eng-600 dark:text-eng-400 hover:underline">+ Add row</button>
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Peak Strength qᵤ', value: `${results.qu.toFixed(1)} kPa` },
          { label: 'Undrained sᵤ = qᵤ / 2', value: `${results.su.toFixed(1)} kPa` },
          { label: 'Strain at Failure', value: `${results.failureStrain}%` },
        ].map(i => (
          <div key={i.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{i.label}</p>
            <p className="text-lg font-heading font-bold text-slate-900 dark:text-white">{i.value}</p>
          </div>
        ))}
      </div>

      {/* Graph */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5" id="ucs-chart">
        <div className="h-[280px] md:h-[350px]">
          {results.data.length > 0 && <Line data={chartData} options={chartOptions} />}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Test Data</h2>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Load (N)', 'Deformation (mm)', 'Axial Strain (%)', 'Stress (kPa)'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.data.map((r, i) => (
                <tr key={i} className={`border-b border-slate-100 dark:border-slate-800 ${Math.abs(r.stress - results.qu) < 0.5 ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                  <td className="py-2 px-3 text-slate-900 dark:text-white">{r.load}</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{r.deformation}</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{r.strain}</td>
                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{r.stress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="bg-eng-50 dark:bg-slate-800 rounded-2xl p-5 border border-eng-200 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-eng-100 dark:bg-eng-900/30 flex items-center justify-center flex-shrink-0">
            <Info size={20} className="text-eng-600 dark:text-eng-400" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-eng-700 dark:text-eng-400 mb-1">Understanding the UCS Test</h3>
            <p className="text-sm text-eng-700/80 dark:text-slate-400 leading-relaxed max-w-3xl">
              The unconfined compression test determines the undrained shear strength of cohesive soils. A cylindrical sample is loaded axially without lateral confinement. Peak strength qᵤ is the maximum axial stress. For saturated clays under undrained conditions, sᵤ = qᵤ / 2. The sample diameter to height ratio should be at least 1:2.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
