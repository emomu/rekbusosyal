import React, { useState, useEffect } from 'react';
import { Users, Megaphone, MapPin, MessageSquare, FileText, TrendingUp, Shield, X, Plus, Edit, Trash2, Package, User } from 'lucide-react';
import { API_URL } from '../config/api';
import Lottie from 'lottie-react';
import loaderAnimation from '../assets/loader.json';

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('users');
  const [users, setUsers] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [comments, setComments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [versionNotes, setVersionNotes] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  // User details dialog
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Pagination state
  const [commentsPage, setCommentsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const ITEMS_PER_PAGE = 20;

  // Initial loading state
  const [initialLoading, setInitialLoading] = useState(true);

  const token = localStorage.getItem('token');

  // Tüm verileri ilk yüklemede al
  useEffect(() => {
    const loadAllData = async () => {
      setInitialLoading(true);
      await Promise.all([
        loadUsers(),
        loadAdvertisements(),
        loadCampuses(),
        loadCommunities(),
        loadComments(),
        loadPosts(),
        loadVersionNotes()
      ]);
      setInitialLoading(false);
    };
    loadAllData();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadAdvertisements = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/advertisements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAdvertisements(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadCampuses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/campus`);
      if (res.ok) setCampuses(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadCommunities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/communities`);
      if (res.ok) setCommunities(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadComments = async (page = 1, append = false) => {
    try {
      setCommentsLoading(true);
      const res = await fetch(`${API_URL}/api/admin/comments?page=${page}&limit=${ITEMS_PER_PAGE}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setComments(prev => [...prev, ...data]);
        } else {
          setComments(data);
        }
        setHasMoreComments(data.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadPosts = async (page = 1, append = false) => {
    try {
      setPostsLoading(true);
      const res = await fetch(`${API_URL}/api/admin/posts?page=${page}&limit=${ITEMS_PER_PAGE}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setPosts(prev => [...prev, ...data]);
        } else {
          setPosts(data);
        }
        setHasMorePosts(data.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadVersionNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/version-notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setVersionNotes(await res.json());
    } catch (err) { console.error(err); }
  };

  // Kullanıcı rolü güncelle
  const updateUserRole = async (userId, newRole) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        loadUsers();
        alert('Rol güncellendi');
      }
    } catch (err) { console.error(err); }
  };

  // Kullanıcı doğrulama durumu değiştir
  const toggleUserVerification = async (userId, currentStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isVerified: !currentStatus })
      });
      if (res.ok) {
        loadUsers();
        alert(currentStatus ? 'Kullanıcı doğrulama pasif edildi' : 'Kullanıcı doğrulandı');
      }
    } catch (err) { console.error(err); }
  };

  // Kullanıcı detaylarını göster
  const showUserDetailsDialog = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  // Kullanıcı sil
  const deleteUser = async (userId) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadUsers();
        alert('Kullanıcı silindi');
      }
    } catch (err) { console.error(err); }
  };

  // Reklam sil
  const deleteAd = async (adId) => {
    if (!confirm('Bu reklamı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/advertisements/${adId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadAdvertisements();
        alert('Reklam silindi');
      }
    } catch (err) { console.error(err); }
  };

  // Kampüs sil
  const deleteCampus = async (campusId) => {
    if (!confirm('Bu kampüsü silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/campuses/${campusId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadCampuses();
        alert('Kampüs silindi');
      }
    } catch (err) { console.error(err); }
  };

  // Topluluk sil
  const deleteCommunity = async (communityId) => {
    if (!confirm('Bu topluluğu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/communities/${communityId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadCommunities();
        alert('Topluluk silindi');
      }
    } catch (err) { console.error(err); }
  };

  // Yorum sil
  const deleteComment = async (commentId) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCommentsPage(1);
        loadComments(1);
        alert('Yorum silindi');
      }
    } catch (err) { console.error(err); }
  };

  // Post sil
  const deletePost = async (postId) => {
    if (!confirm('Bu postu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPostsPage(1);
        loadPosts(1);
        alert('Post silindi');
      }
    } catch (err) { console.error(err); }
  };

  // Load more functions
  const loadMoreComments = () => {
    const nextPage = commentsPage + 1;
    setCommentsPage(nextPage);
    loadComments(nextPage, true);
  };

  const loadMorePosts = () => {
    const nextPage = postsPage + 1;
    setPostsPage(nextPage);
    loadPosts(nextPage, true);
  };

  // Version Notes CRUD
  const deleteVersionNote = async (id) => {
    if (!confirm('Bu sürüm notunu silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/version-notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadVersionNotes();
        alert('Sürüm notu silindi');
      }
    } catch (err) { console.error(err); }
  };

  // Modal aç
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setShowModal(true);
  };

  // Sol menü
  const AdminMenuItem = ({ id, icon: Icon, label, badge }) => (
    <div
      onClick={() => setActiveSection(id)}
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
        activeSection === id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      {badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          activeSection === id ? 'bg-white/20' : 'bg-gray-200'
        }`}>
          {badge}
        </span>
      )}
    </div>
  );

  // Show loading screen on initial load
  if (initialLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <Lottie animationData={loaderAnimation} loop={true} style={{ width: 150, height: 150, margin: '0 auto' }} />
          <p className="text-gray-600 mt-4 font-medium">Admin Panel Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sol Panel */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-8">
          <Shield size={28} className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
        </div>

        <nav className="space-y-2">
          <AdminMenuItem id="users" icon={Users} label="Kullanıcılar" badge={users.length} />
          <AdminMenuItem id="ads" icon={Megaphone} label="Reklamlar" badge={advertisements.length} />
          <AdminMenuItem id="campuses" icon={MapPin} label="Kampüsler" badge={campuses.length} />
          <AdminMenuItem id="communities" icon={Users} label="Topluluklar" badge={communities.length} />
          <AdminMenuItem id="moderation" icon={MessageSquare} label="Yorumlar" badge={comments.length} />
          <AdminMenuItem id="posts" icon={FileText} label="Postlar" badge={posts.length} />
          <AdminMenuItem id="versions" icon={Package} label="Sürüm Notları" badge={versionNotes.length} />
        </nav>
      </aside>

      {/* Ana İçerik */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeSection === 'users' && 'Kullanıcı Yönetimi'}
              {activeSection === 'ads' && 'Reklam Yönetimi'}
              {activeSection === 'campuses' && 'Kampüs Yönetimi'}
              {activeSection === 'communities' && 'Topluluk Yönetimi'}
              {activeSection === 'moderation' && 'Yorum Moderasyonu'}
              {activeSection === 'posts' && 'Post Moderasyonu'}
              {activeSection === 'versions' && 'Sürüm Notları Yönetimi'}
            </h2>
            {(activeSection === 'ads' || activeSection === 'campuses' || activeSection === 'communities') && (
              <button
                onClick={() => openModal(activeSection)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={18} />
                Yeni Ekle
              </button>
            )}
          </div>
        </header>

        <div className="p-6">
          {/* Kullanıcılar */}
          {activeSection === 'users' && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Kullanıcı</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Rol</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Durum</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Kayıt Tarihi</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50 transition">
                      <td
                        className="p-4 cursor-pointer"
                        onClick={() => showUserDetailsDialog(user)}
                      >
                        <div className="flex items-center gap-3">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User size={20} className="text-gray-600" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{user.username}</div>
                            <div className="text-xs text-gray-500">{user.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{user.email}</td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user._id, e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-100 outline-none"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="club_manager">Kulüp Yöneticisi</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleUserVerification(user._id, user.isVerified)}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                            user.isVerified
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {user.isVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                        </button>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reklamlar */}
          {activeSection === 'ads' && (
            <div className="grid gap-4">
              {advertisements.map(ad => (
                <div key={ad._id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{ad.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          ad.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {ad.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          {ad.placement}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{ad.content}</p>
                      {ad.tags && ad.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {ad.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <TrendingUp size={14} />
                          <span>{ad.impressions} gösterim</span>
                        </div>
                        <div>
                          <span>{ad.clicks} tıklama</span>
                        </div>
                        {ad.priority && (
                          <div className="text-orange-600 font-medium">
                            Öncelik: {ad.priority}
                          </div>
                        )}
                        {ad.targetUrl && (
                          <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Link →
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal('ads', ad)}
                        className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteAd(ad._id)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Kampüsler */}
          {activeSection === 'campuses' && (
            <div className="grid gap-4 md:grid-cols-2">
              {campuses.map(campus => (
                <div key={campus._id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{campus.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {(campus.votes?.positive || 0) + (campus.votes?.neutral || 0) + (campus.votes?.negative || 0)} oy
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal('campuses', campus)}
                        className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteCampus(campus._id)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-green-600">👍 {campus.votes?.positive || 0}</span>
                    <span className="text-blue-600">😐 {campus.votes?.neutral || 0}</span>
                    <span className="text-red-600">👎 {campus.votes?.negative || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Topluluklar */}
          {activeSection === 'communities' && (
            <div className="grid gap-4 md:grid-cols-2">
              {communities.map(community => (
                <div key={community._id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{community.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{community.description}</p>
                      <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {community.category}
                      </span>
                      <div className="text-xs text-gray-500 mt-2">
                        {community.members?.length || 0} üye
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal('communities', community)}
                        className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteCommunity(community._id)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Yorumlar */}
          {activeSection === 'moderation' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-200">
                {comments.map(comment => (
                  <div key={comment._id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {comment.author?.profilePicture ? (
                            <img
                              src={comment.author.profilePicture}
                              alt={comment.author.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <User size={16} className="text-gray-600" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-900">{comment.author?.username}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {comment.campusId?.name}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteComment(comment._id)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading Animation */}
              {commentsLoading && (
                <div className="flex justify-center py-8">
                  <Lottie animationData={loaderAnimation} loop={true} style={{ width: 80, height: 80 }} />
                </div>
              )}

              {/* Load More Button */}
              {!commentsLoading && hasMoreComments && comments.length > 0 && (
                <button
                  onClick={loadMoreComments}
                  className="w-full bg-white text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-50 transition font-medium border border-blue-200"
                >
                  Daha Fazla Yükle
                </button>
              )}
            </div>
          )}

          {/* Postlar */}
          {activeSection === 'posts' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-200">
                {posts.map(post => (
                  <div key={post._id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {post.author?.profilePicture ? (
                            <img
                              src={post.author.profilePicture}
                              alt={post.author.username}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <User size={16} className="text-gray-600" />
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-900">{post.author?.username}</span>
                            {post.isAnonymous && (
                              <span className="text-xs text-gray-500 ml-2">(Anonim)</span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {new Date(post.createdAt).toLocaleDateString('tr-TR')} · {post.likes?.length || 0} beğeni
                        </div>
                      </div>
                      <button
                        onClick={() => deletePost(post._id)}
                        className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading Animation */}
              {postsLoading && (
                <div className="flex justify-center py-8">
                  <Lottie animationData={loaderAnimation} loop={true} style={{ width: 80, height: 80 }} />
                </div>
              )}

              {/* Load More Button */}
              {!postsLoading && hasMorePosts && posts.length > 0 && (
                <button
                  onClick={loadMorePosts}
                  className="w-full bg-white text-blue-600 px-4 py-3 rounded-lg hover:bg-blue-50 transition font-medium border border-blue-200"
                >
                  Daha Fazla Yükle
                </button>
              )}
            </div>
          )}

          {/* Sürüm Notları */}
          {activeSection === 'versions' && (
            <div className="space-y-4">
              <button
                onClick={() => openModal('versions')}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={18} />
                Yeni Sürüm Notu Ekle
              </button>

              <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-200">
                {versionNotes.map(note => (
                  <div key={note._id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl font-bold text-blue-600">v{note.version}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${note.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                            {note.isPublished ? 'Yayında' : 'Taslak'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{note.title}</h3>
                        {note.description && (
                          <p className="text-sm text-gray-600 mb-2">{note.description}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(note.releaseDate).toLocaleDateString('tr-TR')}
                          {note.createdBy && ` · ${note.createdBy.username}`}
                        </div>
                        {note.features && note.features.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            {note.features.length} özellik, {note.improvements?.length || 0} iyileştirme, {note.bugFixes?.length || 0} hata düzeltmesi
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal('versions', note)}
                          className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteVersionNote(note._id)}
                          className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal (Reklam/Kampüs/Topluluk Ekleme/Düzenleme) */}
      {showModal && (
        <CreateEditModal
          type={modalType}
          item={editingItem}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingItem(null);
            if (modalType === 'ads') loadAdvertisements();
            else if (modalType === 'campuses') loadCampuses();
            else if (modalType === 'communities') loadCommunities();
          }}
          token={token}
        />
      )}

      {/* User Details Dialog */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Kullanıcı Detayları</h3>
              <button
                onClick={() => setShowUserDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Profile Picture */}
              <div className="flex justify-center mb-4">
                {selectedUser.profilePicture ? (
                  <img
                    src={selectedUser.profilePicture}
                    alt={selectedUser.username}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center border-4 border-gray-200">
                    <User size={40} className="text-gray-600" />
                  </div>
                )}
              </div>

              {/* User Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Kullanıcı Adı</label>
                  <p className="text-base font-semibold text-gray-900">{selectedUser.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Tam İsim</label>
                  <p className="text-base font-semibold text-gray-900">{selectedUser.fullName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-base text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Rol</label>
                  <p className="text-base text-gray-900 capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Doğrulama Durumu</label>
                  <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                    selectedUser.isVerified
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedUser.isVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Kayıt Tarihi</label>
                  <p className="text-base text-gray-900">
                    {new Date(selectedUser.createdAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {selectedUser.birthDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Doğum Tarihi</label>
                    <p className="text-base text-gray-900">
                      {new Date(selectedUser.birthDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Hesap Gizliliği</label>
                  <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                    selectedUser.isPrivate
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedUser.isPrivate ? 'Gizli' : 'Açık'}
                  </span>
                </div>
              </div>

              {/* Bio */}
              {selectedUser.bio && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Biyografi</label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedUser.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedUser.followers?.length || 0}</p>
                  <p className="text-xs text-gray-500">Takipçi</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedUser.following?.length || 0}</p>
                  <p className="text-xs text-gray-500">Takip</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{selectedUser.interests?.length || 0}</p>
                  <p className="text-xs text-gray-500">İlgi Alanı</p>
                </div>
              </div>

              {/* Interests */}
              {selectedUser.interests && selectedUser.interests.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">İlgi Alanları</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full"
                      >
                        #{interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowUserDetails(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal Bileşeni
function CreateEditModal({ type, item, onClose, onSuccess, token }) {
  const [formData, setFormData] = useState(() => {
    if (item) {
      // Düzenleme modu için text fieldları ekle
      if (type === 'versions') {
        return {
          ...item,
          featuresText: item.features?.join('\n') || '',
          improvementsText: item.improvements?.join('\n') || '',
          bugFixesText: item.bugFixes?.join('\n') || ''
        };
      }
      return item;
    }
    // Yeni reklam için default değerler
    if (type === 'ads') {
      return { placement: 'feed', isActive: true };
    }
    return {};
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // API endpoint için doğru type adı
    let apiType = type === 'ads' ? 'advertisements' : type;
    if (type === 'versions') apiType = 'version-notes';

    const url = item
      ? `${API_URL}/api/admin/${apiType}/${item._id}`
      : `${API_URL}/api/admin/${apiType}`;

    const method = item ? 'PUT' : 'POST';

    // Version notes için text fieldları çıkar
    const dataToSend = { ...formData };
    if (type === 'versions') {
      delete dataToSend.featuresText;
      delete dataToSend.improvementsText;
      delete dataToSend.bugFixesText;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      if (res.ok) {
        alert(item ? 'Güncellendi!' : 'Oluşturuldu!');
        onSuccess();
      } else {
        alert('İşlem başarısız');
      }
    } catch (err) {
      console.error(err);
      alert('Bir hata oluştu');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {type === 'versions' && (item ? 'Sürüm Notu Düzenle' : 'Yeni Sürüm Notu')}
            {type !== 'versions' && (item ? 'Düzenle' : 'Yeni Ekle')}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {type === 'ads' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İçerik</label>
                <textarea
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profil Resmi URL</label>
                <input
                  type="url"
                  placeholder="Reklam veren logo/profil resmi"
                  value={formData.profileImageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, profileImageUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reklam Resmi URL</label>
                <input
                  type="url"
                  placeholder="Ana reklam görseli"
                  value={formData.imageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hedef URL</label>
                <input
                  type="url"
                  placeholder="Tıklanınca gidilecek link"
                  value={formData.targetUrl || ''}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gösterim Yeri</label>
                <select
                  value={formData.placement || 'feed'}
                  onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="feed">Ana Akış & İtiraflar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etiketler</label>
                <div className="flex flex-wrap gap-2">
                  {['kahve', 'yemek', 'egitim', 'eglence'].map(tag => (
                    <label key={tag} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.tags?.includes(tag) || false}
                        onChange={(e) => {
                          const currentTags = formData.tags || [];
                          if (e.target.checked) {
                            setFormData({ ...formData, tags: [...currentTags, tag] });
                          } else {
                            setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">#{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Öncelik (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Varsayılan: 1"
                    value={formData.priority || ''}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Yüksek öncelik = Daha fazla gösterim</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Gösterim</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Sınırsız"
                    value={formData.maxImpressions || ''}
                    onChange={(e) => setFormData({ ...formData, maxImpressions: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Süre (Dakika)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="Örn: 60 (1 saat), 1440 (1 gün)"
                  value={formData.durationMinutes || ''}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Reklamın kaç dakika gösterileceğini belirtin</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-700">Aktif</label>
              </div>
            </>
          )}

          {type === 'campuses' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kampüs Adı</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                />
              </div>
            </>
          )}

          {type === 'communities' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topluluk Adı</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                />
              </div>
            </>
          )}

          {type === 'versions' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sürüm Numarası*</label>
                  <input
                    type="text"
                    placeholder="1.0.0"
                    value={formData.version || ''}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yayın Tarihi</label>
                  <input
                    type="date"
                    value={formData.releaseDate ? new Date(formData.releaseDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlık*</label>
                <input
                  type="text"
                  placeholder="Yeni Özellikler ve İyileştirmeler"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  placeholder="Bu sürümle ilgili genel açıklama..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none min-h-20"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Özellikler (Her satır bir özellik)</label>
                <textarea
                  placeholder="Her satıra bir özellik yazın..."
                  value={formData.featuresText || (formData.features ? formData.features.join('\n') : '')}
                  onChange={(e) => setFormData({ ...formData, featuresText: e.target.value, features: e.target.value.split('\n').filter(f => f.trim()) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none min-h-24"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">İyileştirmeler (Her satır bir iyileştirme)</label>
                <textarea
                  placeholder="Her satıra bir iyileştirme yazın..."
                  value={formData.improvementsText || (formData.improvements ? formData.improvements.join('\n') : '')}
                  onChange={(e) => setFormData({ ...formData, improvementsText: e.target.value, improvements: e.target.value.split('\n').filter(i => i.trim()) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none min-h-24"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hata Düzeltmeleri (Her satır bir düzeltme)</label>
                <textarea
                  placeholder="Her satıra bir hata düzeltmesi yazın..."
                  value={formData.bugFixesText || (formData.bugFixes ? formData.bugFixes.join('\n') : '')}
                  onChange={(e) => setFormData({ ...formData, bugFixesText: e.target.value, bugFixes: e.target.value.split('\n').filter(b => b.trim()) })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-100 outline-none min-h-24"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished || false}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-100"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
                  Hemen yayınla (Kullanıcılar görebilir)
                </label>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {item ? 'Güncelle' : 'Oluştur'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
