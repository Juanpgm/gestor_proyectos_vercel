import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Provide reliable localStorage/sessionStorage in jsdom (some jsdom builds lack .clear)
const makeStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v) },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
}
vi.stubGlobal('localStorage', makeStorage())
vi.stubGlobal('sessionStorage', makeStorage())

// Suppress console.error noise from React error boundaries in tests
vi.spyOn(console, 'error').mockImplementation(() => {})


