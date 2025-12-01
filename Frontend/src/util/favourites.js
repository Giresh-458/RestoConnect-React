const API_BASE_URL = 'http://localhost:3000/api/customer';

export const addToFavourites = async (dishId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/favourites/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ dishId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add to favourites');
    }

    return data;
  } catch (error) {
    console.error('Error adding to favourites:', error);
    throw error;
  }
};

export const removeFromFavourites = async (dishId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/favourites/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ dishId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove from favourites');
    }

    return data;
  } catch (error) {
    console.error('Error removing from favourites:', error);
    throw error;
  }
};

export const getFavourites = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/favourites`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch favourites');
    }

    return data.favourites || [];
  } catch (error) {
    console.error('Error fetching favourites:', error);
    throw error;
  }
};
