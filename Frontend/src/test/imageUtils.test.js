import {
  getImageUrl,
  handleImageError,
  handleSmallImageError,
} from '../util/imageUtils';
import { toBackendAssetUrl } from '../config/api';

describe('imageUtils', () => {
  test('getImageUrl returns safe defaults for missing and relative asset paths', () => {
    expect(getImageUrl()).toBe('/images/image-not-found.jpg');
    expect(getImageUrl('cover.png')).toBe(toBackendAssetUrl('cover.png', 'uploads'));
    expect(getImageUrl('/restaurant-images/cover.png')).toBe(
      toBackendAssetUrl('/restaurant-images/cover.png'),
    );
  });

  test('getImageUrl preserves already absolute URLs', () => {
    expect(getImageUrl('https://cdn.example.com/dish.png')).toBe(
      'https://cdn.example.com/dish.png',
    );
  });

  test('image error handlers swap in the expected fallback assets', () => {
    const imageTarget = { src: '/broken.png' };
    const thumbTarget = { src: '/broken-small.png' };

    handleImageError({ target: imageTarget });
    handleSmallImageError({ target: thumbTarget });

    expect(imageTarget.src).toBe('/images/image-not-found.jpg');
    expect(thumbTarget.src).toBe('/images/image-not-found-small.jpg');
  });
});
