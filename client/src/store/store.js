import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import postsReducer from './slices/postsSlice';
import campusesReducer from './slices/campusesSlice';
import communitiesReducer from './slices/communitiesSlice';
import advertisementsReducer from './slices/advertisementsSlice';
import uiReducer from './slices/uiSlice';
import userProfileReducer from './slices/userProfileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postsReducer,
    campuses: campusesReducer,
    communities: communitiesReducer,
    advertisements: advertisementsReducer,
    ui: uiReducer,
    userProfile: userProfileReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['ui/setSelectedImage'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['ui.selectedImage']
      }
    })
});

export default store;
