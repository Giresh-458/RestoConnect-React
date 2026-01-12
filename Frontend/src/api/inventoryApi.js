const API_BASE_URL = 'http://localhost:3000/api';

// Fetch all inventory items
export const fetchInventory = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/owner/inventory`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch inventory');
    }

    const data = await response.json();

    // Handle both response formats: array of objects or inventoryData object
    if (Array.isArray(data.inventory)) {
      // Already in the expected format
      return data.inventory;
    } else if (data.inventory && typeof data.inventory === 'object') {
      // Convert inventoryData object format to array of objects
      const inventoryData = data.inventory;
      const inventoryItems = [];

      if (inventoryData.labels && Array.isArray(inventoryData.labels)) {
        for (let i = 0; i < inventoryData.labels.length; i++) {
          inventoryItems.push({
            _id: `item_${i}`,
            name: inventoryData.labels[i],
            quantity: inventoryData.values?.[i] || 0,
            unit: inventoryData.units?.[i] || 'pieces',
            minStock: inventoryData.minStocks?.[i] || 0,
            supplier: inventoryData.suppliers?.[i] || ''
          });
        }
      }

      return inventoryItems;
    }

    return [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
};

// Update inventory item quantity
export const updateInventoryQuantity = async (itemId, change) => {
  try {
    const response = await fetch(`${API_BASE_URL}/owner/inventory/${itemId}/quantity`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ change }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update inventory quantity');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating inventory quantity:', error);
    throw error;
  }
};

// Create a new inventory item
export const createInventoryItem = async (itemData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/owner/inventory`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create inventory item');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
};

// Delete an inventory item
export const deleteInventoryItem = async (itemId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/owner/inventory/${itemId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete inventory item');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};
