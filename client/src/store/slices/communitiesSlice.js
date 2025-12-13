import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  communities: [],
  selectedCommunity: null,
  communityComments: [],
  loading: false,
  error: null
};

const communitiesSlice = createSlice({
  name: 'communities',
  initialState,
  reducers: {
    setCommunities: (state, action) => {
      state.communities = action.payload;
      state.loading = false;
      state.error = null;
    },

    setSelectedCommunity: (state, action) => {
      state.selectedCommunity = action.payload;
    },

    setCommunityComments: (state, action) => {
      state.communityComments = action.payload;
    },

    addCommunityComment: (state, action) => {
      state.communityComments.push(action.payload);
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

    updateCommunityVote: (state, action) => {
      const { communityId, counts } = action.payload;
      const communityIndex = state.communities.findIndex(c => c._id === communityId);
      if (communityIndex !== -1) {
        state.communities[communityIndex].votes = counts.votes;
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
  setCommunities,
  setSelectedCommunity,
  setCommunityComments,
  addCommunityComment,
  updateCommunityComment,
  deleteCommunityComment,
  updateCommunityVote,
  setLoading,
  setError
} = communitiesSlice.actions;

export default communitiesSlice.reducer;
