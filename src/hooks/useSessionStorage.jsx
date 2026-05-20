import { useState, useCallback, useEffect } from 'react'

export default function useSessionStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(`geolabx-${key}`)
      return stored ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(`geolabx-${key}`, JSON.stringify(value))
    } catch {
      // Storage full or unavailable
    }
  }, [key, value])

  return [value, setValue]
}
