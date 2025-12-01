import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:8080/api/restaurants');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch restaurants');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch restaurants');
    }
  }
);

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState: {
    items: [],
    loading: false,
    error: null,
    selectedRestaurant: null
  },
  reducers: {
    setSelectedRestaurant: (state, action) => {
      state.selectedRestaurant = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load restaurants';
      });
  }
});

export const { setSelectedRestaurant, clearError } = restaurantSlice.actions;
export default restaurantSlice.reducer;
