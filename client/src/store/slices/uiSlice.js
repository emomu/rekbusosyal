import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeTab: 'akis',
  selectedImage: null,
  commentInput: '',
  communityCommentInput: '',
  newPostContent: '',
  newConfessionContent: '',
  isAnonymous: true,
  editingCommentId: null,
  editingContent: '',
  isInitialLoading: true,
  isLoadingPosts: false,
  isLoadingConfessions: false,
  isLoadingCampuses: false,
  isLoadingCommunities: false,
  isLoadingComments: false,
  toasts: []
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },

    setSelectedImage: (state, action) => {
      state.selectedImage = action.payload;
    },

    setCommentInput: (state, action) => {
      state.commentInput = action.payload;
    },

    setCommunityCommentInput: (state, action) => {
      state.communityCommentInput = action.payload;
    },

    setNewPostContent: (state, action) => {
      state.newPostContent = action.payload;
    },

    setNewConfessionContent: (state, action) => {
      state.newConfessionContent = action.payload;
    },

    setIsAnonymous: (state, action) => {
      state.isAnonymous = action.payload;
    },

    setEditingComment: (state, action) => {
      state.editingCommentId = action.payload.id;
      state.editingContent = action.payload.content;
    },

    clearEditingComment: (state) => {
      state.editingCommentId = null;
      state.editingContent = '';
    },

    resetInputs: (state) => {
      state.commentInput = '';
      state.communityCommentInput = '';
      state.newPostContent = '';
      state.newConfessionContent = '';
      state.editingCommentId = null;
      state.editingContent = '';
    },

    setInitialLoading: (state, action) => {
      state.isInitialLoading = action.payload;
    },

    setLoadingPosts: (state, action) => {
      state.isLoadingPosts = action.payload;
    },

    setLoadingConfessions: (state, action) => {
      state.isLoadingConfessions = action.payload;
    },

    setLoadingCampuses: (state, action) => {
      state.isLoadingCampuses = action.payload;
    },

    setLoadingCommunities: (state, action) => {
      state.isLoadingCommunities = action.payload;
    },

    setLoadingComments: (state, action) => {
      state.isLoadingComments = action.payload;
    },

    addToast: (state, action) => {
      const id = Date.now() + Math.random();
      state.toasts.push({
        id,
        message: action.payload.message,
        type: action.payload.type || 'info',
        duration: action.payload.duration || 3000
      });
    },

    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    }
  }
});

export const {
  setActiveTab,
  setSelectedImage,
  setCommentInput,
  setCommunityCommentInput,
  setNewPostContent,
  setNewConfessionContent,
  setIsAnonymous,
  setEditingComment,
  clearEditingComment,
  resetInputs,
  setInitialLoading,
  setLoadingPosts,
  setLoadingConfessions,
  setLoadingCampuses,
  setLoadingCommunities,
  setLoadingComments,
  addToast,
  removeToast
} = uiSlice.actions;

export default uiSlice.reducer;
