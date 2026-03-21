/**
 * Catalog.js — Каталог альбомов и треков
 */

import { playTrack, getState, toggleLikeTrack, setState, subscribe } from '../store/state.js';
import { formatTime } from './Player.js';

/**
 * Отрисовка карточек альбомов
 */
export function renderAlbumsGrid(albums) {
  if (!albums.length) {
    return `<div class="empty-state">
      <div class="empty-icon">💿</div>
      <div class="empty-title">Альбомов пока нет</div>
    </div>`;
  }

  return `<div class="albums-grid">
    ${albums.map(album => albumCard(album)).join('')}
  </div>`;
}

function albumCard(album) {
  const cover = album.image
    ? `<img src="${album.image}" alt="${album.title}">`
    : `<div class="album-cover-bg" style="background:${album.gradient || 'var(--surface3)'}">${album.emoji || '🎵'}</div>`;

  return `
    <div class="album-card" data-album-id="${album.id}">
      <div class="album-cover">
        ${cover}
        <button class="album-play-btn" data-album-id="${album.id}">▶</button>
      </div>
      <div class="album-title">${album.title}</div>
      <div class="album-artist">${album.artist}</div>
    </div>
  `;
}

/**
 * Отрисовка списка треков
 */
export function renderTracksList(tracks, queue = null) {
  const state = getState();
  const effectiveQueue = queue || tracks;

  if (!tracks.length) {
    return `<div class="empty-state">
      <div class="empty-icon">🎵</div>
      <div class="empty-title">Треков нет</div>
      <div class="empty-sub">Попробуй изменить фильтр или поиск</div>
    </div>`;
  }

  return `<div class="tracks-list">
    ${tracks.map((track, i) => trackRow(track, i, state, effectiveQueue)).join('')}
  </div>`;
}

function trackRow(track, index, state, queue) {
  const isPlaying = state.currentTrack?.id === track.id;
  const isLiked = state.likedTrackIds.has(track.id);

  const numOrEq = isPlaying
    ? `<div class="eq-bars ${state.isPlaying ? 'playing' : ''}"><span></span><span></span><span></span></div>`
    : `<span>${index + 1}</span>`;

  return `
    <div class="track-row ${isPlaying ? 'is-playing' : ''}"
         data-track-id="${track.id}"
         data-queue='${JSON.stringify(queue.map(t => t.id))}'>
      <div class="track-info">
        <div class="track-title">${track.title}</div>
        <div class="track-artist-album">${track.artist}${track.album ? ' · ' + track.album : ''}</div>
      </div>
      <button class="track-like-btn ctrl-btn ${isLiked ? 'liked' : ''}"
              data-track-id="${track.id}"
              title="${isLiked ? 'Убрать из любимых' : 'В любимые'}">
        ${isLiked ? '❤️' : '🤍'}
      </button>
      <div class="track-duration">${formatTime(track.duration_ms)}</div>
    </div>
  `;
}

/**
 * Биндинг событий на контейнер с треками
 */
export function bindTrackEvents(container, allTracks) {
  container.addEventListener('click', (e) => {
    // Лайк
    const likeBtn = e.target.closest('.track-like-btn');
    if (likeBtn) {
      e.stopPropagation();
      const id = likeBtn.dataset.trackId;
      toggleLikeTrack(id);
      // Обновляем кнопку без перерисовки
      const liked = getState().likedTrackIds.has(id);
      likeBtn.textContent = liked ? '❤️' : '🤍';
      likeBtn.classList.toggle('liked', liked);
      // Обновляем плейлист "Любимые"
      document.dispatchEvent(new CustomEvent('liked-changed'));
      return;
    }

    // Кнопка Play на альбоме
    const albumPlayBtn = e.target.closest('.album-play-btn');
    if (albumPlayBtn) {
      e.stopPropagation();
      const albumId = albumPlayBtn.dataset.albumId;
      document.dispatchEvent(new CustomEvent('play-album', { detail: { albumId } }));
      return;
    }

    // Клик по альбому
    const albumCard = e.target.closest('.album-card');
    if (albumCard) {
      const albumId = albumCard.dataset.albumId;
      document.dispatchEvent(new CustomEvent('open-album', { detail: { albumId } }));
      return;
    }

    // Клик по треку
    const trackRow = e.target.closest('.track-row');
    if (trackRow) {
      const trackId = trackRow.dataset.trackId;
      const track = allTracks.find(t => t.id === trackId);
      if (track) playTrack(track, allTracks);
    }
  });
}
