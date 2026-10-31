export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addLocalDays(date, amount) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  result.setDate(result.getDate() + amount)
  return result
}

export function localDateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getRecentLocalDateKeys(endDate = new Date(), count = 7) {
  return Array.from({ length: count }, (_, index) => toLocalDateKey(addLocalDays(endDate, index - count + 1)))
}

export function daysBetweenLocalDateKeys(fromKey, toKey) {
  const from = fromKey.split('-').map(Number)
  const to = toKey.split('-').map(Number)
  return Math.round((Date.UTC(to[0], to[1] - 1, to[2]) - Date.UTC(from[0], from[1] - 1, from[2])) / 86400000)
}
