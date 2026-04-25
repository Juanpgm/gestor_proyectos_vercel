/**
 * Unit tests: ApiClient — retry logic, timeout, error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, RETRY_CONFIG, API_PROXY_URL } from '@/services/api';

// Mock firebase import used in token refresh
vi.mock('@/lib/firebase', () => ({
  getCurrentIdToken: vi.fn().mockResolvedValue(null),
  auth: {
    currentUser: null,
  },
}));

// Mock errorHandler
vi.mock('@/utils/errorHandler', () => ({
  fetchWithErrorHandling: vi.fn(),
}));

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient(API_PROXY_URL, 5000, { ...RETRY_CONFIG, maxRetries: 1 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates instance with default proxy URL', () => {
    const c = new ApiClient();
    expect(c).toBeTruthy();
  });

  it('builds correct URL for endpoint', async () => {
    const { fetchWithErrorHandling } = await import('@/utils/errorHandler');
    vi.mocked(fetchWithErrorHandling).mockResolvedValueOnce({ data: 'ok' });

    await client.request('contratos/');
    expect(vi.mocked(fetchWithErrorHandling)).toHaveBeenCalledWith(
      expect.stringContaining('contratos'),
      expect.any(Object),
      expect.any(Number)
    );
  });

  it('strips leading slash from endpoint', async () => {
    const { fetchWithErrorHandling } = await import('@/utils/errorHandler');
    vi.mocked(fetchWithErrorHandling).mockResolvedValueOnce({});

    await client.request('/endpoint');
    const calledUrl = vi.mocked(fetchWithErrorHandling).mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('//endpoint');
  });

  it('returns data on success', async () => {
    const { fetchWithErrorHandling } = await import('@/utils/errorHandler');
    const mockData = { contratos: [{ id: '1' }] };
    vi.mocked(fetchWithErrorHandling).mockResolvedValueOnce(mockData);

    const result = await client.request('contratos/');
    expect(result).toEqual(mockData);
  });

  it('throws after max retries exhausted', async () => {
    const { fetchWithErrorHandling } = await import('@/utils/errorHandler');
    const error = Object.assign(new Error('Network error'), { status: 500 });
    vi.mocked(fetchWithErrorHandling).mockRejectedValue(error);

    await expect(client.request('contratos/', {}, true)).rejects.toThrow();
  });

  it('does not retry on 404', async () => {
    const { fetchWithErrorHandling } = await import('@/utils/errorHandler');
    const error = Object.assign(new Error('Not found'), { status: 404 });
    vi.mocked(fetchWithErrorHandling).mockRejectedValue(error);

    await expect(client.request('missing/', {}, true)).rejects.toThrow();
    // Should only be called once (no retry on 404)
    expect(vi.mocked(fetchWithErrorHandling)).toHaveBeenCalledTimes(1);
  });
});

describe('RETRY_CONFIG', () => {
  it('has expected structure', () => {
    expect(RETRY_CONFIG).toHaveProperty('maxRetries');
    expect(RETRY_CONFIG).toHaveProperty('retryDelay');
    expect(RETRY_CONFIG).toHaveProperty('retryMultiplier');
    expect(RETRY_CONFIG.maxRetries).toBeGreaterThan(0);
  });
});
