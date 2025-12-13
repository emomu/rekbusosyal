import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  posts: [],
  confessions: [],
  loading: false,
  error: null,
  postsPagination: {
    currentPage: 1,
    hasMore: true,
    totalPages: 1
  },
  confessionsPagination: {
    currentPage: 1,
    hasMore: true,
    totalPages: 1
  }
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload;
      state.loading = false;
      state.error = null;
    },

    addPost: (state, action) => {
      state.posts.unshift(action.payload);
    },

    deletePost: (state, action) => {
      state.posts = state.posts.filter(post => post._id !== action.payload);
    },

    setConfessions: (state, action) => {
      state.confessions = action.payload;
      state.loading = false;
      state.error = null;
    },

    addConfession: (state, action) => {
      state.confessions.unshift(action.payload);
    },

    deleteConfession: (state, action) => {
      state.confessions = state.confessions.filter(conf => conf._id !== action.payload);
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },

    appendPosts: (state, action) => {
      // Sadece yeni (duplicate olmayan) postları ekle
      const existingIds = new Set(state.posts.map(p => p._id));
      const newPosts = action.payload.filter(p => !existingIds.has(p._id));
      state.posts = [...state.posts, ...newPosts];
    },

    appendConfessions: (state, action) => {
      // Sadece yeni (duplicate olmayan) itirafları ekle
      const existingIds = new Set(state.confessions.map(c => c._id));
      const newConfessions = action.payload.filter(c => !existingIds.has(c._id));
      state.confessions = [...state.confessions, ...newConfessions];
    },

    setPostsPagination: (state, action) => {
      state.postsPagination = action.payload;
    },

    setConfessionsPagination: (state, action) => {
      state.confessionsPagination = action.payload;
    }
  }
});

export const {
  setPosts,
  addPost,
  deletePost,
  setConfessions,
  addConfession,
  deleteConfession,
  setLoading,
  setError,
  appendPosts,
  appendConfessions,
  setPostsPagination,
  setConfessionsPagination
} = postsSlice.actions;

export default postsSlice.reducer;
