import { createSlice } from '@reduxjs/toolkit';

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      hasMore: false
    },
    loading: false
  },
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    appendNotifications: (state, action) => {
      state.notifications = [...state.notifications, ...action.payload];
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    setPagination: (state, action) => {
      state.pagination = action.payload;
    },
    markAsRead: (state, action) => {
      const notification = state.notifications.find(n => n._id === action.payload);
      if (notification) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => n.isRead = true);
      state.unreadCount = 0;
    },
    deleteNotification: (state, action) => {
      const notification = state.notifications.find(n => n._id === action.payload);
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(n => n._id !== action.payload);
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const {
  setNotifications,
  appendNotifications,
  setUnreadCount,
  setPagination,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  incrementUnreadCount,
  setLoading
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
