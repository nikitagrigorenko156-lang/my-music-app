/**
 * state.js — Глобальный стейт приложения
 * Простой реактивный стор без зависимостей
 */

const state = {
  // Плеер
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isShuffle: false,
  isRepeat: false,   // 'none' | 'one' | 'all'
  repeatMode: 'none',
  volume: 0.7,
  isMuted: false,
  progressMs: 0,

  // UI
  currentPage: 'home',       // 'home' | 'search' | 'catalog' | 'liked' | 'playlist'
  currentPlaylistId: null,
  searchQuery: '',
  searchGenre: 'all',

  // Данные
  likedTrackIds: new Set(),
  playlists: [],
  user: null,
};

const listeners = new Map();

export function getState() {
  return state;
}

export function setState(updates) {
  Object.assign(state, updates);
  // Нотифицируем подписчиков
  for (const [key, fns] of listeners.entries()) {
    if (Object.keys(updates).includes(key) || key === '*') {
      fns.forEach(fn => fn(state));
    }
  }
}

/**
 * Подписаться на изменения конкретного поля или '*' для всех
 */
export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, []);
  listeners.get(key).push(fn);
  return () => {
    const arr = listeners.get(key);
    if (arr) listeners.set(key, arr.filter(f => f !== fn));
  };
}

// ─── PLAYER ACTIONS ──────────────────────────────────────────────────────────

export function playTrack(track, queue = null) {
  if (queue) setState({ queue, queueIndex: queue.findIndex(t => t.id === track.id) });
  setState({ currentTrack: track, isPlaying: true, progressMs: 0 });
}

export function togglePlay() {
  setState({ isPlaying: !state.isPlaying });
}

export function nextTrack() {
  if (!state.queue.length) return;
  let nextIdx;
  if (state.isShuffle) {
    nextIdx = Math.floor(Math.random() * state.queue.length);
  } else {
    nextIdx = (state.queueIndex + 1) % state.queue.length;
  }
  setState({ queueIndex: nextIdx, currentTrack: state.queue[nextIdx], isPlaying: true, progressMs: 0 });
}

export function prevTrack() {
  if (!state.queue.length) return;
  if (state.progressMs > 5000) {
    setState({ progressMs: 0 });
    return;
  }
  const prevIdx = (state.queueIndex - 1 + state.queue.length) % state.queue.length;
  setState({ queueIndex: prevIdx, currentTrack: state.queue[prevIdx], isPlaying: true, progressMs: 0 });
}

export function toggleShuffle() {
  setState({ isShuffle: !state.isShuffle });
}

export function cycleRepeat() {
  const modes = ['none', 'all', 'one'];
  const next = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
  setState({ repeatMode: next });
}

export function setVolume(v) {
  setState({ volume: v, isMuted: v === 0 });
}

export function toggleMute() {
  setState({ isMuted: !state.isMuted });
}

export function setProgress(ms) {
  setState({ progressMs: ms });
}

export function toggleLikeTrack(trackId) {
  const liked = new Set(state.likedTrackIds);
  if (liked.has(trackId)) liked.delete(trackId);
  else liked.add(trackId);
  setState({ likedTrackIds: liked });
}

export function navigateTo(page, playlistId = null) {
  setState({ currentPage: page, currentPlaylistId: playlistId });
}
