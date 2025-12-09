import React, { useState, useEffect } from 'react';
import { Users, Megaphone, MapPin, MessageSquare, FileText, TrendingUp, Shield, X, Plus, Edit, Trash2 } from 'lucide-react';
import { API_URL } from '../config/api';

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('users');
  const [users, setUsers] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [comments, setComments] = useState([]);
  const [posts, setPosts] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);

  const token = localStorage.getItem('token');

  // Veri yükleme
  useEffect(() => {
    if (activeSection === 'users') loadUsers();
    else if (activeSection === 'ads') loadAdvertisements();
    else if (activeSection === 'campuses') loadCampuses();
    else if (activeSection === 'communities') loadCommunities();
    else if (activeSection === 'moderation') loadComments();
    else if (activeSection === 'posts') loadPosts();
  }, [activeSection]);

  const loadUsers = async () => {
    try {
      const res = await fetch('${API_URL}/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadAdvertisements = async () => {
    try {
      const res = await fetch('${API_URL}/api/admin/advertisements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setAdvertisements(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadCampuses = async () => {
    try {
      const res = await fetch('${API_URL}/api/campus');
      if (res.ok) setCampuses(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadCommunities = async () => {
    try {
      const res = await fetch('${API_URL}/api/communities');
      if (res.ok) setCommunities(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadComments = async () => {
    try {
      const res = await fetch('${API_URL}/api/admin/comments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setComments(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadPosts = async () => {
    try {
      const res = await fetch('${API_URL}/api/admin/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setPosts(await res.json());
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
        loadComments();
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
        loadPosts();
        alert('Post silindi');
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
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Kayıt Tarihi</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePicture || 'https://via.placeholder.com/150'}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{user.username}</div>
                            <div className="text-xs text-gray-500">{user.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{user.email}</td>
                      <td className="p-4">
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
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="p-4">
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
            <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-200">
              {comments.map(comment => (
                <div key={comment._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={comment.author?.profilePicture || 'https://via.placeholder.com/150'}
                          alt={comment.author?.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
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
          )}

          {/* Postlar */}
          {activeSection === 'posts' && (
            <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-200">
              {posts.map(post => (
                <div key={post._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={post.author?.profilePicture || 'https://via.placeholder.com/150'}
                          alt={post.author?.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
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
    </div>
  );
}

// Modal Bileşeni
function CreateEditModal({ type, item, onClose, onSuccess, token }) {
  const [formData, setFormData] = useState(() => {
    if (item) return item;
    // Yeni reklam için default değerler
    if (type === 'ads') {
      return { placement: 'feed', isActive: true };
    }
    return {};
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // API endpoint için doğru type adı
    const apiType = type === 'ads' ? 'advertisements' : type;

    const url = item
      ? `${API_URL}/api/admin/${apiType}/${item._id}`
      : `${API_URL}/api/admin/${apiType}`;

    const method = item ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
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
            {item ? 'Düzenle' : 'Yeni Ekle'}
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
