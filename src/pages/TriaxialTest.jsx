import React, { useState, useCallback, useMemo, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Download, RotateCcw, Info, FileDown, Table2 } from 'lucide-react'
import { exportToCSV } from '../utils/exportCSV'
import { generatePDFReport } from '../utils/exportPDF'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

const TEST_MODES = {
  UU: { label: 'UU Test (Undrained)', desc: 'Unconsolidated Undrained — no drainage allowed during confinement or shearing' },
  CU: { label: 'CU Test (Consolidated Undrained)', desc: 'Consolidated Undrained — drainage allowed during consolidation only' },
  CD: { label: 'CD Test (Consolidated Drained)', desc: 'Consolidated Drained — full drainage throughout the test' },
}

const COHESION_PRESET = { UU: 0, CU: 10, CD: 15 }
const PHI_PRESET = { UU: 0, CU: 25, CD: 30 }

function generateSampleData(confining, mode) {
  const n = 12
  const step = 38 / n // mm per step up to 38mm deformation
  const data = []
  let maxQ = 0
  let failIdx = 0

  for (let i = 0; i < n; i++) {
    const axialStrain = (i / (n - 1)) * 20 // 0–20%
    const strainFrac = i / (n - 1)
    const baseQ = confining * 1.8
    const axialStress = confining + baseQ * (strainFrac - 0.15 * strainFrac * strainFrac)
    const deviator = axialStress - confining
    let porePressure = 0
    if (mode !== 'CD') {
      porePressure = mode === 'UU' ? confining * 0.15 * strainFrac : confining * 0.2 * (1 - Math.exp(-2 * strainFrac))
    }

    if (deviator > maxQ) { maxQ = deviator; failIdx = i }

    data.push({
      axialStrain: Math.round(axialStrain * 100) / 100,
      axialStress: Math.round(axialStress),
      deviatorStress: Math.round(deviator),
      confiningStress: confining,
      porePressure: Math.round(porePressure),
      effectiveConfining: Math.round(confining - porePressure),
      effectiveAxial: Math.round(axialStress - porePressure),
    })
  }

  return { data, maxQ, failIdx }
}

