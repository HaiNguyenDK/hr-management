/** Chuyển yyyy-mm-dd → dd/mm/yyyy */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}
