import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import RootErrorBoundary from '../components/RootErrorBoundary';
import ErrorPage from '../pages/ErrorPage';
import NotFoundPage from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import MaintenancePage from '../pages/MaintenancePage';
import SpotifyErrorPage from '../pages/SpotifyErrorPage';
import MaintenanceWrapper from '../components/MaintenanceWrapper';
import LoginPage from '../components/LoginPage';
import ResetPasswordPage from '../components/ResetPasswordPage';

// Lazy load page components for code splitting
const FeedPage = lazy(() => import('../pages/FeedPage'));
const ConfessionsPage = lazy(() => import('../pages/ConfessionsPage'));
const CampusesListPage = lazy(() => import('../pages/CampusesListPage'));
const CampusDetailPage = lazy(() => import('../pages/CampusDetailPage'));
const CommunitiesListPage = lazy(() => import('../pages/CommunitiesListPage'));
const CommunityDetailPage = lazy(() => import('../pages/CommunityDetailPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const PostDetailPage = lazy(() => import('../components/PostDetailPage'));
const CommentDetailPage = lazy(() => import('../components/CommentDetailPage'));
const PublicProfilePage = lazy(() => import('../components/PublicProfilePage'));
const AdminPanel = lazy(() => import('../components/AdminPanel'));
const VersionNotesPage = lazy(() => import('../components/VersionNotesPage'));

// Import loaders
import {
  feedLoader,
  confessionsLoader,
  campusesLoader,
  campusLoader,
  communitiesLoader,
  communityLoader,
  postLoader,
  commentLoader,
  profileLoader
} from './loaders';

/**
 * Application Routes Configuration
 * All routes are protected by authentication unless specified
 * RootErrorBoundary handles all errors at top level for full-page error display
 * MaintenanceWrapper checks maintenance mode for ALL routes
 */
const router = createBrowserRouter([
  {
    element: <MaintenanceWrapper />,
    errorElement: <RootErrorBoundary />,
    children: [
      {
        path: '/giris',
        element: <LoginPage />
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />
      },
      {
        path: '/sifre-sifirlama',
        element: <Navigate to="/reset-password" replace />
      },
      {
        path: '/admin',
        element: (
          <ProtectedRoute requiredRole={['admin', 'moderator']}>
            <AdminPanel />
          </ProtectedRoute>
        )
      },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
    children: [
      {
        index: true,
        element: <FeedPage />,
        loader: feedLoader
      },
      {
        path: 'itiraflar',
        element: <ConfessionsPage />,
        loader: confessionsLoader
      },
      {
        path: 'kampusler',
        element: <CampusesListPage />,
        loader: campusesLoader
      },
      {
        path: 'kampus/:campusId',
        element: <CampusDetailPage />,
        loader: campusLoader
      },
      {
        path: 'topluluklar',
        element: <CommunitiesListPage />,
        loader: communitiesLoader
      },
      {
        path: 'topluluk/:communityId',
        element: <CommunityDetailPage />,
        loader: communityLoader
      },
      {
        path: 'ayarlar',
        element: <SettingsPage />
      },
      {
        path: 'akis/:postId',
        element: <PostDetailPage />,
        loader: postLoader
      },
      {
        path: 'itiraf/:postId',
        element: <PostDetailPage />,
        loader: postLoader
      },
      {
        path: 'post/:postId',
        element: <PostDetailPage />,
        loader: postLoader
      },
      {
        path: 'gonderi/:postId',
        element: <PostDetailPage />,
        loader: postLoader
      },
      {
        path: 'yorum/:commentId',
        element: <CommentDetailPage />,
        loader: commentLoader
      },
      {
        path: 'kullanici/:username',
        element: <PublicProfilePage />,
        loader: profileLoader
      },
      {
        path: 'profil/:username',
        element: <PublicProfilePage />,
        loader: profileLoader
      },
      {
        path: 'surum-notlari',
        element: <VersionNotesPage />
      }
    ]
  },
      {
        path: '/hata',
        element: <ErrorPage />
      },
      {
        path: '/spotify-hata',
        element: <SpotifyErrorPage />
      },
      {
        path: '/yetkisiz',
        element: <UnauthorizedPage />
      },
      {
        path: '/bakim',
        element: <MaintenancePage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
], {
  future: {
    v7_skipActionErrorRevalidation: true,
    v7_partialHydration: true,
    v7_normalizeFormMethod: true,
    v7_fetcherPersist: true,
    v7_relativeSplatPath: true
  }
});

export default router;
