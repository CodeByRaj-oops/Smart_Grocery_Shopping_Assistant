import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import groceryListsReducer from './slices/groceryListsSlice';
import inventoryReducer from './slices/inventorySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    groceryLists: groceryListsReducer,
    inventory: inventoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;