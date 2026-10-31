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
      return parsedValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
