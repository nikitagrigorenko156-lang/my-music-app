/**
 * app.js — Точка входа. Инициализация и роутинг между страницами.
 */

import { renderSidebar } from './components/Sidebar.js';
import { renderPlayer } from './components/Player.js';
import { renderAlbumsGrid, renderTracksList, bindTrackEvents } from './components/Catalog.js';
import { renderSearch } from './components/Search.js';
import { getState, subscribe, navigateTo, playTrack } from './store/state.js';
import { isAuthenticated, getLoginUrl, getUserPlaylists, getNewReleases, getRecommendedTracks, getLikedTracks, getAlbumTracks } from './api/spotify.js';
import { MOCK_TRACKS, MOCK_ALBUMS, MOCK_PLAYLISTS } from './api/mock.js';

// ─── BOOTSTRAP ───────────────────────────────────────────────────────────────

async function init() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main-content');
  const playerEl = document.getElementById('player');

  // Плеер — постоянный
  renderPlayer(playerEl);

  // Загрузка данных
  let playlists = MOCK_PLAYLISTS;
  if (isAuthenticated()) {
    try { playlists = await getUserPlaylists(); } catch { /* fallback */ }
  }

  // Сайдбар
  renderSidebar(sidebar, playlists);

  // Рендер текущей страницы при смене роута
  subscribe('currentPage', () => renderPage(main, playlists));
  subscribe('currentPlaylistId', () => renderPage(main, playlists));
  subscribe('likedTrackIds', () => {
    if (getState().currentPage === 'liked') renderPage(main, playlists);
  });

  // Первый рендер
  renderPage(main, playlists);

  // События от каталога
  document.addEventListener('open-album', async (e) => {
    const { albumId } = e.detail;
    renderAlbumPage(main, albumId);
  });

  document.addEventListener('play-album', async (e) => {
    const { albumId } = e.detail;
    const album = MOCK_ALBUMS.find(a => a.id === albumId);
    const tracks = album?.tracks?.map(id => MOCK_TRACKS.find(t => t.id === id)).filter(Boolean) || [];
    if (tracks.length) playTrack(tracks[0], tracks);
  });
}

// ─── РОУТИНГ ─────────────────────────────────────────────────────────────────

async function renderPage(main, playlists) {
  const state = getState();

  switch (state.currentPage) {
    case 'home':    return renderHome(main);
    case 'search':  return renderSearch(main);
    case 'catalog': return renderCatalog(main);
    case 'liked':   return renderLiked(main);
    case 'playlist': return renderPlaylist(main, state.currentPlaylistId, playlists);
    default: renderHome(main);
  }
}

// ─── СТРАНИЦЫ ─────────────────────────────────────────────────────────────────

async function renderHome(container) {
  const auth = isAuthenticated();

  let albums = MOCK_ALBUMS;
  let tracks = MOCK_TRACKS;

  if (auth) {
    container.innerHTML = loadingSkeleton();
    try {
      [albums, tracks] = await Promise.all([getNewReleases(), getRecommendedTracks()]);
    } catch { /* use mock */ }
  }

  container.innerHTML = `
    ${!auth ? spotifyAuthBanner() : ''}

    <div class="hero">
      <div class="hero-label">✦ Микс дня</div>
      <div class="hero-title">Твой персональный<br>саундтрек</div>
      <div class="hero-sub">Треки, подобранные под твоё настроение — каждый день новые.</div>
      <button class="hero-btn" id="hero-play-btn">▶ Слушать</button>
    </div>

    <div class="section-mb">
      <div class="section-header">
        <div class="section-title">Новинки</div>
        <div class="section-more" id="more-catalog">Все →</div>
      </div>
      ${renderAlbumsGrid(albums.slice(0, 6))}
    </div>

    <div class="section-mb">
      <div class="section-header">
        <div class="section-title">Популярные треки</div>
      </div>
      ${renderTracksList(tracks.slice(0, 10))}
    </div>
  `;

  // Биндинг
  container.querySelector('#hero-play-btn')?.addEventListener('click', () => {
    if (tracks.length) playTrack(tracks[0], tracks);
  });

  container.querySelector('#more-catalog')?.addEventListener('click', () => {
    navigateTo('catalog');
  });

  bindTrackEvents(container, tracks);

  // Кнопка Spotify Login
  container.querySelector('#spotify-login-btn')?.addEventListener('click', () => {
    window.location.href = getLoginUrl();
  });
}

async function renderCatalog(container) {
  let albums = MOCK_ALBUMS;
  let tracks = MOCK_TRACKS;

  if (isAuthenticated()) {
    container.innerHTML = loadingSkeleton();
    try {
      [albums, tracks] = await Promise.all([getNewReleases(), getRecommendedTracks()]);
    } catch { /* mock */ }
  }

  container.innerHTML = `
    <div class="section-mb">
      <div class="section-header">
        <div class="section-title">Альбомы</div>
      </div>
      ${renderAlbumsGrid(albums)}
    </div>

    <div class="section-mb">
      <div class="section-header">
        <div class="section-title">Все треки</div>
        <div style="font-size:12px;color:var(--text3)">${tracks.length} треков</div>
      </div>
      ${renderTracksList(tracks)}
    </div>
  `;

  bindTrackEvents(container, tracks);
}

