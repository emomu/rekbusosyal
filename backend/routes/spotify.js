const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Spotify'a yönlendir
router.get('/auth', authMiddleware, (req, res) => {
  const scope = 'user-read-currently-playing user-read-playback-state';
  const state = req.userId; // User ID'yi state olarak kullanıyoruz

  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${SPOTIFY_CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${state}`;

  res.json({ authUrl });
});

// Şarkı arama endpoint'i (Client Credentials kullanarak - kullanıcı bağımsız)
router.get('/search', authMiddleware, async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Arama terimi gerekli' });
  }

  try {
    // Client Credentials token al (kullanıcı bağımsız)
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Şarkı ara (market parametresi kaldırıldı - daha fazla preview için)
    const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: q,
        type: 'track',
        limit: 10
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const tracks = searchResponse.data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images[0]?.url,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      duration: track.duration_ms
    }));

    res.json({ tracks });
  } catch (error) {
    console.error('Spotify search error:', error.response?.data || error.message);
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
    const tokenResponse = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Spotify kullanıcı bilgilerini al
    const userResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    const spotifyId = userResponse.data.id;

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
    console.error('Spotify callback error:', error.response?.data || error.message);

    // Redirect URI hatası kontrolü
    if (error.response?.data?.error === 'invalid_grant' ||
        error.response?.data?.error_description?.includes('redirect_uri')) {
      return res.redirect(`${process.env.CLIENT_URL}/spotify-hata`);
    }

    res.redirect(`${process.env.CLIENT_URL}/ayarlar?spotify=error`);
  }
});

// Spotify bağlantısını kaldır
router.post('/disconnect', authMiddleware, async (req, res) => {
  try {
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
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
        }
      }
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in
    };
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
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
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.status === 204 || !response.data || !response.data.is_playing) {
      return res.json({ isPlaying: false });
    }

    const track = response.data.item;

    res.json({
      isPlaying: true,
      track: {
        name: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        albumArt: track.album.images[0]?.url,
        url: track.external_urls.spotify,
        duration: track.duration_ms,
        progress: response.data.progress_ms
      }
    });
  } catch (error) {
    if (error.response?.status === 401) {
      // Unauthorized, token geçersiz
      return res.json({ isPlaying: false });
    }
    console.error('Currently playing error:', error.response?.data || error.message);
    res.json({ isPlaying: false });
  }
});

module.exports = router;
