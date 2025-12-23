const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Spotify embed sayfasından preview URL çekme fonksiyonu
async function fetchPreviewUrlFromEmbed(trackId) {
  try {
    const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    const response = await axios.get(embedUrl);
    const html = response.data;

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

    // Şarkı ara (market=US parametresi eklendi - daha fazla preview için)
    const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
      params: {
        q: q,
        type: 'track',
        limit: 20,
        market: 'TR' // ABD pazarı preview oranı daha yüksek
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Şarkıları map'le ve preview URL yoksa embed'den çek
    const tracks = await Promise.all(
      searchResponse.data.tracks.items.map(async (track) => {
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
