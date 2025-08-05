import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosConfig';

const initialState = {
  inventory: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get household inventory
export const getInventory = createAsyncThunk(
  'inventory/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/api/inventory');
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add item to inventory
export const addInventoryItem = createAsyncThunk(
  'inventory/add',
  async (itemData, thunkAPI) => {
    try {
      const response = await axiosInstance.post('/api/inventory', itemData);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update inventory item
export const updateInventoryItem = createAsyncThunk(
  'inventory/update',
  async ({ id, itemData }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/api/inventory/${id}`, itemData);
      return response.data;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete inventory item
export const deleteInventoryItem = createAsyncThunk(
  'inventory/delete',
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/api/inventory/${id}`);
      return id;
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getInventory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inventory = action.payload;
      })
      .addCase(getInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(addInventoryItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addInventoryItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inventory.push(action.payload);
      })
      .addCase(addInventoryItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateInventoryItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateInventoryItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inventory = state.inventory.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
      })
      .addCase(updateInventoryItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteInventoryItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteInventoryItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.inventory = state.inventory.filter(
          (item) => item._id !== action.payload
        );
      })
      .addCase(deleteInventoryItem.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = inventorySlice.actions;
export default inventorySlice.reducer;