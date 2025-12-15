import { redirect } from 'react-router-dom';
import { API_URL } from '../config/api';
import { isValidObjectId, isValidUsername, sanitizeObject, sanitizeArray } from '../utils/security';
import store from '../store/store';

/**
 * Get auth token from Redux store
 */
function getToken() {
  const state = store.getState();
  return state.auth.token;
}

/**
 * Check if user is authenticated
 */
function requireAuth() {
  const state = store.getState();
  if (!state.auth.isAuthenticated) {
    throw redirect('/giris');
  }
  return state.auth.token;
}

/**
 * Post Detail Loader - Validates ID and fetches post data
 */
export async function postLoader({ params }) {
  const token = requireAuth();
  const { postId } = params;

  // Validate ObjectId format
  if (!isValidObjectId(postId)) {
    throw new Response('Geçersiz gönderi ID', { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/api/posts/${postId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Response('Gönderi bulunamadı', { status: 404 });
      }
      throw new Response('Gönderi yüklenemedi', { status: res.status });
    }

    const data = await res.json();

    // Sanitize content to prevent XSS
    return sanitizeObject(data, ['content']);
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response('Bağlantı hatası', { status: 500 });
  }
}

/**
 * Comment Detail Loader - Validates ID and fetches comment data
 */
export async function commentLoader({ params }) {
  const token = requireAuth();
  const { commentId } = params;

  // Validate ObjectId format
  if (!isValidObjectId(commentId)) {
    throw new Response('Geçersiz yorum ID', { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Response('Yorum bulunamadı', { status: 404 });
      }
      throw new Response('Yorum yüklenemedi', { status: res.status });
    }

    const data = await res.json();

    // Sanitize content
    return sanitizeObject(data, ['content']);
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response('Bağlantı hatası', { status: 500 });
  }
}

/**
 * Public Profile Loader - Validates username and fetches profile data
 */
export async function profileLoader({ params }) {
  const token = requireAuth();
  const { username } = params;

  // Validate username format
  if (!isValidUsername(username)) {
    throw new Response('Geçersiz kullanıcı adı', { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}/api/users/${username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Response('Kullanıcı bulunamadı', { status: 404 });
      }
      throw new Response('Profil yüklenemedi', { status: res.status });
    }

    const data = await res.json();

    // Sanitize bio and other user-generated content
    return sanitizeObject(data, ['bio']);
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response('Bağlantı hatası', { status: 500 });
  }
}

/**
 * Campus Detail Loader - Validates ID and fetches campus data
 * Returns null on error to allow component to handle loading state
 */
export async function campusLoader({ params }) {
  try {
    const token = requireAuth();
    const { campusId } = params;

    // Validate ObjectId format
    if (!isValidObjectId(campusId)) {
      console.error('Invalid campus ID format:', campusId);
      return null;
    }

    // Fetch campus details and comments in parallel
    const [campusRes, commentsRes] = await Promise.all([
      fetch(`${API_URL}/api/campus/${campusId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_URL}/api/campus/${campusId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    if (!campusRes.ok || !commentsRes.ok) {
      console.error('Campus fetch failed:', campusRes.status, commentsRes.status);
      return null;
    }

    const campus = await campusRes.json();
    const comments = await commentsRes.json();

    // Return combined data
    return {
      campus,
      comments: sanitizeArray(comments || [], ['content'])
    };
  } catch (error) {
    console.error('Campus loader error:', error);
    // Return null instead of throwing to let component handle error
    return null;
  }
}

/**
 * Community Detail Loader - Validates ID and fetches community data
 * Returns null on error to allow component to handle loading state
 */
export async function communityLoader({ params }) {
  try {
    const token = requireAuth();
    const { communityId } = params;

    // Validate ObjectId format
    if (!isValidObjectId(communityId)) {
      console.error('Invalid community ID format:', communityId);
      return null;
    }

    // Fetch community details and comments in parallel
    const [communityRes, commentsRes] = await Promise.all([
      fetch(`${API_URL}/api/communities/${communityId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API_URL}/api/community/${communityId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    if (!communityRes.ok || !commentsRes.ok) {
      console.error('Community fetch failed:', communityRes.status, commentsRes.status);
      return null;
    }

    const community = await communityRes.json();
    const comments = await commentsRes.json();

    // Return combined data
    return {
      community,
      comments: sanitizeArray(comments || [], ['content'])
    };
  } catch (error) {
    console.error('Community loader error:', error);
    // Return null instead of throwing to let component handle error
    return null;
  }
}

/**
 * Feed Loader - Fetches posts for home feed
 */
export async function feedLoader() {
  const token = requireAuth();

  try {
    const res = await fetch(`${API_URL}/api/posts?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Response('Gönderiler yüklenemedi', { status: res.status });
    }

    const data = await res.json();

    // Sanitize all posts
    return {
      ...data,
      posts: sanitizeArray(data.posts || [], ['content'])
    };
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response('Bağlantı hatası', { status: 500 });
  }
}

/**
 * Confessions Loader - Fetches confessions
 */
export async function confessionsLoader() {
  const token = requireAuth();

  try {
    const res = await fetch(`${API_URL}/api/confessions?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Response('İtiraflar yüklenemedi', { status: res.status });
    }

    const data = await res.json();

    // Backend returns { posts: [...], pagination: {...} }
    // Transform to match ConfessionsPage expectations
    return {
      confessions: sanitizeArray(data.posts || [], ['content']),
      currentPage: data.pagination?.currentPage || 1,
      totalPages: data.pagination?.totalPages || 1,
      hasMore: data.pagination?.hasMore || false
    };
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response('Bağlantı hatası', { status: 500 });
  }
}

/**
 * Campuses List Loader - Fetches all campuses
 */
export async function campusesLoader() {
  const token = requireAuth();

  try {
    const res = await fetch(`${API_URL}/api/campus`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Response('Kampüsler yüklenemedi', { status: res.status });
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response('Bağlantı hatası', { status: 500 });
  }
}

/**
 * Communities List Loader - Fetches all communities
 */
export async function communitiesLoader() {
  const token = requireAuth();

  try {
    const res = await fetch(`${API_URL}/api/communities`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Response('Topluluklar yüklenemedi', { status: res.status });
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response('Bağlantı hatası', { status: 500 });
  }
}
