import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  campuses: [],
  selectedCampus: null,
  campusComments: [],
  loading: false,
  error: null
};

const campusesSlice = createSlice({
  name: 'campuses',
  initialState,
  reducers: {
    setCampuses: (state, action) => {
      state.campuses = action.payload;
      state.loading = false;
      state.error = null;
    },

    setSelectedCampus: (state, action) => {
      state.selectedCampus = action.payload;
    },

    setCampusComments: (state, action) => {
      state.campusComments = action.payload;
    },

    addCampusComment: (state, action) => {
      state.campusComments.push(action.payload);
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

    updateCampusVote: (state, action) => {
      const { campusId, counts } = action.payload;
      const campusIndex = state.campuses.findIndex(c => c._id === campusId);
      if (campusIndex !== -1) {
        state.campuses[campusIndex].votes = counts.votes;
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
  setCampuses,
  setSelectedCampus,
  setCampusComments,
  addCampusComment,
  updateCampusComment,
  deleteCampusComment,
  updateCampusVote,
  setLoading,
  setError
} = campusesSlice.actions;

export default campusesSlice.reducer;
