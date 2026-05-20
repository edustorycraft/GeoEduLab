import { useRef } from 'react';
import { useToast } from './Toast';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

export default function ExportButtons({ chartRef, data, filename = 'report', title = 'GeoLabX Report', interpretation = '' }) {
  const { addToast } = useToast();
  const studentNameRef = useRef(null);

  const exportCSV = () => {
    if (!data || data.length === 0) {
      addToast('No data to export', 'warning');
      return;
    }
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('CSV exported successfully', 'success');
  };

  const exportPDF = async () => {
    const name = studentNameRef.current?.value?.trim() || 'Student';
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(title, pageW / 2, y, { align: 'center' });
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Student: ${name}`, 20, y);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageW - 20, y, { align: 'right' });
    y += 8;
    doc.setDrawColor(200);
    doc.line(20, y, pageW - 20, y);
    y += 10;

    if (data && data.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Data Table', 20, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      const keys = Object.keys(data[0]);
      const colW = (pageW - 40) / keys.length;
      const headerY = y;
      keys.forEach((k, i) => doc.text(String(k), 20 + i * colW, y));
      y += 5;
      doc.setDrawColor(180);
      doc.line(20, y, pageW - 20, y);
      y += 5;

      data.slice(0, 25).forEach((row) => {
        if (y > 270) { doc.addPage(); y = 20; }
        keys.forEach((k, i) => {
          const val = row[k] !== undefined && row[k] !== null ? String(row[k]) : '';
          doc.text(val, 20 + i * colW, y);
        });
        y += 5;
      });
      y += 8;
    }

    if (chartRef?.current) {
      const chart = chartRef.current;
      const canvas = chart.canvas;
      if (canvas) {
        if (y > 180) { doc.addPage(); y = 20; }
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Graph', 20, y);
        y += 6;
        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgW = pageW - 40;
        const imgH = (canvas.height / canvas.width) * imgW;
        if (y + imgH > 280) { doc.addPage(); y = 20; }
        doc.addImage(imgData, 'PNG', 20, y, imgW, imgH);
        y += imgH + 10;
      }
    }

    if (interpretation) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Interpretation', 20, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(interpretation, pageW - 40);
      lines.forEach((line) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 5;
      });
    }

    doc.save(`${filename}.pdf`);
    addToast('PDF exported successfully', 'success');
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Student Name</label>
        <input
          ref={studentNameRef}
          type="text"
          placeholder="Enter name"
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-engineering-500 w-40"
        />
      </div>
      <button onClick={exportCSV} className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors">
        Export CSV
      </button>
      <button onClick={exportPDF} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
        Export PDF
      </button>
    </div>
  );
}
