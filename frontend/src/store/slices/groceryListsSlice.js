import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  groceryLists: [],
  currentList: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Get user's grocery lists
export const getGroceryLists = createAsyncThunk(
  'groceryLists/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get('/api/grocery-lists', config);
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

// Get a single grocery list
export const getGroceryList = createAsyncThunk(
  'groceryLists/getOne',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(`/api/grocery-lists/${id}`, config);
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

// Create a new grocery list
export const createGroceryList = createAsyncThunk(
  'groceryLists/create',
  async (listData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.post('/api/grocery-lists', listData, config);
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

// Update a grocery list
export const updateGroceryList = createAsyncThunk(
  'groceryLists/update',
  async ({ id, listData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(`/api/grocery-lists/${id}`, listData, config);
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

// Delete a grocery list
export const deleteGroceryList = createAsyncThunk(
  'groceryLists/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.delete(`/api/grocery-lists/${id}`, config);
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

export const groceryListsSlice = createSlice({
  name: 'groceryLists',
  initialState,
  reducers: {
    reset: (state) => initialState,
    clearCurrentList: (state) => {
      state.currentList = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getGroceryLists.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGroceryLists.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.groceryLists = action.payload;
      })
      .addCase(getGroceryLists.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getGroceryList.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGroceryList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentList = action.payload;
      })
      .addCase(getGroceryList.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(createGroceryList.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createGroceryList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.groceryLists.push(action.payload);
      })
      .addCase(createGroceryList.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateGroceryList.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateGroceryList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.groceryLists = state.groceryLists.map((list) =>
          list._id === action.payload._id ? action.payload : list
        );
        if (state.currentList && state.currentList._id === action.payload._id) {
          state.currentList = action.payload;
        }
      })
      .addCase(updateGroceryList.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteGroceryList.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteGroceryList.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.groceryLists = state.groceryLists.filter(
          (list) => list._id !== action.payload
        );
        if (state.currentList && state.currentList._id === action.payload) {
          state.currentList = null;
        }
      })
      .addCase(deleteGroceryList.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearCurrentList } = groceryListsSlice.actions;
export default groceryListsSlice.reducer;