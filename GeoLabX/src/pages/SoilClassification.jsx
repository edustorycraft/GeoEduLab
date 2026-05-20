import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title, Tooltip, Legend);

function classifyUSCS(ll, pl, sieveData) {
  const pi = ll - pl;
  const fines = sieveData?.length > 0
    ? (sieveData.find((s) => s.size <= 0.075)?.passing ?? 0)
    : 0;
  const gravel = sieveData?.length > 0
    ? 100 - (sieveData.find((s) => s.size <= 4.75)?.passing ?? 100)
    : 0;
  const sand = 100 - fines - gravel;
  const coarseFraction = gravel + sand;

  let symbol = '--';
  let description = 'Insufficient data for classification';
  let group = '';

  if (coarseFraction >= 50) {
    group = 'Coarse-grained';
    if (gravel >= sand) {
      if (fines < 5) {
        symbol = 'GW';
        description = 'Well-graded gravel';
      } else if (fines <= 12) {
        symbol = 'GW-GM';
        description = 'Well-graded gravel with silt';
      } else if (pi > 7 || (pi > 4 && ll < 50)) {
        symbol = 'GC';
        description = 'Clayey gravel';
      } else {
        symbol = 'GM';
        description = 'Silty gravel';
      }
    } else {
      if (fines < 5) {
        symbol = 'SW';
        description = 'Well-graded sand';
      } else if (fines <= 12) {
        symbol = 'SW-SM';
        description = 'Well-graded sand with silt';
      } else if (pi > 7 || (pi > 4 && ll < 50)) {
        symbol = 'SC';
        description = 'Clayey sand';
      } else {
        symbol = 'SM';
        description = 'Silty sand';
      }
    }
  } else {
    group = 'Fine-grained';
    if (ll < 50) {
      if (pi > 7) {
        symbol = 'CL';
        description = 'Lean clay (low plasticity)';
      } else if (pi >= 4) {
        symbol = 'CL-ML';
        description = 'Silty clay (low plasticity)';
      } else {
        symbol = 'ML';
        description = 'Silt (low plasticity)';
      }
    } else {
      if (pi >= 0.73 * (ll - 20)) {
        symbol = 'CH';
        description = 'Fat clay (high plasticity)';
      } else {
        symbol = 'MH';
        description = 'Elastic silt (high plasticity)';
      }
    }
  }

  return { symbol, description, group, ll, pl, pi, fines, gravel, sand };
}

