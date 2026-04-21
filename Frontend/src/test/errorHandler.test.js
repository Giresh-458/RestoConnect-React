import {
  fetchWithErrorHandling,
  handleApiError,
  handleFetchError,
} from '../util/errorHandler';

describe('errorHandler utilities', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('handleFetchError redirects with a helpful fallback message', () => {
    const navigate = vi.fn();

    handleFetchError(navigate, new Error('Network down'), 'Could not load restaurants');

    expect(navigate).toHaveBeenCalledWith('/error', {
      state: { message: 'Could not load restaurants' },
    });
  });

  test('handleApiError maps 404, 500, and generic failures to the error page', () => {
    const navigate = vi.fn();

    handleApiError(navigate, { status: 404 }, 'Ignored');
    handleApiError(navigate, { status: 500 }, 'Ignored');
    handleApiError(navigate, { status: 401 }, 'Access denied');

    expect(navigate).toHaveBeenNthCalledWith(1, '/error', {
      state: { message: 'The resource you requested was not found.' },
    });
    expect(navigate).toHaveBeenNthCalledWith(2, '/error', {
      state: { message: 'Server error. Please try again later.' },
    });
    expect(navigate).toHaveBeenNthCalledWith(3, '/error', {
      state: { message: 'Access denied' },
    });
  });

  test('fetchWithErrorHandling returns parsed JSON for successful responses', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, count: 3 }),
    });

    await expect(
      fetchWithErrorHandling('/api/customer/search', {}, vi.fn()),
    ).resolves.toEqual({ ok: true, count: 3 });
  });

  test('fetchWithErrorHandling redirects once and rethrows the API error message', async () => {
    const navigate = vi.fn();

    fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ message: 'Inventory service unavailable' }),
    });

    await expect(
      fetchWithErrorHandling('/api/inventory', {}, navigate, 'Could not load inventory'),
    ).rejects.toThrow('Inventory service unavailable');

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/error', {
      state: { message: 'Server error. Please try again later.' },
    });
  });
});
