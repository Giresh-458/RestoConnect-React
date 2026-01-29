/**
 * Constructs a proper image URL for dishes and restaurants
 * Handles both seed data (with direct paths) and uploaded images
 */
export function getImageUrl(imagePath) {
  if (!imagePath) {
    return "/images/default-dish.jpg";
  }

  // If it's already a full URL (http/https), return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If it starts with /, it's a public path - add server URL
  if (imagePath.startsWith("/")) {
    return `http://localhost:3000${imagePath}`;
  }

  // Otherwise it's a filename from uploads - construct the URL
  return `http://localhost:3000/uploads/${imagePath}`;
}

/**
 * Event handler for image load errors
 * Provides a fallback placeholder image
 */
export function handleImageError(e) {
  e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found";
}

/**
 * Event handler for thumbnail/small image errors
 */
export function handleSmallImageError(e) {
  e.target.src = "https://via.placeholder.com/60x60?text=Dish";
}
