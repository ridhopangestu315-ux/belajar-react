import { useEffect, useState } from 'react'

// Keep app data in React and LocalStorage so it survives refreshes.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const savedValue = localStorage.getItem(key)
      if (savedValue === null) return initialValue
      const parsedValue = JSON.parse(savedValue)
      if (Array.isArray(initialValue) && !Array.isArray(parsedValue)) return initialValue
      if (initialValue && typeof initialValue === 'object' && !Array.isArray(initialValue) && (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue))) return initialValue
      if (typeof initialValue === 'number' && (typeof parsedValue !== 'number' || !Number.isFinite(parsedValue))) return initialValue
      if (typeof initialValue === 'boolean' && typeof parsedValue !== 'boolean') return initialValue
      if (typeof initialValue === 'string' && typeof parsedValue !== 'string') return initialValue
      return parsedValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Storage can be disabled or full; keep the current session usable.
    }
  }, [key, value])

  return [value, setValue]
}
