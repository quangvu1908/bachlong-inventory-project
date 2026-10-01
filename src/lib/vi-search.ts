/**
 * Normalize Vietnamese text by removing diacritics and lowercasing.
 * Lets users type "sua" to match "sữa", "tran" to match "trân", etc.
 *
 * Uses NFD decomposition then strips combining marks.
 */
export function normalizeVi(input: string): string {
  if (!input) return ''
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // combining diacritical marks
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
}

/** Returns true if `haystack` contains `needle` (diacritic-insensitive). */
export function matchVi(haystack: string, needle: string): boolean {
  if (!needle) return true
  return normalizeVi(haystack).includes(normalizeVi(needle))
}
