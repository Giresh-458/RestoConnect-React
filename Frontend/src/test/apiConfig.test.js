import { API_BASE_URL, toApiUrl, toBackendAssetUrl } from '../config/api';

const expectedApiUrl = (path) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

describe('API config helpers', () => {
  test('normalizes relative API paths against the configured base URL', () => {
    expect(typeof API_BASE_URL).toBe('string');
    expect(toApiUrl('/api/customer/search')).toBe(expectedApiUrl('/api/customer/search'));
    expect(toApiUrl('graphql')).toBe(expectedApiUrl('/graphql'));
  });

  test('rewrites local backend absolute URLs to current-origin paths', () => {
    expect(toApiUrl('http://localhost:3000/graphql')).toBe(expectedApiUrl('/graphql'));
    expect(toApiUrl('http://127.0.0.1:3000/uploads/dish.png')).toBe(
      expectedApiUrl('/uploads/dish.png'),
    );
  });

  test('keeps external absolute URLs untouched and normalizes backend assets', () => {
    expect(toApiUrl('https://api.example.com/graphql')).toBe('https://api.example.com/graphql');
    expect(toBackendAssetUrl('dish.png')).toBe(expectedApiUrl('/uploads/dish.png'));
    expect(toBackendAssetUrl('/restaurant-images/cover.jpg')).toBe(
      expectedApiUrl('/restaurant-images/cover.jpg'),
    );
    expect(toBackendAssetUrl('/images/logo.png')).toBe('/images/logo.png');
  });
});
