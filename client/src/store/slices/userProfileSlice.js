import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentProfile: null, // Görüntülenen kullanıcı profili
  userPosts: [],
  userConfessions: [],
  followers: [],
  following: [],
  postsPagination: {
    currentPage: 1,
    hasMore: true,
    totalPages: 1
  },
  confessionsPagination: {
    currentPage: 1,
    hasMore: true,
    totalPages: 1
  },
  loading: false,
  isFollowing: false,
  followRequestPending: false
};

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setCurrentProfile: (state, action) => {
      state.currentProfile = action.payload;
    },

    setUserPosts: (state, action) => {
      state.userPosts = action.payload;
    },

    appendUserPosts: (state, action) => {
      const existingIds = new Set(state.userPosts.map(p => p._id));
      const newPosts = action.payload.filter(p => !existingIds.has(p._id));
      state.userPosts = [...state.userPosts, ...newPosts];
    },

    setUserConfessions: (state, action) => {
      state.userConfessions = action.payload;
    },

    appendUserConfessions: (state, action) => {
      const existingIds = new Set(state.userConfessions.map(c => c._id));
      const newConfessions = action.payload.filter(c => !existingIds.has(c._id));
      state.userConfessions = [...state.userConfessions, ...newConfessions];
    },

    setFollowers: (state, action) => {
      state.followers = action.payload;
    },

    setFollowing: (state, action) => {
      state.following = action.payload;
    },

    setPostsPagination: (state, action) => {
      state.postsPagination = action.payload;
    },

    setConfessionsPagination: (state, action) => {
      state.confessionsPagination = action.payload;
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setIsFollowing: (state, action) => {
      state.isFollowing = action.payload;
    },

    setFollowRequestPending: (state, action) => {
      state.followRequestPending = action.payload;
    },

    clearProfile: (state) => {
      state.currentProfile = null;
      state.userPosts = [];
      state.userConfessions = [];
      state.followers = [];
      state.following = [];
      state.postsPagination = initialState.postsPagination;
      state.confessionsPagination = initialState.confessionsPagination;
      state.isFollowing = false;
      state.followRequestPending = false;
    }
  }
});

export const {
  setCurrentProfile,
  setUserPosts,
  appendUserPosts,
  setUserConfessions,
  appendUserConfessions,
  setFollowers,
  setFollowing,
  setPostsPagination,
  setConfessionsPagination,
  setLoading,
  setIsFollowing,
  setFollowRequestPending,
  clearProfile
} = userProfileSlice.actions;

export default userProfileSlice.reducer;
