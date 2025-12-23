const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// In-memory store for currently listening users
// Format: { trackId: [{ userId, username, fullName, profilePicture, startedAt }] }
const listeningUsers = new Map();

// Clean up old listening sessions every minute
setInterval(() => {
  const now = Date.now();
  const TIMEOUT = 60000; // 1 minute timeout

  for (const [trackId, users] of listeningUsers.entries()) {
    const activeUsers = users.filter(u => (now - u.startedAt) < TIMEOUT);
    if (activeUsers.length === 0) {
      listeningUsers.delete(trackId);
    } else {
      listeningUsers.set(trackId, activeUsers);
    }
  }
}, 60000);

// Spotify embed sayfasından preview URL çekme fonksiyonu
async function fetchPreviewUrlFromEmbed(trackId) {
  try {
    const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    const response = await fetch(embedUrl);
    const html = await response.text();

    // HTML'den script tag'lerini parse et
    const $ = cheerio.load(html);
    const scripts = $('script');

    for (let i = 0; i < scripts.length; i++) {
      const scriptContent = $(scripts[i]).html();
      if (scriptContent && scriptContent.includes('audioPreview')) {
        try {
          // JSON formatındaki script içeriğini parse et
          const jsonMatch = scriptContent.match(/(\{.*\})/s);
          if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[1]);
            // audioPreview değerini recursive olarak bul
            const audioPreview = findNodeValue(jsonData, 'audioPreview');
            if (audioPreview && audioPreview.url) {
              return audioPreview.url;
            }
          }
        } catch (e) {
          // JSON parse hatası, sonraki script'e geç
          continue;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Preview URL fetch error for track:', trackId, error.message);
    return null;
  }
}

// JSON objesinde recursive olarak node değerini bulma
function findNodeValue(obj, targetKey) {
  if (typeof obj !== 'object' || obj === null) return null;

  if (targetKey in obj) {
    return obj[targetKey];
  }

  for (const key in obj) {
    const result = findNodeValue(obj[key], targetKey);
    if (result !== null) return result;
  }

  return null;
}

// Spotify'a yönlendir (sadece beta kullanıcılar)
router.get('/auth', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Beta özelliği aktif değilse reddet
    if (!user?.betaFeatures?.spotifyIntegration) {
      return res.status(403).json({
        error: 'Spotify entegrasyonu beta özelliğidir. Erişim için yetkiniz bulunmamaktadır.'
      });
    }

    const scope = 'user-read-currently-playing user-read-playback-state';
    const state = req.userId; // User ID'yi state olarak kullanıyoruz

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${SPOTIFY_CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${state}` +
      `&show_dialog=true`; // Her seferinde hesap seçimi istenir

    res.json({ authUrl });
  } catch (error) {
    console.error('Spotify auth error:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// Şarkı arama endpoint'i (Client Credentials kullanarak - kullanıcı bağımsız)
router.get('/search', authMiddleware, async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Arama terimi gerekli' });
  }

  try {
    // Client Credentials token al (kullanıcı bağımsız)
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
      })
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Şarkı ara (market=TR parametresi ile)
    const searchUrl = `https://api.spotify.com/v1/search?` +
      `q=${encodeURIComponent(q)}&type=track&limit=20&market=TR`;

    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const searchData = await searchResponse.json();

    // Şarkıları map'le ve preview URL yoksa embed'den çek
    const tracks = await Promise.all(
      searchData.tracks.items.map(async (track) => {
        let previewUrl = track.preview_url;

        // API'dan preview URL gelmediyse, embed sayfasından çekmeyi dene
        if (!previewUrl) {
          previewUrl = await fetchPreviewUrlFromEmbed(track.id);
        }

        return {
          id: track.id,
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          album: track.album.name,
          albumArt: track.album.images[0]?.url,
          previewUrl: previewUrl,
          spotifyUrl: track.external_urls.spotify,
          duration: track.duration_ms
        };
      })
    );

    res.json({ tracks });
  } catch (error) {
    console.error('Spotify search error:', error.message);
    res.status(500).json({ error: 'Arama sırasında bir hata oluştu' });
  }
});