export default function TriaxialTest() {
  const [mode, setMode] = useState('UU')
  const [confiningPressure, setConfiningPressure] = useState(100)
  const [studentName, setStudentName] = useState('')
  const testResult = useRef(generateSampleData(100, 'UU'))

  const c = COHESION_PRESET[mode]
  const phi = PHI_PRESET[mode]

  const calculations = useMemo(() => {
    const { data, maxQ, failIdx } = generateSampleData(confiningPressure, mode)

    const sigma1 = data[failIdx]?.axialStress ?? 0
    const sigma3 = confiningPressure
    const poreF = data[failIdx]?.porePressure ?? 0
    const sigma1_eff = mode !== 'CD' ? sigma1 - poreF : sigma1
    const sigma3_eff = mode !== 'CD' ? sigma3 - poreF : sigma3
    const cu = maxQ / 2

    return {
      data,
      maxDeviator: maxQ,
      failureIndex: failIdx,
      failureStrain: data[failIdx]?.axialStrain ?? 0,
      sigma1: Math.round(sigma1),
      sigma3,
      sigma1_eff: Math.round(sigma1_eff),
      sigma3_eff: Math.round(sigma3_eff),
      c,
      phi,
      cu: Math.round(cu * 10) / 10,
    }
  }, [confiningPressure, mode, c, phi])

  const ssData = useMemo(() => ({
    labels: calculations.data.map(d => d.axialStrain),
    datasets: [{
      label: 'σ₁ − σ₃ (kPa)',
      data: calculations.data.map(d => d.deviatorStress),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2,
    }],
  }), [calculations.data])

  const ssOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { font: { family: 'Inter' } } },
      tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', titleFont: { family: 'Inter', weight: 'bold' }, bodyFont: { family: 'Inter' }, cornerRadius: 6 },
    },
    scales: {
      x: { title: { display: true, text: 'Axial Strain (%)', font: { family: 'Inter' } }, grid: { color: 'rgba(0,0,0,0.04)' } },
      y: { title: { display: true, text: 'Deviator Stress (kPa)', font: { family: 'Inter' } }, grid: { color: 'rgba(0,0,0,0.04)' } },
    },
  }

  const ppData = useMemo(() => ({
    labels: calculations.data.map(d => d.axialStrain),
    datasets: [{
      label: 'Pore Pressure u (kPa)',
      data: calculations.data.map(d => d.porePressure),
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239,68,68,0.08)',
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 3,
    }, {
      label: 'σ₃ (kPa)',
      data: Array(calculations.data.length).fill(confiningPressure),
      borderColor: '#94a3b8',
      borderDash: [5, 4],
      borderWidth: 1.5,
      pointRadius: 0,
    }],
  }), [calculations.data, confiningPressure])

  const mohrData = useMemo(() => {
    const gen = (cx, r) => {
      const pts = []
      for (let i = 0; i <= 60; i++) {
        const t = (i / 60) * Math.PI
        pts.push({ x: cx + r * Math.cos(t), y: r * Math.sin(t) })
      }
      return pts
    }
    const cPts = gen((calculations.sigma1 + calculations.sigma3) / 2, (calculations.sigma1 - calculations.sigma3) / 2)
    const ePts = gen((calculations.sigma1_eff + calculations.sigma3_eff) / 2, (calculations.sigma1_eff - calculations.sigma3_eff) / 2)
    const envPts = []
    for (let s = 0; s <= calculations.sigma1 * 1.3; s += 15) {
      envPts.push({ x: s, y: c + s * Math.tan(phi * Math.PI / 180) })
    }
    return {
      datasets: [{
        label: 'Total Stress Circle',
        data: cPts,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        showLine: true,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
      }, {
        label: 'Effective Stress Circle',
        data: ePts,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,0.06)',
        showLine: true,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
      }, {
        label: 'Failure Envelope τ = c + σ tan φ',
        data: envPts,
        borderColor: '#ef4444',
        showLine: true,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
      }],
    }
  }, [calculations, c, phi])

  const mohrOpts = useMemo(() => {
    const maxR = Math.max(
      ...mohrData.datasets.flatMap(d => d.data.map(p => Math.max(p.x, p.y))),
      0
    )
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { size: 11, family: 'Inter' }, boxHeight: 12 } },
        tooltip: {
          callbacks: {
            label: ctx => `σ: ${Math.round(ctx.parsed.x)} kPa, τ: ${Math.round(ctx.parsed.y)} kPa`,
          },
        },
      },
      scales: {
        x: { title: { display: true, text: 'Normal Stress σ (kPa)', font: { family: 'Inter' } }, min: 0, max: Math.ceil(maxR / 50) * 50 * 1.1, ticks: { font: { size: 10, family: 'Inter' } }, grid: { color: 'rgba(0,0,0,0.04)' } },
        y: { title: { display: true, text: 'Shear Stress τ (kPa)', font: { family: 'Inter' } }, min: 0, max: Math.ceil(maxR / 50) * 50 * 0.55, ticks: { font: { size: 10, family: 'Inter' } }, grid: { color: 'rgba(0,0,0,0.04)' } },
      },
    }
  }, [mohrData])

  const handleCSV = useCallback(() => {
    const headers = [
      { key: 'axialStrain', label: 'Axial Strain (%)' },
      { key: 'deviatorStress', label: 'Deviator Stress (kPa)' },
      { key: 'porePressure', label: 'Pore Pressure (kPa)' },
      { key: 'effectiveAxial', label: 'Effective σ₁ (kPa)' },
      { key: 'effectiveConfining', label: 'Effective σ₃ (kPa)' },
    ]
    exportToCSV(`Triaxial_${mode}_${confiningPressure}kPa.csv`, calculations.data, headers)
  }, [calculations.data, mode, confiningPressure])

  const handlePDF = useCallback(() => {
    const canvas = document.querySelector('#mohr-chart canvas') || document.querySelector('#ss-chart canvas')
    generatePDFReport({
      title: `Triaxial Test Report — ${TEST_MODES[mode].label}`,
      studentName,
      date: new Date().toLocaleDateString('en-GB'),
      inputParams: {
        'Test Mode': TEST_MODES[mode].label,
        'Confining Pressure σ₃': `${confiningPressure} kPa`,
        'Cohesion c': `${c} kPa`,
        'Friction Angle φ': `${phi}`,
      },
      results: [
        { label: 'Major Principal Stress σ₁', value: `${calculations.sigma1} kPa` },
        { label: 'Minor Principal Stress σ₃', value: `${calculations.sigma3} kPa` },
        { label: 'Effective σ₁', value: `${calculations.sigma1_eff} kPa` },
        { label: 'Effective σ₃', value: `${calculations.sigma3_eff} kPa` },
        { label: 'Peak Deviator Stress', value: `${calculations.maxDeviator} kPa` },
        { label: 'Undrained Shear Strength cᵤ', value: `${calculations.cu} kPa` },
        { label: 'Strain at Failure', value: `${calculations.failureStrain}%` },
      ],
      data: {
        rows: calculations.data.map(d => [d.axialStrain, d.deviatorStress, d.porePressure, d.effectiveAxial, d.effectiveConfining]),
        headers: ['Axial Strain (%)', 'Deviator σ (kPa)', 'Pore u (kPa)', 'Effective σ₁ (kPa)', 'Effective σ₃ (kPa)'],
      },
      graphCanvas: canvas,
      interpretation: `The ${TEST_MODES[mode].label} was performed with a confining pressure of ${confiningPressure} kPa. Peak deviator stress: ${calculations.maxDeviator} kPa at ${calculations.failureStrain}% axial strain. Undrained shear strength cᵤ = ${calculations.cu} kPa. Failure envelope: c = ${c} kPa, φ = ${phi}°.`,
    })
  }, [calculations, mode, confiningPressure, c, phi, studentName])

  const handleReset = () => {
    setConfiningPressure(100)
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl md:text-2xl text-slate-900 dark:text-white">Triaxial Test Simulator</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">BS 1377 Part 8 — {TEST_MODES[mode].desc}</p>
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

      {/* Test Mode Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-heading font-semibold text-slate-900 dark:text-white mb-3">Test Configuration</h2>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {Object.entries(TEST_MODES).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={`px-3 py-3 rounded-xl text-sm font-medium transition-all border-2 ${mode === k
                ? 'border-eng-500 bg-eng-50 dark:bg-eng-900/20 text-eng-700 dark:text-eng-400'
                : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300'}
              `}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Confining Pressure σ₃: <span className="text-eng-600 dark:text-eng-400 font-bold">{confiningPressure} kPa</span>
            </label>
            <input
              type="range" min="50" max="500" step="25"
              value={confiningPressure} onChange={e => setConfiningPressure(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-eng-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1"><span>50 kPa</span><span>500 kPa</span></div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
            <p><span className="font-medium text-slate-900 dark:text-white">Cohesion (c): </span>{c} kPa</p>
            <p><span className="font-medium text-slate-900 dark:text-white">Friction Angle (φ): </span>{phi}°</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 italic">Parameters preset automatically based on test type</p>
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            placeholder="Student Name (for reports)..."
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eng-500/50 w-full sm:w-80"
          />
        </div>
      </div>

      {/* Result Summaries */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'σ₁ (kPa)', value: calculations.sigma1 },
          { label: 'σ₃ (kPa)', value: calculations.sigma3 },
          { label: 'Peak Deviator (kPa)', value: calculations.maxDeviator },
          { label: 'cᵤ (kPa)', value: calculations.cu.toFixed(1) },
        ].map(i => (
          <div key={i.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{i.label}</p>
            <p className="text-xl font-heading font-bold text-slate-900 dark:text-white">{i.value}</p>
          </div>
        ))}
      </div>

      {/* Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5" id="ss-chart">
          <div className="h-[250px] md:h-[300px]">
            {calculations.data.length > 0 && <Line data={ssData} options={ssOpts} />}
          </div>
        </div>
        {mode !== 'CD' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="h-[250px] md:h-[300px]">
              <Line data={ppData} options={ssOpts} />
            </div>
          </div>
        )}
        <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 ${mode === 'CD' ? '' : 'lg:col-span-1'} xl:col-span-1`} id="mohr-chart">
          <div className="h-[250px] md:h-[300px]">
            <Line data={mohrData} options={mohrOpts} />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Test Data Table</h2>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {['Axial Strain (%)', 'Deviator σ (kPa)', 'Pore u (kPa)', 'Eff. σ₁ (kPa)', 'Eff. σ₃ (kPa)'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calculations.data.map((r, i) => (
                <tr key={i} className={`border-b border-slate-100 dark:border-slate-800 ${i === calculations.failureIndex ? 'bg-amber-50 dark:bg-amber-900/10' : 'dark:text-white'}`}>
                  <td className="py-2 px-3">{r.axialStrain}</td>
                  <td className="py-2 px-3">{r.deviatorStress}</td>
                  <td className="py-2 px-3">{r.porePressure}</td>
                  <td className="py-2 px-3">{r.effectiveAxial}</td>
                  <td className="py-2 px-3">{r.effectiveConfining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500 italic">Highlighted row indicates peak deviator stress (failure)</p>
      </div>

      {/* Educational Note */}
      <div className="bg-eng-50 dark:bg-slate-800 rounded-2xl p-5 border border-eng-200 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-eng-100 dark:bg-eng-900/30 flex items-center justify-center flex-shrink-0">
            <Info size={20} className="text-eng-600 dark:text-eng-400" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-eng-700 dark:text-eng-400 mb-1">Understanding the Triaxial Test</h3>
            <p className="text-sm text-eng-700/80 dark:text-slate-400 leading-relaxed max-w-3xl">
              The triaxial test is the most versatile laboratory test for determining shear strength. <strong>UU test</strong> — no drainage, giving immediate undrained strength. <strong>CU test</strong> — consolidation then undrained shearing. <strong>CD test</strong> — full drainage throughout, providing effective stress parameters. The Mohr-Coulomb failure criterion is τ = c + σ tan φ.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
