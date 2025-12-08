import { createSlice } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

const initialState = {
  token: localStorage.getItem('token') || null,
  userId: null,
  username: localStorage.getItem('username') || null,
  userRole: 'user',
  userInterests: JSON.parse(localStorage.getItem('userInterests') || '[]'),
  isAuthenticated: !!localStorage.getItem('token')
};

// Token varsa userId'yi decode et
if (initialState.token) {
  try {
    const decoded = jwtDecode(initialState.token);
    initialState.userId = decoded.id;
  } catch (error) {
    // Token geçersizse temizle
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userInterests');
    initialState.token = null;
    initialState.isAuthenticated = false;
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { token, username, interests } = action.payload;
      state.token = token;
      state.username = username;
      state.userInterests = interests || [];
      state.isAuthenticated = true;

      // Token'dan userId'yi decode et
      try {
        const decoded = jwtDecode(token);
        state.userId = decoded.id;
      } catch (error) {
        console.error('Token decode error:', error);
      }

      // LocalStorage'a kaydet
      localStorage.setItem('token', token);
      localStorage.setItem('username', username);
      localStorage.setItem('userInterests', JSON.stringify(interests || []));
    },

    setUserRole: (state, action) => {
      state.userRole = action.payload;
    },

    updateInterests: (state, action) => {
      state.userInterests = action.payload;
      localStorage.setItem('userInterests', JSON.stringify(action.payload));
    },

    addInterests: (state, action) => {
      // Yeni ilgi alanlarını ekle (duplicate kontrolü)
      const newInterests = [...new Set([...state.userInterests, ...action.payload])];
      state.userInterests = newInterests;
      localStorage.setItem('userInterests', JSON.stringify(newInterests));
    },

    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.username = null;
      state.userRole = 'user';
      state.userInterests = [];
      state.isAuthenticated = false;

      // LocalStorage'ı temizle
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('userInterests');
    }
  }
});

export const { setCredentials, setUserRole, updateInterests, addInterests, logout } = authSlice.actions;
export default authSlice.reducer;
