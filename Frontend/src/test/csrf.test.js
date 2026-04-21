describe('CSRF helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('createHeaders flags state-changing requests only', async () => {
    const { createHeaders } = await import('../util/csrf');

    expect(createHeaders({ method: 'GET' })).toEqual({
      headers: { method: 'GET' },
      needsCsrf: false,
    });
    expect(createHeaders({ method: 'POST', 'Content-Type': 'application/json' })).toEqual({
      headers: {
        method: 'POST',
        'Content-Type': 'application/json',
      },
      needsCsrf: true,
    });
    expect(createHeaders({ method: 'DELETE', 'X-CSRF-Token': 'ready' })).toEqual({
      headers: {
        method: 'DELETE',
        'X-CSRF-Token': 'ready',
      },
      needsCsrf: false,
    });
  });

  test('fetchWithCSRF caches the token and attaches it to state-changing requests', async () => {
    const tokenResponse = { ok: true, json: vi.fn().mockResolvedValue({ csrfToken: 'csrf-123' }) };
    const firstMutationResponse = { ok: true, json: vi.fn().mockResolvedValue({ ok: true }) };
    const secondMutationResponse = { ok: true, json: vi.fn().mockResolvedValue({ ok: true }) };

    fetch
      .mockResolvedValueOnce(tokenResponse)
      .mockResolvedValueOnce(firstMutationResponse)
      .mockResolvedValueOnce(secondMutationResponse);

    const { fetchWithCSRF } = await import('../util/csrf');
    const { toApiUrl } = await import('../config/api');

    await fetchWithCSRF('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    await fetchWithCSRF('/api/orders/1', {
      method: 'DELETE',
    });

    expect(fetch).toHaveBeenNthCalledWith(1, toApiUrl('/api/csrf-token'), { credentials: 'include' });
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      toApiUrl('/api/orders'),
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'csrf-123',
        }),
        method: 'POST',
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      toApiUrl('/api/orders/1'),
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          'X-CSRF-Token': 'csrf-123',
        }),
        method: 'DELETE',
      }),
    );
  });

  test('getCsrfToken retries after a failed fetch', async () => {
    fetch
      .mockResolvedValueOnce({ ok: false, json: vi.fn() })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ csrfToken: 'retry-token' }),
      });

    const { getCsrfToken } = await import('../util/csrf');

    await expect(getCsrfToken()).rejects.toThrow('Failed to fetch CSRF token');
    await expect(getCsrfToken()).resolves.toBe('retry-token');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
