/**
 * Search.js — Страница поиска с фильтрацией по жанрам
 */

import { getState, setState } from '../store/state.js';
import { renderTracksList, renderAlbumsGrid, bindTrackEvents } from './Catalog.js';
import { search } from '../api/spotify.js';
import { MOCK_TRACKS } from '../api/mock.js';

const GENRES = [
  { id: 'all', label: 'Все' },
  { id: 'pop', label: 'Поп' },
  { id: 'rock', label: 'Рок' },
  { id: 'electronic', label: 'Электронная' },
  { id: 'hip-hop', label: 'Хип-хоп' },
  { id: 'jazz', label: 'Джаз' },
  { id: 'classical', label: 'Классика' },
];

let searchTimer = null;

export function renderSearch(container) {
  const state = getState();
  container.innerHTML = `
    <div class="search-bar">
      <span style="font-size:20px;color:var(--text3)">🔍</span>
      <input
        type="text"
        id="search-input"
        placeholder="Исполнители, треки, альбомы..."
        value="${state.searchQuery}"
        autocomplete="off"
      />
    </div>

    <div class="genre-chips" id="genre-chips">
      ${GENRES.map(g => `
        <div class="chip ${state.searchGenre === g.id ? 'active' : ''}" data-genre="${g.id}">
          ${g.label}
        </div>
      `).join('')}
    </div>

    <div id="search-results-area">
      ${renderSearchResults(MOCK_TRACKS, state.searchQuery, state.searchGenre)}
    </div>
  `;

  bindSearchEvents(container);
}

function renderSearchResults(tracks, query, genre) {
  let filtered = tracks;

  if (genre && genre !== 'all') {
    filtered = filtered.filter(t => t.genre === genre);
  }

  if (query && query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.album || '').toLowerCase().includes(q)
    );
  }

  if (!filtered.length) {
    return `<div class="empty-state">
      <div class="empty-icon">🔍</div>
      <div class="empty-title">Ничего не найдено</div>
      <div class="empty-sub">Попробуй другой запрос или смени жанр</div>
    </div>`;
  }

  return `
    <div class="section-header" style="margin-bottom:16px">
      <div class="section-title">
        ${query ? `Результаты для «${query}»` : 'Все треки'}
      </div>
      <div style="font-size:12px;color:var(--text3)">${filtered.length} треков</div>
    </div>
    ${renderTracksList(filtered)}
  `;
}

function bindSearchEvents(container) {
  const input = container.querySelector('#search-input');
  const resultsArea = container.querySelector('#search-results-area');

  // Поиск с debounce
  input.addEventListener('input', () => {
    const q = input.value;
    setState({ searchQuery: q });
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      // Если авторизован — запрос к Spotify API
      if (false /* isAuthenticated() */) {
        resultsArea.innerHTML = `<div class="skeleton" style="height:200px"></div>`;
        try {
          const res = await search(q);
          const tracks = res.tracks || [];
          resultsArea.innerHTML = renderSearchResults(tracks, q, getState().searchGenre);
          bindTrackEvents(resultsArea, tracks);
        } catch {
          resultsArea.innerHTML = renderSearchResults(MOCK_TRACKS, q, getState().searchGenre);
          bindTrackEvents(resultsArea, MOCK_TRACKS);
        }
      } else {
        // Мок фильтрация
        resultsArea.innerHTML = renderSearchResults(MOCK_TRACKS, q, getState().searchGenre);
        bindTrackEvents(resultsArea, MOCK_TRACKS);
      }
    }, 300);
  });

  // Жанры
  container.querySelector('#genre-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const genre = chip.dataset.genre;
    setState({ searchGenre: genre });
    container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    resultsArea.innerHTML = renderSearchResults(MOCK_TRACKS, getState().searchQuery, genre);
    bindTrackEvents(resultsArea, MOCK_TRACKS);
  });

  // Биндим треки сразу
  bindTrackEvents(resultsArea, MOCK_TRACKS);
}
