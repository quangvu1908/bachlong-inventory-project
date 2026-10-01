/**
 * Excel export using SpreadsheetML 2003 XML format.
 * No external library — produces an .xls file that opens in Excel/LibreOffice/Google Sheets.
 * Preserves Vietnamese UTF-8 and supports multiple sheets.
 */
interface SheetData {
  name: string
  rows: (string | number)[][]
}

function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Build SpreadsheetML 2003 XML document with one or more sheets. */
function buildSpreadsheetXml(sheets: SheetData[]): string {
  const colCount = Math.max(
    ...sheets.map((s) => s.rows.map((r) => r.length).reduce((a, b) => Math.max(a, b), 0)),
    1
  )

  const sheetXml = sheets
    .map((sheet) => {
      const rowsXml = sheet.rows
        .map((row, ri) => {
          const cellsXml = Array.from({ length: colCount })
            .map((_, ci) => {
              const val = row[ci]
              if (val === undefined || val === '' || val === null) {
                return `<Cell ss:Index="${ci + 1}"/>`
              }
              const isNum = typeof val === 'number' && !Number.isNaN(val)
              return `<Cell ss:Index="${ci + 1}"><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(
                isNum ? String(val) : String(val)
              )}</Data></Cell>`
            })
            .join('')
          return `<Row ss:Index="${ri + 1}">${cellsXml}</Row>`
        })
        .join('')
      return `<Worksheet ss:Name="${escapeXml(sheet.name)}"><Table>${rowsXml}</Table></Worksheet>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#F4EDE0" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Amount"><NumberFormat ss:Format="#,##0"/></Style>
 </Styles>
 ${sheetXml}
</Workbook>`
}

export function downloadXlsx(filename: string, sheets: SheetData[]) {
  const xml = buildSpreadsheetXml(sheets)
  const blob = new Blob(['\uFEFF' + xml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function xlsxFilename(prefix: string) {
  const iso = new Date().toISOString().slice(0, 10)
  return `${prefix}-${iso}.xls`
}
