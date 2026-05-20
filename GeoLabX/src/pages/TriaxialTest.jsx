import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Scatter } from 'react-chartjs-2';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { sampleData } from '../data/sampleData';
import ExportButtons from '../components/ExportButtons';
import { useToast } from '../components/Toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const emptyReading = { load: 0, deformation: 0 };

export default function TriaxialTest() {
  const { addToast } = useToast();
  const strainChartRef = useRef(null);
  const mohrChartRef = useRef(null);

  const [tests, setTests] = useLocalStorage('geolabx-triaxial-tests', [
    {
      id: 1, type: 'CD', confiningPressure: 100, diameter: 38, height: 76,
      readings: sampleData.triaxial[0].readings,
    },
    {
      id: 2, type: 'CD', confiningPressure: 200, diameter: 38, height: 76,
      readings: sampleData.triaxial[1].readings,
    },
    {
      id: 3, type: 'CD', confiningPressure: 300, diameter: 38, height: 76,
      readings: sampleData.triaxial[2].readings,
    },
  ]);
  const [activeTest, setActiveTest] = useState(0);

  const updateTest = (field, value) => {
    const updated = [...tests];
    updated[activeTest] = { ...updated[activeTest], [field]: value };
    setTests(updated);
  };

  const addTest = () => {
    const newId = Math.max(0, ...tests.map((t) => t.id)) + 1;
    setTests([...tests, { id: newId, type: 'CD', confiningPressure: 100, diameter: 38, height: 76, readings: [{ load: 0, deformation: 0 }] }]);
    setActiveTest(tests.length);
    addToast('New test added', 'success');
  };

  const removeTest = (idx) => {
    if (tests.length <= 1) return;
    const updated = tests.filter((_, i) => i !== idx);
    setTests(updated);
    setActiveTest(Math.min(activeTest, updated.length - 1));
    addToast('Test removed', 'info');
  };

  const updateReading = (i, field, value) => {
    const updated = [...tests];
    const readings = [...updated[activeTest].readings];
    readings[i] = { ...readings[i], [field]: parseFloat(value) || 0 };
    updated[activeTest] = { ...updated[activeTest], readings };
    setTests(updated);
  };

  const addReading = () => {
    const updated = [...tests];
    updated[activeTest] = {
      ...updated[activeTest],
      readings: [...updated[activeTest].readings, { ...emptyReading }],
    };
    setTests(updated);
  };

  const removeReading = (i) => {
    if (tests[activeTest].readings.length <= 2) return;
    const updated = [...tests];
    updated[activeTest] = {
      ...updated[activeTest],
      readings: updated[activeTest].readings.filter((_, idx) => idx !== i),
    };
    setTests(updated);
  };

  const resetTests = () => {
    setTests([
      { id: 1, type: 'CD', confiningPressure: 100, diameter: 38, height: 76, readings: [{ load: 0, deformation: 0 }] },
      { id: 2, type: 'CD', confiningPressure: 200, diameter: 38, height: 76, readings: [{ load: 0, deformation: 0 }] },
    ]);
    setActiveTest(0);
    addToast('Reset to defaults', 'info');
  };

  const loadSample = useCallback(() => {
    setTests(sampleData.triaxial.map((s, i) => ({
      id: i + 1,
      type: s.type,
      confiningPressure: s.confiningPressure,
      diameter: s.diameter,
      height: s.height,
      readings: s.readings,
    })));
    setActiveTest(0);
    addToast('Sample dataset loaded', 'success');
  }, [addToast, setTests]);

  const allResults = useMemo(() => {
    return tests.map((test) => {
      const area0 = Math.PI * Math.pow(test.diameter / 2000, 2);
      const h0 = test.height / 1000;
      const data = test.readings.map((r) => {
        const strain = h0 > 0 ? (r.deformation / 1000) / h0 : 0;
        const corrArea = strain < 0.99 ? area0 / (1 - strain) : area0;
        const deviatorStress = corrArea > 0 ? (r.load * 1000) / corrArea / 1000 : 0;
        return { ...r, strain: strain * 100, deviatorStress, sigma1: deviatorStress + test.confiningPressure };
      });

      const maxIdx = data.reduce((maxI, d, i) => (d.deviatorStress > data[maxI].deviatorStress ? i : maxI), 0);
      const sigma1f = data[maxIdx].sigma1;

      return {
        testId: test.id,
        type: test.type,
        confiningPressure: test.confiningPressure,
        data,
        sigma1f,
        tauMax: (sigma1f - test.confiningPressure) / 2,
        center: (sigma1f + test.confiningPressure) / 2,
        radius: (sigma1f - test.confiningPressure) / 2,
        maxIdx,
      };
    });
  }, [tests]);

  const current = allResults[activeTest] || allResults[0];

  const shearParams = useMemo(() => {
    if (allResults.length < 2) return { phi: 0, cohesion: 0 };
    const pts = allResults.map((r) => ({ s1: r.sigma1f, s3: r.confiningPressure }));
    const sorted = [...pts].sort((a, b) => b.s1 - a.s1);
    const p1 = sorted[0];
    const p2 = sorted[sorted.length - 1];
    const denom = Math.max(p1.s3 - p2.s3, 0.01);
    const K2 = (p1.s1 - p2.s1) / denom;
    if (K2 <= 0) return { phi: 0, cohesion: 0 };
    const K = Math.sqrt(K2);
    const phiRad = 2 * Math.atan(K) - Math.PI / 2;
    const phi = (phiRad * 180) / Math.PI;
    let cohesion = (p1.s1 - p1.s3 * K2) / (2 * K);
    if (cohesion < 0) cohesion = 0;
    return { phi, cohesion };
  }, [allResults]);

  const strainChartData = {
    labels: current?.data.map((d) => d.strain.toFixed(2)) || [],
    datasets: [
      {
        label: `Deviator Stress q (\u03C3\u2083 = ${current?.confiningPressure || 0} kPa)`,
        data: current?.data.map((d) => d.deviatorStress) || [],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: current?.data.map((_, i) => (i === current?.maxIdx ? 6 : 2)) || 2,
        pointBackgroundColor: current?.data.map((_, i) => (i === current?.maxIdx ? '#ef4444' : '#2563eb')) || '#2563eb',
      },
    ],
  };

  const strainChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Axial Strain \u03B5\u2090 (%)' }, grid: { color: 'rgba(156,163,175,0.3)' } },
      y: { title: { display: true, text: 'Deviator Stress q (kPa)' }, grid: { color: 'rgba(156,163,175,0.3)' }, min: 0 },
    },
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
  };

  const mohrChartData = useMemo(() => {
    const datasets = [];
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

    allResults.forEach((r, i) => {
      const circlePts = [];
      for (let a = 0; a <= 2 * Math.PI; a += 0.03) {
        circlePts.push({ x: r.center + r.radius * Math.cos(a), y: Math.abs(r.radius * Math.sin(a)) });
      }
      datasets.push({
        label: `\u03C3\u2083=${r.confiningPressure} kPa`,
        data: circlePts,
        backgroundColor: colors[i % colors.length],
        borderColor: colors[i % colors.length],
        borderWidth: 2,
        pointRadius: 0,
        showLine: true,
        tension: 0,
      });
    });

    if (shearParams.phi > 0 || shearParams.cohesion > 0) {
      const maxX = Math.max(...allResults.map((r) => r.center + r.radius)) * 1.2;
      const m = Math.tan((shearParams.phi * Math.PI) / 180);
      datasets.push({
        label: `\u03C6=${shearParams.phi.toFixed(1)}\u00B0, c=${shearParams.cohesion.toFixed(1)} kPa`,
        data: [
          { x: 0, y: shearParams.cohesion },
          { x: maxX, y: shearParams.cohesion + maxX * m },
        ],
        borderColor: '#f97316',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        showLine: true,
      });
    }
    return { datasets };
  }, [allResults, shearParams]);

  const mohrChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Normal Stress \u03C3 (kPa)' }, min: 0, grid: { color: 'rgba(156,163,175,0.3)' } },
      y: { title: { display: true, text: 'Shear Stress \u03C4 (kPa)' }, min: 0, grid: { color: 'rgba(156,163,175,0.3)' } },
    },
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } } },
  };

  const exportStrainData = current?.data.map((d) => ({
    'Strain %': d.strain.toFixed(4),
    'Deviator Stress (kPa)': d.deviatorStress.toFixed(2),
    '\u03C3\u2081 (kPa)': d.sigma1.toFixed(2),
  })) || [];

  const interpretation =
    `\u03C6 = ${shearParams.phi.toFixed(1)}\u00B0, c = ${shearParams.cohesion.toFixed(1)} kPa. ` +
    (shearParams.phi > 35 ? 'Dense sand or overconsolidated clay.' :
     shearParams.phi > 25 ? 'Medium-dense sand or firm clay.' :
     shearParams.phi > 15 ? 'Loose sand or soft clay.' : 'Very soft cohesive soil.');

  const currentTest = tests[activeTest] || tests[0];

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Triaxial Test Simulator</h1>
        <div className="flex gap-2">
          <button onClick={loadSample} className="px-3 py-1.5 text-sm bg-engineering-100 dark:bg-engineering-800 text-engineering-700 dark:text-engineering-200 rounded-md hover:bg-engineering-200 transition-colors">
            Load Sample
          </button>
          <button onClick={resetTests} className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            Reset
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Tests</h2>
            <div className="space-y-1 mb-3 max-h-48 overflow-y-auto">
              {tests.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTest(i)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    i === activeTest
                      ? 'bg-engineering-50 dark:bg-engineering-900/30 text-engineering-700 dark:text-engineering-300 font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="flex justify-between">
                    <span>{t.type} \u03C3\u2083={t.confiningPressure} kPa</span>
                    {tests.length > 1 && (
                      <span onClick={(e) => { e.stopPropagation(); removeTest(i); }} className="text-red-400 hover:text-red-600">&times;</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
            <button onClick={addTest} className="w-full py-1.5 text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-engineering-400 transition-colors">
              + Add Test
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Test Setup</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Test Type</label>
                <select
                  value={currentTest.type}
                  onChange={(e) => updateTest('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-engineering-500"
                >
                  <option value="UU">UU (Unconsolidated Undrained)</option>
                  <option value="CU">CU (Consolidated Undrained)</option>
                  <option value="CD">CD (Consolidated Drained)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">\u03C3\u2083 Confining Pressure (kPa)</label>
                <input
                  type="number"
                  value={currentTest.confiningPressure}
                  onChange={(e) => updateTest('confiningPressure', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-engineering-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Diameter (mm)</label>
                  <input
                    type="number"
                    value={currentTest.diameter}
                    onChange={(e) => updateTest('diameter', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-engineering-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Height (mm)</label>
                  <input
                    type="number"
                    value={currentTest.height}
                    onChange={(e) => updateTest('height', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-engineering-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Shear Strength</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-300">\u03C6</span>
                <span className="font-bold text-gray-900 dark:text-white">{shearParams.phi.toFixed(1)}&deg;</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-600 dark:text-gray-300">c</span>
                <span className="font-bold text-gray-900 dark:text-white">{shearParams.cohesion.toFixed(1)} kPa</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Stress\u2013Strain Curve</h2>
            <div className="h-72 md:h-80">
              <Line ref={strainChartRef} data={strainChartData} options={strainChartOptions} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Mohr Circles &amp; Failure Envelope</h2>
            <div className="h-72 md:h-80">
              <Scatter ref={mohrChartRef} data={mohrChartData} options={mohrChartOptions} />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-x-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-heading font-semibold text-gray-800 dark:text-white">Reading Table (Test: {currentTest.type}, \u03C3\u2083={currentTest.confiningPressure} kPa)</h2>
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
                    <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">\u03B5\u2090 %</th>
                    <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">q (kPa)</th>
                    <th className="text-left py-2 px-2 text-gray-500 dark:text-gray-400 font-medium">\u03C3\u2081 (kPa)</th>
                    <th className="text-left py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentTest.readings.map((r, i) => {
                    const d = current?.data[i] || {};
                    return (
                      <tr key={i} className={`border-b border-gray-100 dark:border-gray-700 ${i === current?.maxIdx ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                        <td className="py-1.5 px-2 text-gray-400">{i + 1}</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number" step="0.001"
                            value={r.load}
                            onChange={(e) => updateReading(i, 'load', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-sm"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number" step="0.01"
                            value={r.deformation}
                            onChange={(e) => updateReading(i, 'deformation', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-sm"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-gray-900 dark:text-white font-mono">{d.strain?.toFixed(3) || '0.000'}</td>
                        <td className="py-1.5 px-2 text-gray-900 dark:text-white font-mono font-semibold">{d.deviatorStress?.toFixed(2) || '0.00'}</td>
                        <td className="py-1.5 px-2 text-gray-900 dark:text-white font-mono">{d.sigma1?.toFixed(2) || '0.00'}</td>
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

          <ExportButtons
            chartRef={strainChartRef}
            data={exportStrainData}
            filename="triaxial-test"
            title="Triaxial Test Report"
            interpretation={interpretation}
          />
        </div>
      </div>
    </div>
  );
}
