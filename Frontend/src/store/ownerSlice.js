import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunks
export const fetchOwnerData = createAsyncThunk(
  "owner/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/owner/info", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch owner data");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch owner data");
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  "owner/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/owner/dashboard/stats", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to fetch dashboard stats");
    }
  }
);

const ownerSlice = createSlice({
  name: "owner",
  initialState: {
    loading: false,
    error: null,
    info: null,
    stats: null,
    menuItems: [],
    orders: [],
    reservations: [],
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Owner Data
    builder
      .addCase(fetchOwnerData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerData.fulfilled, (state, action) => {
        state.loading = false;
        state.info = action.payload;
      })
      .addCase(fetchOwnerData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default ownerSlice.reducer;
