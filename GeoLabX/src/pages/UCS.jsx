import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { sampleData } from '../data/sampleData';
import ExportButtons from '../components/ExportButtons';
import { useToast } from '../components/Toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const emptyReading = { load: 0, deformation: 0 };

export default function UCSTest() {
  const { addToast } = useToast();
  const chartRef = useRef(null);
  const [diameter, setDiameter] = useLocalStorage('geolabx-ucs-diam', 38);
  const [height, setHeight] = useLocalStorage('geolabx-ucs-height', 76);
  const [readings, setReadings] = useLocalStorage('geolabx-ucs-readings', [
    { load: 0, deformation: 0 },
    { load: 0.05, deformation: 0.25 },
    { load: 0.10, deformation: 0.50 },
    { load: 0.14, deformation: 0.75 },
    { load: 0.16, deformation: 1.00 },
    { load: 0.15, deformation: 1.50 },
  ]);

  const area0 = useMemo(() => Math.PI * Math.pow(diameter / 2000, 2), [diameter]);
  const heightM = height / 1000;

  const results = useMemo(() => {
    const data = readings.map((r) => {
      const strain = heightM > 0 ? (r.deformation / 1000) / heightM : 0;
      const corrArea = strain < 1 ? area0 / (1 - strain) : area0;
      const stress = corrArea > 0 ? (r.load * 1000) / corrArea / 1000 : 0;
      return { ...r, strain: strain * 100, stress };
    });

    const maxIdx = data.reduce((maxI, d, i) => (d.stress > data[maxI].stress ? i : maxI), 0);
    const qu = data[maxIdx].stress;
    const su = qu / 2;

    return { data, qu, su, failureIndex: maxIdx };
  }, [readings, area0, heightM]);

  const loadSampleData = useCallback(() => {
    setDiameter(sampleData.ucs.diameter);
    setHeight(sampleData.ucs.height);
    setReadings(sampleData.ucs.readings);
    addToast('Sample dataset loaded', 'success');
  }, [addToast, setDiameter, setHeight, setReadings]);

  const addReading = () => setReadings([...readings, { ...emptyReading }]);
  const removeReading = (i) => {
    if (readings.length <= 2) return;
    setReadings(readings.filter((_, idx) => idx !== i));
  };
  const updateReading = (i, f, v) => {
    const upd = [...readings];
    upd[i] = { ...upd[i], [f]: parseFloat(v) || 0 };
    setReadings(upd);
  };
  const reset = () => {
    setReadings([{ load: 0, deformation: 0 }, { load: 0, deformation: 0 }]);
    setDiameter(38);
    setHeight(76);
    addToast('Reset to defaults', 'info');
  };

  const chartData = {
    labels: results.data.map((d) => d.strain.toFixed(2)),
    datasets: [
      {
        label: 'Stress\u2013Strain',
        data: results.data.map((d) => d.stress),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: results.data.map((_, i) =>
          i === results.failureIndex ? '#ef4444' : '#2563eb'
        ),
        pointBorderColor: results.data.map((_, i) =>
          i === results.failureIndex ? '#ef4444' : '#2563eb'
        ),
        pointRadius: results.data.map((_, i) => (i === results.failureIndex ? 7 : 3)),
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Axial Strain \u03B5\u2090 (%)' }, grid: { color: 'rgba(156,163,175,0.3)' } },
      y: { title: { display: true, text: 'Compressive Stress (kPa)' }, grid: { color: 'rgba(156,163,175,0.3)' }, min: 0 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `\u03C3: ${ctx.parsed.y.toFixed(2)} kPa, \u03B5: ${ctx.label}%`,
        },
      },
    },
  };

  const exportData = results.data.map((d) => ({
    'Strain %': d.strain.toFixed(4),
    'Load (kN)': d.load.toFixed(4),
    'Deformation (mm)': d.deformation.toFixed(2),
    'Stress (kPa)': d.stress.toFixed(2),
  }));

  const interpretation = `\nUnconfined Compressive Strength q\u1D64 = ${results.qu.toFixed(2)} kPa\nUndrained Shear Strength s\u1D64 = ${results.su.toFixed(2)} kPa\nFailure occurred at ${results.data[results.failureIndex]?.strain.toFixed(2)}% strain.` +
    (results.qu < 25 ? '\nVery soft clay (q\u1D64 < 25 kPa).' :
     results.qu < 50 ? '\nSoft clay (25 \u2264 q\u1D64 < 50 kPa).' :
     results.qu < 100 ? '\nFirm clay (50 \u2264 q\u1D64 < 100 kPa).' :
     results.qu < 200 ? '\nStiff clay (100 \u2264 q\u1D64 < 200 kPa).' :
     results.qu < 400 ? '\nVery stiff clay (200 \u2264 q\u1D64 < 400 kPa).' :
     '\nHard clay (q\u1D64 \u2265 400 kPa).');

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Unconfined Compression Test</h1>
        <div className="flex gap-2">
          <button onClick={loadSampleData} className="px-3 py-1.5 text-sm bg-engineering-100 dark:bg-engineering-800 text-engineering-700 dark:text-engineering-200 rounded-md hover:bg-engineering-200 transition-colors">
            Load Sample
          </button>
          <button onClick={reset} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Reset
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Sample Dimensions</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Diameter (mm)</label>
                <input
                  type="number"
                  value={diameter}
                  onChange={(e) => setDiameter(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-engineering-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Height (mm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-engineering-500"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400">Area\u2080 = {area0.toFixed(6)} m&sup2;</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">q\u1D64</span>
                <span className="font-bold text-red-600 dark:text-red-400">{results.qu.toFixed(2)} kPa</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-300">s\u1D64</span>
                <span className="font-bold text-gray-900 dark:text-white">{results.su.toFixed(2)} kPa</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Stress\u2013Strain Curve</h2>
            <div className="h-72 md:h-80">
              <Line ref={chartRef} data={chartData} options={chartOptions} />
            </div>
            {results.failureIndex >= 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="text-gray-600 dark:text-gray-300">Failure point at \u03B5 = {results.data[results.failureIndex]?.strain.toFixed(2)}%</span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-x-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-heading font-semibold text-gray-800 dark:text-white">Data Table</h2>
              <button onClick={addReading} className="px-3 py-1 text-sm bg-engineering-50 dark:bg-engineering-900/30 text-engineering-700 dark:text-engineering-300 rounded-md hover:bg-engineering-100 transition-colors">
                + Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">#</th>
                    <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Load (kN)</th>
                    <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Def. (mm)</th>
                    <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Strain %</th>
                    <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">Stress (kPa)</th>
                    <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r, i) => {
                    const d = results.data[i] || {};
                    return (
                      <tr key={i} className={`border-b border-gray-100 dark:border-gray-700 ${i === results.failureIndex ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                        <td className="py-1.5 px-2 text-gray-400">{i + 1}</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.001"
                            value={r.load}
                            onChange={(e) => updateReading(i, 'load', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-engineering-500"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.01"
                            value={r.deformation}
                            onChange={(e) => updateReading(i, 'deformation', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-engineering-500"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-gray-900 dark:text-white font-mono">{d.strain?.toFixed(3) || '0.000'}</td>
                        <td className="py-1.5 px-2 text-gray-900 dark:text-white font-mono font-semibold">{d.stress?.toFixed(2) || '0.00'}</td>
                        <td className="py-1.5 px-2">
                          <button onClick={() => removeReading(i)} className="text-red-400 hover:text-red-600 text-xs">&times;</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <ExportButtons chartRef={chartRef} data={exportData} filename="ucs-test" title="Unconfined Compression Test Report" interpretation={interpretation} />
        </div>
      </div>
    </div>
  );
}
