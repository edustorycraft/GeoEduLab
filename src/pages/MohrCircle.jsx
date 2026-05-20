import React, { useState, useMemo, useCallback } from 'react'
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { FileDown, RotateCcw, Info } from 'lucide-react'
import { exportToCSV } from '../utils/exportCSV'
import { generatePDFReport } from '../utils/exportPDF'

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function MohrCircle() {
  const [sigma1, setSigma1] = useState(400)
  const [sigma3, setSigma3] = useState(200)
  const [cohesion, setCohesion] = useState(50)
  const [frictionAngle, setFrictionAngle] = useState(30)
  const [useEffective, setUseEffective] = useState(false)
  const [porePressure, setPorePressure] = useState(40)
  const [studentName, setStudentName] = useState('')

  const values = useMemo(() => {
    const s1 = useEffective ? sigma1 - porePressure : sigma1
    const s3 = useEffective ? sigma3 - porePressure : sigma3
    const center = (s1 + s3) / 2
    const radius = (s1 - s3) / 2
    const tauMax = radius
    const phiRad = frictionAngle * Math.PI / 180

    return { sigma1: s1, sigma3: s3, center, radius, tauMax, phiRad, cohesion: useEffective ? cohesion : cohesion }
  }, [sigma1, sigma3, cohesion, frictionAngle, useEffective, porePressure])

  const circleData = useMemo(() => {
    const { center, radius, cohesion: c, phiRad } = values
    const pts = []
    for (let i = 0; i <= 100; i++) {
      const theta = (i / 100) * Math.PI
      pts.push({
        x: center + radius * Math.cos(theta),
        y: radius * Math.sin(theta),
      })
    }
    const envPts = []
    for (let s = 0; s <= values.sigma1 * 1.3; s += 20) {
      envPts.push({ x: s, y: c + s * Math.tan(phiRad) })
    }
    return { circle: pts, envelope: envPts }
  }, [values])

  const chartData = useMemo(() => ({
    datasets: [
      {
        label: 'Mohr Circle',
        data: circleData.circle.map(p => ({ x: p.x, y: p.y })),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.15)',
        showLine: true,
        borderWidth: 2.5,
        pointRadius: 0,
        fill: true,
      },
      {
        label: `Failure Envelope (c=${values.cohesion} kPa, φ=${frictionAngle}°)`,
        data: circleData.envelope.map(p => ({ x: p.x, y: p.y })),
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        showLine: true,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
      },
    ],
  }), [circleData, values, frictionAngle])

  const chartOptions = useMemo(() => {
    const maxS = values.sigma1 * 1.35
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { family: 'Inter', size: 11 } } },
        tooltip: {
          callbacks: { label: ctx => `σ: ${Math.round(ctx.parsed.x)} kPa, τ: ${Math.round(ctx.parsed.y)} kPa` },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Normal Stress σ (kPa)', font: { family: 'Inter', weight: '500' } },
          min: 0,
          max: Math.ceil(maxS / 50) * 50,
          ticks: { font: { family: 'Inter' } },
          grid: { color: 'rgba(0,0,0,0.04)' },
        },
        y: {
          title: { display: true, text: 'Shear Stress τ (kPa)', font: { family: 'Inter', weight: '500' } },
          min: 0,
          max: Math.ceil(values.cohesion + maxS * Math.tan(frictionAngle * Math.PI / 180)),
          ticks: { font: { family: 'Inter' } },
          grid: { color: 'rgba(0,0,0,0.04)' },
        },
      },
    }
  }, [values, maxS])

  const handleCSV = useCallback(() => {
    const exportPts = circleData.circle.filter((_, i) => i % 3 === 0 || i === circleData.circle.length - 1)
    exportToCSV('MohrCircle_Data.csv', exportPts, [{ key: 'x', label: 'Normal Stress σ (kPa)' }, { key: 'y', label: 'Shear Stress τ (kPa)' }])
  }, [circleData.circle])

  const handlePDF = useCallback(() => {
    const canvas = document.querySelector('#mohr-canvas canvas')
    generatePDFReport({
      title: `Mohr Circle Analysis Report`,
      studentName,
      date: new Date().toLocaleDateString('en-GB'),
      inputParams: {
        [useEffective ? 'Effective σ₁' : 'Total σ₁']: `${sigma1} kPa`,
        [useEffective ? 'Effective σ₃' : 'Total σ₃']: `${sigma3} kPa`,
        'Pore Pressure u': useEffective ? `${porePressure} kPa` : 'N/A',
        'Cohesion c': `${values.cohesion} kPa`,
        'Friction Angle φ': `${frictionAngle}°`,
      },
      results: [
        { label: 'Centre of Circle', value: `${values.center.toFixed(1)} kPa` },
        { label: 'Radius (τ_max)', value: `${values.tauMax.toFixed(1)} kPa` },
        { label: 'Maximum Shear Stress', value: `${values.tauMax.toFixed(1)} kPa` },
        { label: 'σ₁', value: `${values.sigma1} kPa` },
        { label: 'σ₃', value: `${values.sigma3} kPa` },
      ],
      data: {
        headers: ['σ (kPa)', 'τ (kPa)'],
        rows: circleData.circle.filter((_, i) => i % 5 === 0).map(p => [Math.round(p.x), Math.round(p.y)]),
      },
      graphCanvas: canvas,
      interpretation: `Mohr circle analysis with principal stresses σ₁ = ${values.sigma1} kPa and σ₃ = ${values.sigma3} kPa. Maximum shear stress τ_max = ${values.tauMax.toFixed(1)} kPa. Failure envelope defined by cohesion c = ${values.cohesion} kPa and friction angle φ = ${frictionAngle}°.`,
    })
  }, [studentName, sigma1, sigma3, porePressure, values, cohesion, frictionAngle, useEffective, circleData])

  const handleReset = () => {
    setSigma1(400); setSigma3(200); setCohesion(50); setFrictionAngle(30); setPorePressure(40)
  }

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-xl md:text-2xl text-slate-900 dark:text-white">Mohr Circle Analysis Tool</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visualise stress states and failure envelopes for soil elements</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCSV} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
            Export CSV
          </button>
          <button onClick={handlePDF} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
            PDF Report
          </button>
          <button onClick={handleReset} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300">
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <h2 className="font-heading font-semibold text-slate-900 dark:text-white mb-3">Stress State</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">σ₁ (kPa): <span className="text-eng-600 dark:text-eng-400 font-bold">{sigma1}</span></label>
            <input type="range" min="50" max="1000" step="25" value={sigma1} onChange={e => setSigma1(Number(e.target.value))} className="w-full accent-eng-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">σ₃ (kPa): <span className="text-eng-600 dark:text-eng-400 font-bold">{sigma3}</span></label>
            <input type="range" min="25" max="800" step="25" value={sigma3} onChange={e => setSigma3(Number(e.target.value))} className="w-full accent-eng-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">c (kPa): <span className="text-eng-600 dark:text-eng-400 font-bold">{cohesion}</span></label>
            <input type="range" min="0" max="200" step="5" value={cohesion} onChange={e => setCohesion(Number(e.target.value))} className="w-full accent-eng-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">φ (°): <span className="text-eng-600 dark:text-eng-400 font-bold">{frictionAngle}</span></label>
            <input type="range" min="0" max="50" step="1" value={frictionAngle} onChange={e => setFrictionAngle(Number(e.target.value))} className="w-full accent-eng-600" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="effective-toggle" checked={useEffective} onChange={e => setUseEffective(e.target.checked)} className="rounded accent-eng-600 w-4 h-4" />
            <label htmlFor="effective-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300">Use Effective Stress</label>
          </div>
          {useEffective && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">Pore Pressure u (kPa):</label>
              <input
                type="range" min="0" max="200" step="5" value={porePressure}
                onChange={e => setPorePressure(Number(e.target.value))}
                className="w-32 accent-red-500"
              />
              <span className="text-sm text-red-600 dark:text-red-400 font-bold ml-1">{porePressure}</span>
            </div>
          )}
          <div className="sm:ml-auto">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">Student Name:</label>
            <input
              type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
              placeholder="Your name"
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'σ₁', value: `${values.sigma1} kPa` },
          { label: 'σ₃', value: `${values.sigma3} kPa` },
          { label: 'Centre', value: `${values.center.toFixed(1)} kPa` },
          { label: 'τ_max', value: `${values.tauMax.toFixed(1)} kPa` },
        ].map(i => (
          <div key={i.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{i.label}</p>
            <p className="text-lg font-heading font-bold text-slate-900 dark:text-white">{i.value}</p>
          </div>
        ))}
      </div>

      {/* Mohr Circle Graph */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5" id="mohr-canvas">
        <div className="h-[300px] md:h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Educational Panel */}
      <div className="bg-eng-50 dark:bg-slate-800 rounded-2xl p-5 border border-eng-200 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-eng-100 dark:bg-eng-900/30 flex items-center justify-center flex-shrink-0">
            <Info size={20} className="text-eng-600 dark:text-eng-400" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-eng-700 dark:text-eng-400 mb-1">Understanding Mohr Circles</h3>
            <p className="text-sm text-eng-700/80 dark:text-slate-400 leading-relaxed max-w-3xl">
              The Mohr circle represents all combinations of normal stress σ and shear stress τ acting on planes at different orientations within a soil element. The circle centre is at (σ₁ + σ₃)/2 and radius is (σ₁ − σ₃)/2. The failure envelope τ = c + σ tan φ is tangent to the circle at failure. The angle between the failure plane and the major principal plane is 45° + φ/2. When pore water pressure u is known, effective stresses are σ′ = σ − u.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