export default function SoilClassification() {
  const { addToast } = useToast();
  const chartRef = useRef(null);

  const [liquidLimit, setLiquidLimit] = useLocalStorage('geolabx-ll', 45);
  const [plasticLimit, setPlasticLimit] = useLocalStorage('geolabx-pl', 22);
  const [sieveData, setSieveData] = useLocalStorage('geolabx-sieve', [
    { size: 4.75, passing: 100 },
    { size: 2.0, passing: 90 },
    { size: 0.425, passing: 65 },
    { size: 0.075, passing: 35 },
  ]);

  const pi = liquidLimit - plasticLimit;
  const classification = useMemo(
    () => classifyUSCS(liquidLimit, plasticLimit, sieveData),
    [liquidLimit, plasticLimit, sieveData]
  );

  const loadSample = useCallback(() => {
    setLiquidLimit(sampleData.classification.liquidLimit);
    setPlasticLimit(sampleData.classification.plasticLimit);
    setSieveData(sampleData.classification.sieveData);
    addToast('Sample dataset loaded', 'success');
  }, [addToast, setLiquidLimit, setPlasticLimit, setSieveData]);

  const reset = () => {
    setLiquidLimit(40);
    setPlasticLimit(20);
    setSieveData([{ size: 4.75, passing: 100 }, { size: 0.075, passing: 50 }]);
    addToast('Reset to defaults', 'info');
  };

  const updateSieve = (i, field, val) => {
    const updated = [...sieveData];
    updated[i] = { ...updated[i], [field]: parseFloat(val) || 0 };
    setSieveData(updated);
  };
  const addSieveRow = () => setSieveData([...sieveData, { size: 0, passing: 0 }]);
  const removeSieveRow = (i) => {
    if (sieveData.length <= 2) return;
    setSieveData(sieveData.filter((_, idx) => idx !== i));
  };

  const plasticityChartData = useMemo(() => {
    const aLine = [];
    for (let ll = 0; ll <= 100; ll += 1) {
      const piVal = 0.73 * (ll - 20);
      if (piVal >= 0) aLine.push({ x: ll, y: piVal });
    }
    const uLine = [];
    for (let ll = 8; ll <= 100; ll += 1) {
      const piVal = 0.9 * (ll - 8);
      if (piVal >= 0) uLine.push({ x: ll, y: piVal });
    }
    return {
      datasets: [
        {
          label: 'A-line: PI = 0.73(LL \u2212 20)',
          data: aLine,
          borderColor: '#f97316',
          borderWidth: 2,
          pointRadius: 0,
          showLine: true,
        },
        {
          label: 'U-line: PI = 0.9(LL \u2212 8)',
          data: uLine,
          borderColor: '#6b7280',
          borderWidth: 1.5,
          borderDash: [5, 3],
          pointRadius: 0,
          showLine: true,
        },
        {
          label: 'Soil Sample',
          data: pi >= 0 ? [{ x: liquidLimit, y: pi }] : [],
          backgroundColor: '#2563eb',
          borderColor: '#1d4ed8',
          borderWidth: 2,
          pointRadius: 8,
          pointStyle: 'circle',
        },
      ],
    };
  }, [liquidLimit, pi]);

  const plasticityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'Liquid Limit LL (%)' }, min: 0, max: 100, grid: { color: 'rgba(156,163,175,0.3)' } },
      y: { title: { display: true, text: 'Plasticity Index PI (%)' }, min: 0, max: 60, grid: { color: 'rgba(156,163,175,0.3)' } },
    },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
    },
  };

  const particleChartData = useMemo(() => {
    const sorted = [...sieveData].sort((a, b) => a.size - b.size);
    return {
      datasets: [{
        label: '% Passing',
        data: sorted.map((s) => ({ x: s.size, y: s.passing })),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        pointRadius: 5,
        showLine: true,
        tension: 0.3,
        fill: true,
      }],
    };
  }, [sieveData]);

  const particleChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { type: 'logarithmic', title: { display: true, text: 'Particle Size (mm)' }, grid: { color: 'rgba(156,163,175,0.3)' } },
      y: { title: { display: true, text: '% Passing' }, min: 0, max: 100, grid: { color: 'rgba(156,163,175,0.3)' } },
    },
    plugins: { legend: { display: false } },
  };

  const exportData = [
    { 'Property': 'Liquid Limit (%)', 'Value': liquidLimit },
    { 'Property': 'Plastic Limit (%)', 'Value': plasticLimit },
    { 'Property': 'Plasticity Index (%)', 'Value': pi },
    { 'Property': 'Fines Content (%)', 'Value': classification.fines },
    { 'Property': 'Sand Content (%)', 'Value': classification.sand },
    { 'Property': 'Gravel Content (%)', 'Value': classification.gravel },
    { 'Property': 'USCS Symbol', 'Value': classification.symbol },
    { 'Property': 'Soil Description', 'Value': classification.description },
  ];

  const interpretation =
    `USCS Classification: ${classification.symbol} \u2014 ${classification.description}\n` +
    `Soil Group: ${classification.group}\n` +
    `Liquid Limit = ${liquidLimit}%, Plastic Limit = ${plasticLimit}%, PI = ${pi}%\n` +
    `Fines = ${classification.fines}%, Sand = ${classification.sand}%, Gravel = ${classification.gravel}%\n` +
    `${pi >= 0.73 * (liquidLimit - 20) ? 'Sample plots above the A-line (clay behaviour).' : 'Sample plots below the A-line (silt behaviour).'}`;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">Soil Classification</h1>
        <div className="flex gap-2">
          <button onClick={loadSample} className="px-3 py-1.5 text-sm bg-engineering-100 dark:bg-engineering-800 text-engineering-700 dark:text-engineering-200 rounded-md hover:bg-engineering-200 transition-colors">
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
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Atterberg Limits</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Liquid Limit LL (%)</label>
                <input
                  type="number"
                  value={liquidLimit}
                  onChange={(e) => setLiquidLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-engineering-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Plastic Limit PL (%)</label>
                <input
                  type="number"
                  value={plasticLimit}
                  onChange={(e) => setPlasticLimit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-engineering-500"
                />
              </div>
              <div className="flex justify-between py-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-300">Plasticity Index PI</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{pi.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Classification Result</h2>
            <div className="p-3 bg-engineering-50 dark:bg-engineering-900/20 rounded-lg border border-engineering-100 dark:border-engineering-800">
              <div className="text-2xl font-heading font-bold text-engineering-700 dark:text-engineering-300">{classification.symbol}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{classification.description}</div>
              <div className="text-xs text-gray-400 mt-1">{classification.group}</div>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Fines</span><span className="text-gray-900 dark:text-white">{classification.fines}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Sand</span><span className="text-gray-900 dark:text-white">{classification.sand}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Gravel</span><span className="text-gray-900 dark:text-white">{classification.gravel}%</span></div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Particle Size Data</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-1.5 px-2 text-gray-500 dark:text-gray-400 text-xs">Size (mm)</th>
                    <th className="text-left py-1.5 px-2 text-gray-500 dark:text-gray-400 text-xs">% Passing</th>
                    <th className="py-1.5 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sieveData.map((s, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-1 px-2">
                        <input
                          type="number" step="0.01"
                          value={s.size}
                          onChange={(e) => updateSieve(i, 'size', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-xs"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number" min="0" max="100"
                          value={s.passing}
                          onChange={(e) => updateSieve(i, 'passing', e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-xs"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <button onClick={() => removeSieveRow(i)} className="text-red-400 hover:text-red-600 text-xs">&times;</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addSieveRow} className="mt-2 w-full py-1 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded text-gray-500 hover:border-engineering-400 transition-colors">+ Add Sieve</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Plasticity Chart</h2>
            <div className="h-72 md:h-80">
              <Scatter ref={chartRef} data={plasticityChartData} options={plasticityChartOptions} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span>CL: Lean clay</span>
              <span>CH: Fat clay</span>
              <span>ML: Silt</span>
              <span>MH: Elastic silt</span>
              <span>CL-ML: Silty clay</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-heading font-semibold text-gray-800 dark:text-white mb-3">Particle Size Distribution</h2>
            <div className="h-56 md:h-64">
              <Scatter data={particleChartData} options={particleChartOptions} />
            </div>
          </div>

          <ExportButtons
            chartRef={chartRef}
            data={exportData}
            filename="soil-classification"
            title="Soil Classification Report"
            interpretation={interpretation}
          />
        </div>
      </div>
    </div>
  );
}
