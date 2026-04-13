import { toBackendAssetUrl } from "../config/api";

/**
 * Constructs a proper image URL for dishes and restaurants
 * Handles both seed data (with direct paths) and uploaded images
 */
export function getImageUrl(imagePath) {
  if (!imagePath) {
    return "/images/image-not-found.jpg";
  }

  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Paths already rooted under /uploads, /profile-pictures, or /restaurant-images
  // need the backend origin when the frontend is deployed separately.
  if (imagePath.startsWith("/")) {
    return toBackendAssetUrl(imagePath);
  }

  // Otherwise it's a filename from uploads - construct the backend URL.
  return toBackendAssetUrl(imagePath, "uploads");
}

/**
 * Event handler for image load errors
 * Provides a fallback placeholder image
 */
export function handleImageError(e) {
  e.target.src = "/images/image-not-found.jpg";
}

/**
 * Event handler for thumbnail/small image errors
 */
export function handleSmallImageError(e) {
  e.target.src = "/images/image-not-found-small.jpg";
}
