import { useState, useMemo, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { useLocalStorage } from '../hooks/useLocalStorage';
import ExportButtons from '../components/ExportButtons';
import { useToast } from '../components/Toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function MohrCircle() {
  const { addToast } = useToast();
  const chartRef = useRef(null);
  const [circles, setCircles] = useLocalStorage('geolabx-mohr', [
    { sigma1: 350, sigma3: 100 },
    { sigma1: 550, sigma3: 200 },
  ]);
  const [porePressure, setPorePressure] = useState(0);
  const [mode, setMode] = useState('total');

  const addCircle = () => setCircles([...circles, { sigma1: 400, sigma3: 150 }]);
  const removeCircle = (i) => {
    if (circles.length <= 1) return;
    setCircles(circles.filter((_, idx) => idx !== i));
  };
  const updateCircle = (i, field, val) => {
    const updated = [...circles];
    updated[i] = { ...updated[i], [field]: parseFloat(val) || 0 };
    setCircles(updated);
  };

  const results = useMemo(() => {
    const pts = circles.map((c) => {
      const s1 = mode === 'effective' ? c.sigma1 - porePressure : c.sigma1;
      const s3 = mode === 'effective' ? c.sigma3 - porePressure : c.sigma3;
      return {
        sigma1: s1,
        sigma3: s3,
        center: (s1 + s3) / 2,
        radius: (s1 - s3) / 2,
        tauMax: (s1 - s3) / 2,
      };
    });

    let phi = 0;
    let cohesion = 0;
    if (pts.length >= 2) {
      const sorted = [...pts].sort((a, b) => b.sigma1 - a.sigma1);
      const p1 = sorted[0];
      const p2 = sorted[sorted.length - 1];
      const K2 = (p1.sigma1 - p2.sigma1) / Math.max(p1.sigma3 - p2.sigma3, 0.001);
      if (K2 > 0) {
        const K = Math.sqrt(K2);
        const phiRad = 2 * Math.atan(K) - Math.PI / 2;
        phi = (phiRad * 180) / Math.PI;
        cohesion = (p1.sigma1 - p1.sigma3 * K2) / (2 * K);
        if (cohesion < 0) cohesion = 0;
      }
    }
    return { points: pts, phi, cohesion };
  }, [circles, porePressure, mode]);

  const chartData = useMemo(() => {
    const datasets = results.points.map((pt, i) => {
      const circlePoints = [];
      for (let a = 0; a <= 2 * Math.PI; a += 0.03) {
        circlePoints.push({ x: pt.center + pt.radius * Math.cos(a), y: Math.abs(pt.radius * Math.sin(a)) });
      }
      return {
        label: `${mode === 'effective' ? "σ'" : '\u03C3'}\u2081=${pt.sigma1.toFixed(0)}, ${mode === 'effective' ? "σ'" : '\u03C3'}\u2083=${pt.sigma3.toFixed(0)}`,
        data: circlePoints,
        backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'][i % 4],
        borderColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'][i % 4],
        borderWidth: 2,
        pointRadius: 0,
        showLine: true,
        tension: 0,
      };
    });

    if (results.phi > 0 || results.cohesion > 0) {
      const maxSigma = Math.max(...results.points.map((p) => p.center + p.radius)) * 1.2;
      const envelopePoints = [
        { x: 0, y: results.cohesion },
        { x: maxSigma, y: results.cohesion + maxSigma * Math.tan((results.phi * Math.PI) / 180) },
      ];
      datasets.push({
        label: `Failure envelope: \u03C6=${results.phi.toFixed(1)}\u00B0, c=${results.cohesion.toFixed(1)} kPa`,
        data: envelopePoints,
        borderColor: '#f97316',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        showLine: true,
      });
    }

    return { datasets };
  }, [results]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: { display: true, text: `Normal Stress ${mode === 'effective' ? "σ'" : '\u03C3'} (kPa)` },
        min: 0,
        grid: { color: 'rgba(156,163,175,0.3)' },
        ticks: { callback: (v) => v },
      },
      y: {
        title: { display: true, text: 'Shear Stress \u03C4 (kPa)' },
        min: 0,
        grid: { color: 'rgba(156,163,175,0.3)' },
        ticks: { callback: (v) => v },
      },
    },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 14, padding: 15, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `\u03C3: ${ctx.parsed.x.toFixed(1)} kPa, \u03C4: ${ctx.parsed.y.toFixed(1)} kPa`,
        },
      },
    },
  };

  const exportData = results.points.map((pt) => ({
    '\u03C3\u2081 (kPa)': pt.sigma1.toFixed(2),
    '\u03C3\u2083 (kPa)': pt.sigma3.toFixed(2),
    '\u03C4_max (kPa)': pt.tauMax.toFixed(2),
    'Centre (kPa)': pt.center.toFixed(2),
    'Radius (kPa)': pt.radius.toFixed(2),
  }));

  const interpretation = results.phi > 0
    ? `Friction angle \u03C6 = ${results.phi.toFixed(1)}\u00B0, Cohesion c = ${results.cohesion.toFixed(1)} kPa. ${results.phi > 35 ? 'Indicates dense sand or stiff clay behaviour.' : results.phi > 25 ? 'Indicates medium-dense sand or firm clay.' : 'Indicates loose sand or soft clay.'}`
    : 'Add at least two circles to compute shear strength parameters.';

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">Mohr Circle Tool</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Stress Inputs</h2>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { setMode('total'); addToast('Switched to total stress mode', 'info'); }}
                className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${mode === 'total' ? 'bg-engineering-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              >
                Total Stress
              </button>
              <button
                onClick={() => { setMode('effective'); addToast('Switched to effective stress mode', 'info'); }}
                className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${mode === 'effective' ? 'bg-engineering-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              >
                Effective Stress
              </button>
            </div>

            {mode === 'effective' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Pore Water Pressure u (kPa)</label>
                <input
                  type="number"
                  value={porePressure}
                  onChange={(e) => setPorePressure(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-engineering-500 text-sm"
                />
              </div>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {circles.map((c, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Circle {i + 1}</span>
                    <button onClick={() => removeCircle(i)} className="text-red-500 hover:text-red-700 text-xs">&times; Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{mode === 'effective' ? "σ'" : '\u03C3'}\u2081 (kPa)</label>
                      <input
                        type="number"
                        value={c.sigma1}
                        onChange={(e) => updateCircle(i, 'sigma1', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-engineering-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">{mode === 'effective' ? "σ'" : '\u03C3'}\u2083 (kPa)</label>
                      <input
                        type="number"
                        value={c.sigma3}
                        onChange={(e) => updateCircle(i, 'sigma3', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-engineering-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addCircle} className="w-full py-2 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-engineering-400 hover:text-engineering-600 transition-colors">
                + Add Circle
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              {results.points.map((pt, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-300">Circle {i + 1} \u03C4\u2098\u2090\u2093</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{pt.tauMax.toFixed(1)} kPa</span>
                </div>
              ))}
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-300">{mode === 'effective' ? "\u03C6'" : '\u03C6'}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{results.phi.toFixed(1)}&deg;</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-300">{mode === 'effective' ? "c'" : 'c'}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{results.cohesion.toFixed(1)} kPa</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Mohr Circles</h2>
            <div className="h-80 md:h-96">
              <Scatter ref={chartRef} data={chartData} options={chartOptions} />
            </div>
          </div>

          <ExportButtons chartRef={chartRef} data={exportData} filename="mohr-circle" title="Mohr Circle Analysis" interpretation={interpretation} />
        </div>
      </div>
    </div>
  );
}