async function renderLiked(container) {
  const state = getState();
  let tracks = MOCK_TRACKS.filter(t => state.likedTrackIds.has(t.id));

  if (isAuthenticated() && !tracks.length) {
    container.innerHTML = loadingSkeleton();
    try {
      tracks = await getLikedTracks();
    } catch { /* mock */ }
  }

  container.innerHTML = `
    <div class="section-mb">
      <div class="section-header">
        <div class="section-title">❤️ Любимые треки</div>
        <div style="font-size:12px;color:var(--text3)">${tracks.length} треков</div>
      </div>
      ${tracks.length
        ? renderTracksList(tracks)
        : `<div class="empty-state">
            <div class="empty-icon">🤍</div>
            <div class="empty-title">Список пуст</div>
            <div class="empty-sub">Нажми ❤️ на треке, чтобы добавить его сюда</div>
          </div>`
      }
    </div>
  `;

  if (tracks.length) bindTrackEvents(container, tracks);
}

async function renderPlaylist(container, playlistId, playlists) {
  const pl = playlists.find(p => p.id === playlistId);
  if (!pl) { navigateTo('home'); return; }

  container.innerHTML = loadingSkeleton();

  let tracks = [];
  if (pl.tracks && Array.isArray(pl.tracks)) {
    // Мок: массив id
    tracks = pl.tracks.map(id => MOCK_TRACKS.find(t => t.id === id)).filter(Boolean);
  }

  const thumb = pl.image
    ? `<img src="${pl.image}" style="width:160px;height:160px;border-radius:16px;object-fit:cover">`
    : `<div style="width:160px;height:160px;border-radius:16px;background:${pl.gradient||'var(--surface3)'};display:flex;align-items:center;justify-content:center;font-size:64px;flex-shrink:0">${pl.emoji || '🎵'}</div>`;

  container.innerHTML = `
    <div style="display:flex;gap:28px;align-items:flex-end;margin-bottom:36px">
      ${thumb}
      <div>
        <div style="font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--text3);margin-bottom:8px">Плейлист</div>
        <div style="font-family:'Unbounded',sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.5px;margin-bottom:8px">${pl.name}</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:16px">${pl.description || ''}</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:20px">${tracks.length} треков</div>
        ${tracks.length
          ? `<button class="hero-btn" id="playlist-play-btn">▶ Слушать</button>`
          : ''}
      </div>
    </div>

    ${tracks.length
      ? renderTracksList(tracks)
      : `<div class="empty-state">
          <div class="empty-icon">🎵</div>
          <div class="empty-title">Плейлист пуст</div>
        </div>`
    }
  `;

  container.querySelector('#playlist-play-btn')?.addEventListener('click', () => {
    if (tracks.length) playTrack(tracks[0], tracks);
  });

  if (tracks.length) bindTrackEvents(container, tracks);
}

async function renderAlbumPage(container, albumId) {
  const album = MOCK_ALBUMS.find(a => a.id === albumId);
  if (!album) return;

  const tracks = (album.tracks || []).map(id => MOCK_TRACKS.find(t => t.id === id)).filter(Boolean);

  const cover = album.image
    ? `<img src="${album.image}" style="width:160px;height:160px;border-radius:16px;object-fit:cover">`
    : `<div style="width:160px;height:160px;border-radius:16px;background:${album.gradient||'var(--surface3)'};display:flex;align-items:center;justify-content:center;font-size:64px;flex-shrink:0">${album.emoji || '💿'}</div>`;

  container.innerHTML = `
    <div style="display:flex;gap:28px;align-items:flex-end;margin-bottom:36px">
      ${cover}
      <div>
        <div style="font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--text3);margin-bottom:8px">Альбом · ${album.year || ''}</div>
        <div style="font-family:'Unbounded',sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.5px;margin-bottom:8px">${album.title}</div>
        <div style="font-size:14px;color:var(--text2);margin-bottom:20px">${album.artist}</div>
        ${tracks.length
          ? `<button class="hero-btn" id="album-play-btn">▶ Слушать</button>`
          : ''}
      </div>
    </div>
    ${tracks.length ? renderTracksList(tracks) : '<div class="empty-state"><div class="empty-icon">💿</div><div class="empty-title">Треков нет</div></div>'}
  `;

  container.querySelector('#album-play-btn')?.addEventListener('click', () => {
    if (tracks.length) playTrack(tracks[0], tracks);
  });

  if (tracks.length) bindTrackEvents(container, tracks);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function loadingSkeleton() {
  return `
    <div class="skeleton" style="height:200px;border-radius:20px;margin-bottom:36px"></div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:16px;margin-bottom:36px">
      ${Array(6).fill('<div class="skeleton" style="aspect-ratio:1;border-radius:12px"></div>').join('')}
    </div>
    ${Array(6).fill('<div class="skeleton" style="height:48px;border-radius:10px;margin-bottom:4px"></div>').join('')}
  `;
}

function spotifyAuthBanner() {
  return `
    <div class="spotify-auth-banner">
      <div class="auth-info">
        <h3>🎵 Подключи Spotify</h3>
        <p>Войди через Spotify, чтобы видеть свои плейлисты, рекомендации и слушать треки.</p>
      </div>
      <button class="spotify-login-btn" id="spotify-login-btn">
        <span>🎵</span> Войти через Spotify
      </button>
    </div>
  `;
}

// ─── START ────────────────────────────────────────────────────────────────────
init();
