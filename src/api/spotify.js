/**
 * spotify.js — Spotify Web API клиент
 *
 * Настройка:
 * 1. Создай приложение на https://developer.spotify.com/dashboard
 * 2. Добавь Redirect URI: http://localhost:8080/callback (или твой домен)
 * 3. Вставь CLIENT_ID ниже
 * 4. Пользователь авторизуется через OAuth → получает access_token
 *
 * Пока токен не установлен — возвращаем моковые данные.
 */

import { MOCK_TRACKS, MOCK_ALBUMS, MOCK_PLAYLISTS } from './mock.js';

// ─── КОНФИГУРАЦИЯ ───────────────────────────────────────────────────────────
const CONFIG = {
  CLIENT_ID: 'YOUR_SPOTIFY_CLIENT_ID',      // ← Вставь свой Client ID
  REDIRECT_URI: window.location.origin + '/callback',
  SCOPES: [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'user-library-modify',
    'playlist-read-private',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming',
  ].join(' '),
  BASE_URL: 'https://api.spotify.com/v1',
};

// ─── TOKEN MANAGEMENT ────────────────────────────────────────────────────────
function getToken() {
  // Проверяем URL hash (после redirect от Spotify)
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    const expiresIn = params.get('expires_in');
    if (token) {
      const expiresAt = Date.now() + parseInt(expiresIn, 10) * 1000;
      localStorage.setItem('spotify_token', token);
      localStorage.setItem('spotify_expires_at', expiresAt);
      window.history.replaceState(null, '', window.location.pathname);
      return token;
    }
  }
  // Берём из localStorage если не истёк
  const token = localStorage.getItem('spotify_token');
  const expiresAt = localStorage.getItem('spotify_expires_at');
  if (token && expiresAt && Date.now() < parseInt(expiresAt, 10)) {
    return token;
  }
  return null;
}

function clearToken() {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_expires_at');
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
export function getLoginUrl() {
  const params = new URLSearchParams({
    client_id: CONFIG.CLIENT_ID,
    response_type: 'token',
    redirect_uri: CONFIG.REDIRECT_URI,
    scope: CONFIG.SCOPES,
    show_dialog: 'true',
  });
  return `https://accounts.spotify.com/authorize?${params}`;
}

export function isAuthenticated() {
  return !!getToken();
}

export function logout() {
  clearToken();
  window.location.reload();
}

// ─── API REQUEST ─────────────────────────────────────────────────────────────
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  if (!token) throw new Error('No token');

  const res = await fetch(`${CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error('Token expired');
  }

  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  if (res.status === 204) return null;
  return res.json();
}

// ─── НОРМАЛИЗАЦИЯ ДАННЫХ ─────────────────────────────────────────────────────
// Приводим Spotify формат к нашему внутреннему формату

function normalizeTrack(item) {
  const track = item.track || item;
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map(a => a.name).join(', '),
    album: track.album?.name || '',
    duration_ms: track.duration_ms,
    image: track.album?.images?.[0]?.url || null,
    preview_url: track.preview_url,
    spotify_uri: track.uri,
    emoji: null,
    gradient: null,
  };
}

function normalizeAlbum(album) {
  return {
    id: album.id,
    title: album.name,
    artist: album.artists.map(a => a.name).join(', '),
    year: album.release_date?.split('-')[0] || '',
    image: album.images?.[0]?.url || null,
    spotify_uri: album.uri,
    emoji: null,
    gradient: null,
  };
}

function normalizePlaylist(pl) {
  return {
    id: pl.id,
    name: pl.name,
    description: pl.description || '',
    image: pl.images?.[0]?.url || null,
    trackCount: pl.tracks?.total || 0,
    spotify_uri: pl.uri,
    emoji: null,
    gradient: null,
  };
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Поиск треков, альбомов, артистов
 */
export async function search(query, types = 'track,album') {
  if (!isAuthenticated()) {
    // Fallback: фильтруем мок
    const q = query.toLowerCase();
    return {
      tracks: MOCK_TRACKS.filter(t =>
        t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      ),
      albums: MOCK_ALBUMS.filter(a =>
        a.title.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
      ),
    };
  }

  const data = await apiRequest(`/search?q=${encodeURIComponent(query)}&type=${types}&limit=20`);
  return {
    tracks: (data.tracks?.items || []).map(normalizeTrack),
    albums: (data.albums?.items || []).map(normalizeAlbum),
  };
}

/**
 * Новые релизы / рекомендации для главной
 */
export async function getNewReleases() {
  if (!isAuthenticated()) return MOCK_ALBUMS;
  const data = await apiRequest('/browse/new-releases?limit=12&country=RU');
  return (data.albums?.items || []).map(normalizeAlbum);
}

/**
 * Рекомендованные треки (на основе seed жанров)
 */
export async function getRecommendedTracks() {
  if (!isAuthenticated()) return MOCK_TRACKS;
  const data = await apiRequest('/recommendations?seed_genres=pop,rock,electronic&limit=20&market=RU');
  return (data.tracks || []).map(normalizeTrack);
}

/**
 * Плейлисты текущего пользователя
 */
export async function getUserPlaylists() {
  if (!isAuthenticated()) return MOCK_PLAYLISTS;
  const data = await apiRequest('/me/playlists?limit=20');
  return (data.items || []).map(normalizePlaylist);
}

/**
 * Треки плейлиста
 */
export async function getPlaylistTracks(playlistId) {
  if (!isAuthenticated()) {
    const pl = MOCK_PLAYLISTS.find(p => p.id === playlistId);
    if (!pl) return [];
    return pl.tracks.map(id => MOCK_TRACKS.find(t => t.id === id)).filter(Boolean);
  }
  const data = await apiRequest(`/playlists/${playlistId}/tracks?limit=50`);
  return (data.items || []).map(normalizeTrack);
}

/**
 * Треки альбома
 */
export async function getAlbumTracks(albumId) {
  if (!isAuthenticated()) {
    const album = MOCK_ALBUMS.find(a => a.id === albumId);
    if (!album) return [];
    return (album.tracks || []).map(id => MOCK_TRACKS.find(t => t.id === id)).filter(Boolean);
  }
  const data = await apiRequest(`/albums/${albumId}/tracks?limit=50`);
  return (data.items || []).map(normalizeTrack);
}

/**
 * Избранные треки пользователя
 */
export async function getLikedTracks() {
  if (!isAuthenticated()) return [];
  const data = await apiRequest('/me/tracks?limit=50');
  return (data.items || []).map(normalizeTrack);
}

/**
 * Поставить / снять лайк
 */
export async function toggleLike(trackId, isLiked) {
  if (!isAuthenticated()) return;
  if (isLiked) {
    await apiRequest(`/me/tracks?ids=${trackId}`, { method: 'DELETE' });
  } else {
    await apiRequest(`/me/tracks?ids=${trackId}`, { method: 'PUT' });
  }
}

/**
 * Профиль пользователя
 */
export async function getUserProfile() {
  if (!isAuthenticated()) return null;
  return apiRequest('/me');
}