// Spotify callback
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const userId = state; // state'den user ID'yi alıyoruz

  // Spotify'dan gelen hata kontrolü (redirect_uri_mismatch gibi)
  if (error) {
    console.error('Spotify authorization error:', error);
    if (error === 'redirect_uri_mismatch') {
      return res.redirect(`${process.env.CLIENT_URL}/spotify-hata`);
    }
    return res.redirect(`${process.env.CLIENT_URL}/ayarlar?spotify=error`);
  }

  if (!code) {
    return res.redirect(`${process.env.CLIENT_URL}/ayarlar?spotify=error`);
  }

  try {
    // Access token al
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      })
    });

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Spotify kullanıcı bilgilerini al
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const userData = await userResponse.json();
    const spotifyId = userData.id;

    // User'ı güncelle
    await User.findByIdAndUpdate(userId, {
      spotify: {
        spotifyId,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: new Date(Date.now() + expires_in * 1000),
        isConnected: true
      }
    });

    res.redirect(`${process.env.CLIENT_URL}/ayarlar?spotify=success`);
  } catch (error) {
    console.error('Spotify callback error:', error.message);
    res.redirect(`${process.env.CLIENT_URL}/ayarlar?spotify=error`);
  }
});

// Spotify bağlantısını kaldır (sadece beta kullanıcılar)
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    // Beta özelliği aktif değilse reddet
    if (!user?.betaFeatures?.spotifyIntegration) {
      return res.status(403).json({
        error: 'Spotify entegrasyonu beta özelliğidir.'
      });
    }

    await User.findByIdAndUpdate(req.userId, {
      spotify: {
        spotifyId: null,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        isConnected: false
      }
    });

    res.json({ success: true, message: 'Spotify bağlantısı kaldırıldı' });
  } catch (error) {
    console.error('Spotify disconnect error:', error);
    res.status(500).json({ error: 'Bir hata oluştu' });
  }
});

// Access token yenile
async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      })
    });

    const data = await response.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in
    };
  } catch (error) {
    console.error('Token refresh error:', error.message);
    throw error;
  }
}

// Şu an dinlenen şarkıyı getir
router.get('/currently-playing/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user || !user.spotify?.isConnected) {
      return res.json({ isPlaying: false });
    }

    let accessToken = user.spotify.accessToken;

    // Token süresi dolmuşsa yenile
    if (new Date() >= user.spotify.tokenExpiresAt) {
      try {
        const newTokens = await refreshAccessToken(user.spotify.refreshToken);
        accessToken = newTokens.accessToken;

        // Yeni token'ı kaydet
        await User.findByIdAndUpdate(user._id, {
          'spotify.accessToken': accessToken,
          'spotify.tokenExpiresAt': new Date(Date.now() + newTokens.expiresIn * 1000)
        });
      } catch (error) {
        // Token yenileme başarısız, bağlantıyı kapat
        await User.findByIdAndUpdate(user._id, {
          'spotify.isConnected': false
        });
        return res.json({ isPlaying: false });
      }
    }

    // Şu an dinlenen şarkıyı al
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.status === 204 || !response.ok) {
      return res.json({ isPlaying: false });
    }

    const data = await response.json();

    if (!data || !data.is_playing) {
      return res.json({ isPlaying: false });
    }

    const track = data.item;
    const trackId = track.id;

    // Kullanıcıyı dinleme listesine ekle
    const userInfo = {
      userId: user._id.toString(),
      username: user.username,
      fullName: user.fullName,
      profilePicture: user.profilePicture,
      startedAt: Date.now()
    };

    // Bu şarkıyı dinleyenleri al veya yeni liste oluştur
    const currentListeners = listeningUsers.get(trackId) || [];

    // Bu kullanıcıyı listeden çıkar (varsa) ve yeniden ekle (güncelle)
    const filteredListeners = currentListeners.filter(l => l.userId !== userInfo.userId);
    filteredListeners.push(userInfo);

    listeningUsers.set(trackId, filteredListeners);

    // Aynı şarkıyı dinleyenleri döndür (kendisi hariç)
    const otherListeners = filteredListeners
      .filter(l => l.userId !== userInfo.userId)
      .map(l => ({
        username: l.username,
        fullName: l.fullName,
        profilePicture: l.profilePicture
      }));

    res.json({
      isPlaying: true,
      track: {
        id: trackId,
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        albumArt: track.album.images[0]?.url,
        url: track.external_urls.spotify,
        duration: track.duration_ms,
        progress: data.progress_ms
      },
      listeningAlong: otherListeners
    });
  } catch (error) {
    console.error('Currently playing error:', error.message);
    res.json({ isPlaying: false });
  }
});

module.exports = router;
