// redux/favoritesSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../services/firebaseConfig'; // adjust the path if needed
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';


type FavoriteState = {
  favorites: string[];
  loading: boolean;
};

const initialState: FavoriteState = {
  favorites: [],
  loading: false,
};

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (userId: string) => {
    const snapshot = await getDocs(collection(db, `users/${userId}/favorites`));
    return snapshot.docs.map((doc) => doc.id);
  }
);

export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async ({ userId, productId }: { userId: string; productId: string }, { getState }: any) => {
    const state = getState();
    const isFavorite = state.favorites.favorites.includes(productId);
    const ref = doc(db, `users/${userId}/favorites/${productId}`);

    if (isFavorite) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { addedAt: serverTimestamp() });
    }

    return productId;
  }
);
const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
        state.loading = false;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const productId = action.payload;
        if (state.favorites.includes(productId)) {
          state.favorites = state.favorites.filter((id) => id !== productId);
        } else {
          state.favorites.push(productId);
        }
      });
  },
});

export default favoritesSlice.reducer;
