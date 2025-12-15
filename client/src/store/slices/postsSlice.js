import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  posts: [],
  confessions: [],
  campusComments: [],
  communityComments: [],
  campusVotes: {},
  communityVotes: {},
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
    },

    setCampusComments: (state, action) => {
      state.campusComments = action.payload;
    },

    addCampusComment: (state, action) => {
      state.campusComments.unshift(action.payload);
    },

    updateCampusComment: (state, action) => {
      const index = state.campusComments.findIndex(c => c._id === action.payload._id);
      if (index !== -1) {
        state.campusComments[index] = action.payload;
      }
    },

    deleteCampusComment: (state, action) => {
      state.campusComments = state.campusComments.filter(c => c._id !== action.payload);
    },

    setCommunityComments: (state, action) => {
      state.communityComments = action.payload;
    },

    addCommunityComment: (state, action) => {
      state.communityComments.unshift(action.payload);
    },

    updateCommunityComment: (state, action) => {
      const index = state.communityComments.findIndex(c => c._id === action.payload._id);
      if (index !== -1) {
        state.communityComments[index] = action.payload;
      }
    },

    deleteCommunityComment: (state, action) => {
      state.communityComments = state.communityComments.filter(c => c._id !== action.payload);
    },

    updateCampusVote: (state, action) => {
      const { campusId, counts } = action.payload;
      state.campusVotes[campusId] = counts;
    },

    updateCommunityVote: (state, action) => {
      const { communityId, counts } = action.payload;
      state.communityVotes[communityId] = counts;
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
  setConfessionsPagination,
  setCampusComments,
  addCampusComment,
  updateCampusComment,
  deleteCampusComment,
  setCommunityComments,
  addCommunityComment,
  updateCommunityComment,
  deleteCommunityComment,
  updateCampusVote,
  updateCommunityVote
} = postsSlice.actions;

export default postsSlice.reducer;
