import {
  addToFavourites,
  getFavourites,
  removeFromFavourites,
} from '../util/favourites';

describe('favourites API helpers', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('getFavourites supports both array and wrapped response formats', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ id: 'dish-1' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true, favourites: [{ id: 'dish-2' }] }),
      });

    await expect(getFavourites()).resolves.toEqual([{ id: 'dish-1' }]);
    await expect(getFavourites()).resolves.toEqual([{ id: 'dish-2' }]);
  });

  test('addToFavourites and removeFromFavourites send the expected payloads', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

    await expect(addToFavourites('dish-7')).resolves.toEqual({ success: true });
    await expect(removeFromFavourites('dish-7')).resolves.toEqual({ success: true });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/customer/favourites/add',
      expect.objectContaining({
        body: JSON.stringify({ dishId: 'dish-7' }),
        credentials: 'include',
        method: 'POST',
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/customer/favourites/remove',
      expect.objectContaining({
        body: JSON.stringify({ dishId: 'dish-7' }),
        credentials: 'include',
        method: 'POST',
      }),
    );
  });

  test('getFavourites rejects API errors with the server message', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Login required' }),
    });

    await expect(getFavourites()).rejects.toThrow('Login required');
  });
});
