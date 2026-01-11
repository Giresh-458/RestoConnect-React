const API_BASE_URL = "http://localhost:3000/api/customer";

export const getFavourites = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/favourites`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.error || "Failed to fetch favorites");

    // Handle different response formats
    if (Array.isArray(data)) return data;
    if (data.success && data.favourites) return data.favourites;
    if (data.favourites) return data.favourites;
    if (data.favorites) return data.favorites;
    return [];
  } catch (error) {
    console.error("[Favorites] Error:", error.message);
    throw error;
  }
};

export const addToFavourites = async (dishId) => {
  try {
    console.log("[Favorites] Adding dish:", dishId);
    const response = await fetch(`${API_BASE_URL}/favourites/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ dishId }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.error || "Failed to add to favorites");

    console.log("[Favorites] Added successfully");
    return data;
  } catch (error) {
    console.error("[Favorites] Add error:", error.message);
    throw error;
  }
};

export const removeFromFavourites = async (dishId) => {
  try {
    console.log("[Favorites] Removing dish:", dishId);
    const response = await fetch(`${API_BASE_URL}/favourites/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ dishId }),
    });

    const data = await response.json();
    if (!response.ok)
      throw new Error(data?.error || "Failed to remove from favorites");

    console.log("[Favorites] Removed successfully");
    return data;
  } catch (error) {
    console.error("[Favorites] Remove error:", error.message);
    throw error;
  }
};
