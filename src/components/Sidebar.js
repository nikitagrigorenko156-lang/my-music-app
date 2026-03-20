/**
 * Sidebar.js — Боковая навигация
 */

import { getState, setState, subscribe, navigateTo } from '../store/state.js';

const NAV_ITEMS = [
  { page: 'home',    icon: '🏠', label: 'Главная' },
  { page: 'search',  icon: '🔍', label: 'Поиск' },
  { page: 'catalog', icon: '🎵', label: 'Каталог' },
  { page: 'liked',   icon: '❤️', label: 'Любимые треки' },
];

export function renderSidebar(container, playlists = []) {
  container.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">♫</div>
      Волна
    </div>

    <div class="sidebar-nav" id="sidebar-nav">
      ${NAV_ITEMS.map(item => `
        <div class="nav-item ${getState().currentPage === item.page ? 'active' : ''}"
             data-page="${item.page}">
          <span class="nav-icon">${item.icon}</span>
          ${item.label}
        </div>
      `).join('')}
    </div>

    <div class="nav-section-label" style="padding: 16px 20px 8px">Мои плейлисты</div>

    <div class="sidebar-playlists" id="sidebar-playlists">
      ${renderPlaylists(playlists)}
    </div>
  `;

  bindEvents(container);
}

function renderPlaylists(playlists) {
  if (!playlists.length) {
    return `<div style="padding:12px 20px;font-size:12px;color:var(--text3)">Плейлистов пока нет</div>`;
  }

  return playlists.map(pl => {
    const thumb = pl.image
      ? `<img src="${pl.image}" style="width:30px;height:30px;border-radius:7px;object-fit:cover">`
      : `<div class="playlist-thumb" style="background:${pl.gradient || 'var(--surface3)'}">${pl.emoji || '🎵'}</div>`;

    const isActive = getState().currentPlaylistId === pl.id;
    return `
      <div class="playlist-sidebar-item ${isActive ? 'active' : ''}" data-playlist="${pl.id}">
        ${thumb}
        <div class="playlist-sidebar-meta">
          <div class="playlist-sidebar-name">${pl.name}</div>
          <div class="playlist-sidebar-count">${pl.trackCount ?? (pl.tracks?.length ?? 0)} треков</div>
        </div>
      </div>
    `;
  }).join('');
}

function bindEvents(container) {
  container.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      navigateTo(el.dataset.page);
    });
  });

  container.querySelectorAll('.playlist-sidebar-item').forEach(el => {
    el.addEventListener('click', () => {
      navigateTo('playlist', el.dataset.playlist);
    });
  });
}

// Перерисовываем активный пункт при смене страницы
subscribe('currentPage', (state) => {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === state.currentPage);
  });
  document.querySelectorAll('.playlist-sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.playlist === state.currentPlaylistId);
  });
});
