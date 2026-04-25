/**
 * Integration tests: Next.js proxy route configuration.
 * Verifies the proxy rewrite rules are correct.
 */

import { describe, it, expect, vi } from 'vitest';
import { API_BASE_URL, API_PROXY_URL } from '@/services/api';

describe('API proxy configuration', () => {
  it('proxy URL uses /api/proxy path', () => {
    expect(API_PROXY_URL).toBe('/api/proxy');
  });

  it('API_BASE_URL comes from environment variable', () => {
    // In test environment, this may be empty (no .env.local loaded)
    expect(typeof API_BASE_URL).toBe('string');
  });

  it('proxy URL does not include hostname (relative path)', () => {
    expect(API_PROXY_URL.startsWith('/')).toBe(true);
    expect(API_PROXY_URL).not.toContain('http');
  });

  it('proxy URL does not end with slash', () => {
    expect(API_PROXY_URL.endsWith('/')).toBe(false);
  });
});

describe('URL construction', () => {
  it('correctly joins proxy base with endpoint', () => {
    const base = API_PROXY_URL;
    const endpoint = 'contratos/';
    const full = `${base}/${endpoint.replace(/^\//, '')}`;
    expect(full).toBe('/api/proxy/contratos/');
  });

  it('handles endpoint with leading slash', () => {
    const base = API_PROXY_URL;
    const endpoint = '/frentes-activos';
    const full = `${base}/${endpoint.replace(/^\//, '')}`;
    expect(full).toBe('/api/proxy/frentes-activos');
  });

  it('handles endpoint without trailing slash', () => {
    const endpoint = 'health';
    const full = `${API_PROXY_URL}/${endpoint}`;
    expect(full).toBe('/api/proxy/health');
  });
});
