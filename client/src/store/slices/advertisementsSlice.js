import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  advertisements: [],
  loading: false,
  error: null
};

const advertisementsSlice = createSlice({
  name: 'advertisements',
  initialState,
  reducers: {
    setAdvertisements: (state, action) => {
      state.advertisements = action.payload;
      state.loading = false;
      state.error = null;
    },

    addAdvertisement: (state, action) => {
      state.advertisements.push(action.payload);
    },

    updateAdvertisement: (state, action) => {
      const index = state.advertisements.findIndex(ad => ad._id === action.payload._id);
      if (index !== -1) {
        state.advertisements[index] = action.payload;
      }
    },

    deleteAdvertisement: (state, action) => {
      state.advertisements = state.advertisements.filter(ad => ad._id !== action.payload);
    },

    incrementAdImpression: (state, action) => {
      const ad = state.advertisements.find(ad => ad._id === action.payload);
      if (ad) {
        ad.impressions = (ad.impressions || 0) + 1;
      }
    },

    incrementAdClick: (state, action) => {
      const ad = state.advertisements.find(ad => ad._id === action.payload);
      if (ad) {
        ad.clicks = (ad.clicks || 0) + 1;
      }
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const {
  setAdvertisements,
  addAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  incrementAdImpression,
  incrementAdClick,
  setLoading,
  setError
} = advertisementsSlice.actions;

export default advertisementsSlice.reducer;
