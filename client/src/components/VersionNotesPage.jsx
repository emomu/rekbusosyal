import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ChevronLeft, Star, Bug, Zap, Calendar, PlusCircle } from 'lucide-react';
import { API_URL } from '../config/api';
import { setActiveTab } from '../store/slices/uiSlice';
import { useToast } from '../hooks/useToast';

export default function VersionNotesPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const { userRole, token } = useSelector(state => state.auth);
  const [versionNotes, setVersionNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newNote, setNewNote] = useState({
    version: '',
    title: '',
    content: ''
  });

  useEffect(() => {
    fetchVersionNotes();
  }, []);

  const fetchVersionNotes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/version-notes`);
      const data = await res.json();
      if (res.ok) {
        setVersionNotes(data);
      }
    } catch (err) {
      console.error('Sürüm notları yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewNote(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/version-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newNote)
      });
      if (res.ok) {
        toast.success('Sürüm notu başarıyla oluşturuldu!');
        setShowForm(false);
        setNewNote({ version: '', title: '', content: '' });
        fetchVersionNotes();
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Sürüm notu oluşturulamadı.');
      }
    } catch (err) {
      toast.error('Bir hata oluştu.');
      console.error('Sürüm notu oluşturma hatası:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/100 backdrop-blur-md border-b border-gray-200 px-4 h-[60px] flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={() => dispatch(setActiveTab('profil'))} className="p-1.5 hover:bg-gray-100 rounded-full transition mr-3">
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">Sürüm Notları</h1>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
            <PlusCircle size={16} />
            {showForm ? 'Formu Kapat' : 'Yeni Not Ekle'}
          </button>
        )}
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6">
        {/* New Note Form */}
        {showForm && userRole === 'admin' && (
          <div className="border border-blue-200 bg-blue-50 rounded-xl p-6 mb-8 animate-fade-in">
            <h2 className="text-xl font-bold text-blue-800 mb-4">Yeni Sürüm Notu Oluştur</h2>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label htmlFor="version" className="block text-sm font-medium text-gray-700 mb-1">Sürüm (örn: 1.2.3)</label>
                <input type="text" name="version" id="version" value={newNote.version} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
                <input type="text" name="title" id="title" value={newNote.title} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea name="content" id="content" value={newNote.content} onChange={handleInputChange} rows="4" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">Oluştur</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
          </div>
        ) : versionNotes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Henüz sürüm notu bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-8">
            {versionNotes.map((note) => (
              <div key={note._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                {/* Version Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-600 mb-1">
                      v{note.version}
                    </h2>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {note.title}
                    </h3>
                    {note.content && (
                      <p className="text-gray-600 text-sm mb-3">{note.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={14} />
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </div>

                {/* Features */}
                {note.features && note.features.length > 0 && (
                  <div className="mb-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                      <Star size={16} className="text-yellow-500" />
                      Yeni Özellikler
                    </h4>
                    <ul className="space-y-1.5 ml-6">
                      {note.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-700 list-disc">
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {note.improvements && note.improvements.length > 0 && (
                  <div className="mb-4">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                      <Zap size={16} className="text-blue-500" />
                      İyileştirmeler
                    </h4>
                    <ul className="space-y-1.5 ml-6">
                      {note.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm text-gray-700 list-disc">
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bug Fixes */}
                {note.bugFixes && note.bugFixes.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                      <Bug size={16} className="text-red-500" />
                      Hata Düzeltmeleri
                    </h4>
                    <ul className="space-y-1.5 ml-6">
                      {note.bugFixes.map((bugFix, index) => (
                        <li key={index} className="text-sm text-gray-700 list-disc">
                          {bugFix}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
