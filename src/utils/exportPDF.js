import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function generatePDFReport(config) {
  const { title, studentName, date, inputParams, results, data, graphCanvas, interpretation } = config
  const doc = new jsPDF()
  let y = 15

  // Header bar
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, 210, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('GeoLabX — Geotechnical Laboratory Report', 14, 16)

  y = 35
  doc.setTextColor(30, 58, 138)
  doc.setFontSize(16)
  doc.text(title, 14, y)
  y += 10

  // Student info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.text(`Student Name: ${studentName || '_______________'}`, 14, y)
  y += 7
  doc.text(`Date: ${date || new Date().toLocaleDateString('en-GB')}`, 14, y)
  y += 10

  // Divider
  doc.setDrawColor(37, 99, 235)
  doc.setLineWidth(0.8)
  doc.line(14, y, 196, y)
  y += 8

  // Input Parameters
  if (inputParams && Object.keys(inputParams).length > 0) {
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(13)
    doc.text('Input Parameters', 14, y)
    y += 8

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    Object.entries(inputParams).forEach(([key, val]) => {
      doc.text(`${key}: ${val}`, 18, y)
      y += 6
    })
    y += 4
  }

  // Results
  if (results && results.length > 0) {
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(13)
    doc.text('Calculated Results', 14, y)
    y += 8

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    results.forEach(({ label, value }) => {
      doc.text(`${label}: ${value}`, 18, y)
      y += 6
    })
    y += 4
  }

  // Graph
  if (graphCanvas) {
    try {
      const imgData = graphCanvas.toDataURL('image/png')
      const imgWidth = 180
      const imgHeight = graphCanvas.height * imgWidth / graphCanvas.width
      if (y + imgHeight > 270) {
        doc.addPage()
        y = 15
      }
      doc.addImage(imgData, 'PNG', 15, y, imgWidth, Math.min(imgHeight, 100))
      y += Math.min(imgHeight, 100) + 8
    } catch (e) {
      console.warn('Could not embed graph image:', e)
    }
  }

  // Data Table
  if (data && data.length > 0) {
    if (y > 200) {
      doc.addPage()
      y = 15
    }
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(13)
    doc.text('Data Table', 14, y)
    y += 6

    const tableHeaders = data.headers || Object.keys(data.rows[0] || {})
    const tableRows = data.rows.map(row => tableHeaders.map(h => row[h] ?? ''))

    doc.autoTable({
      startY: y,
      head: [tableHeaders.map(h => String(h))],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    })
  }

  // Footer with interpretation
  if (doc.lastAutoTable) {
    const finalY = doc.lastAutoTable.finalY + 15
    if (finalY > 260) {
      doc.addPage()
    }
  }

  // Interpretation section
  if (interpretation) {
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(13)
    doc.text('Interpretation', 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : y + 10)
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(interpretation, 180)
    lines.forEach((line, i) => {
      const lineY = (doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : y + 18) + i * 5
      if (lineY > 280) {
        doc.addPage()
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.text(line, 14, 15)
      } else {
        doc.text(line, 14, lineY)
      }
    })
  }

  // Footer on every page
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `GeoLabX Virtual Laboratory | Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 8
    )
    doc.text(
      `Generated: ${new Date().toLocaleString('en-GB')}`,
      196,
      doc.internal.pageSize.height - 8,
      { align: 'right' }
    )
  }

  doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`)
}
