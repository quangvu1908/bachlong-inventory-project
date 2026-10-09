/**
 * Chuyển một giá trị ô (số sẵn có từ Excel, hoặc chuỗi từ CSV) thành number,
 * theo quy ước định dạng số Việt Nam: dấu chấm = phân tách nghìn, dấu phẩy = thập phân.
 * Trả về null nếu không parse được.
 */
export function parseVnNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null
  if (raw == null) return null
  const s = String(raw).trim()
  if (!s) return null
  const cleaned = s.replace(/[^\d.,-]/g, '')
  if (!cleaned) return null

  let normalized: string
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Cả 2 dấu: chấm là phân tách nghìn, phẩy là thập phân (quy ước VN)
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (cleaned.includes(',')) {
    // Chỉ có phẩy: coi là dấu thập phân
    normalized = cleaned.replace(',', '.')
  } else {
    normalized = cleaned
  }
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}
