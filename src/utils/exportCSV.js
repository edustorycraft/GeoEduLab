export function exportToCSV(filename, rows, headers) {
  if (!rows || rows.length === 0) return
  const headerLine = headers.map(h => h.label).join(',')
  const csvContent = [headerLine, ...rows.map(row => headers.map(h => row[h.key] ?? '').join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
