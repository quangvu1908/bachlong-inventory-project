/**
 * Trigger a real file download in the browser.
 * Builds a Blob from the CSV string and clicks a temporary <a> element.
 */
export function downloadCSV(filename: string, rows: (string | number)[][]) {
  // Escape: wrap fields containing comma/newline/quote in double quotes,
  // and double any embedded quotes.
  const escape = (val: string | number) => {
    const s = String(val ?? '')
    if (/[",\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }

  const csv = rows.map((r) => r.map(escape).join(',')).join('\n')
  // Prepend BOM so Excel reads UTF-8 (Vietnamese diacritics) correctly
  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Revoke on next tick to ensure the download started
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Build a date-stamped filename like `ton-kho-2026-10-01.csv` */
export function csvFilename(prefix: string) {
  const d = new Date()
  const iso = d.toISOString().slice(0, 10)
  return `${prefix}-${iso}.csv`
}
