/**
 * Tests para verificar el comportamiento de la función openSecopLink
 */

import { openUrlSafely, openSecopLink, isValidUrl } from '@/utils/url-helpers'

// Mock de window.open y alert para testing
const mockWindowOpen = jest.fn()
const mockAlert = jest.fn()
const mockConsoleError = jest.fn()
const mockConsoleLog = jest.fn()

// @ts-ignore
global.window = {
  open: mockWindowOpen
}

// @ts-ignore
global.alert = mockAlert

// @ts-ignore
global.console = {
  log: mockConsoleLog,
  error: mockConsoleError
}

describe('URL Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isValidUrl', () => {
    test('should return true for valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=123')).toBe(true)
    })

    test('should return false for invalid URLs', () => {
      expect(isValidUrl('example.com')).toBe(false)
      expect(isValidUrl('ftp://example.com')).toBe(false)
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('  ')).toBe(false)
    })

    test('should handle null and undefined', () => {
      expect(isValidUrl(null as any)).toBe(false)
      expect(isValidUrl(undefined as any)).toBe(false)
    })
  })

  describe('openUrlSafely', () => {
    test('should open valid HTTP URLs', () => {
      const result = openUrlSafely('http://example.com')
      expect(result).toBe(true)
      expect(mockWindowOpen).toHaveBeenCalledWith('http://example.com', '_blank', 'noopener,noreferrer')
      expect(mockConsoleLog).toHaveBeenCalledWith('Navegando a:', 'http://example.com')
    })

    test('should open valid HTTPS URLs', () => {
      const result = openUrlSafely('https://example.com')
      expect(result).toBe(true)
      expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
    })

    test('should trim whitespace from URLs', () => {
      const result = openUrlSafely('  https://example.com  ')
      expect(result).toBe(true)
      expect(mockWindowOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer')
    })

    test('should reject invalid URLs and show alert', () => {
      const result = openUrlSafely('invalid-url')
      expect(result).toBe(false)
      expect(mockWindowOpen).not.toHaveBeenCalled()
      expect(mockAlert).toHaveBeenCalledWith('URL inválida: invalid-url')
      expect(mockConsoleError).toHaveBeenCalledWith('URL inválida:', 'invalid-url')
    })

    test('should reject empty URLs', () => {
      const result = openUrlSafely('')
      expect(result).toBe(false)
      expect(mockAlert).toHaveBeenCalledWith('URL no disponible')
    })

    test('should use custom error message', () => {
      const result = openUrlSafely('invalid-url', 'Custom error message')
      expect(result).toBe(false)
      expect(mockAlert).toHaveBeenCalledWith('Custom error message')
    })
  })

  describe('openSecopLink', () => {
    test('should open valid SECOP URLs', () => {
      const secopUrl = 'https://community.secop.gov.co/Public/Tendering/OpportunityDetail/Index?noticeUID=123'
      const result = openSecopLink(secopUrl)
      expect(result).toBe(true)
      expect(mockWindowOpen).toHaveBeenCalledWith(secopUrl, '_blank', 'noopener,noreferrer')
    })

    test('should show SECOP-specific error message for invalid URLs', () => {
      const result = openSecopLink('invalid-secop-url')
      expect(result).toBe(false)
      expect(mockAlert).toHaveBeenCalledWith('Error al abrir la URL del proceso en SECOP')
    })
  })
})
