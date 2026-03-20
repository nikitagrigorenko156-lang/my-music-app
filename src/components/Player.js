/**
 * Player.js — Нижний плеер с управлением
 */

import {
  getState, subscribe,
  togglePlay, nextTrack, prevTrack,
  toggleShuffle, cycleRepeat,
  setVolume, toggleMute, setProgress, toggleLikeTrack,
} from '../store/state.js';

let progressInterval = null;

export function renderPlayer(container) {
  container.innerHTML = `
    <div class="player-inner">

      <!-- Текущий трек -->
      <div class="now-playing">
        <div class="now-cover" id="now-cover"><span style="font-size:24px">♫</span></div>
        <div class="now-meta">
          <div class="now-title" id="now-title">Выберите трек</div>
          <div class="now-artist" id="now-artist">—</div>
        </div>
        <button class="now-like-btn ctrl-btn" id="now-like-btn" title="В любимые">🤍</button>
      </div>

      <!-- Управление -->
      <div class="player-controls">
        <div class="ctrl-buttons">
          <button class="ctrl-btn" id="shuffle-btn" title="Перемешать" onclick="">⇌</button>
          <button class="ctrl-btn" id="prev-btn" title="Назад">⏮</button>
          <button class="play-main-btn" id="play-btn" title="Воспроизвести / Пауза">▶</button>
          <button class="ctrl-btn" id="next-btn" title="Вперёд">⏭</button>
          <button class="ctrl-btn" id="repeat-btn" title="Повтор">↺</button>
        </div>

        <div class="player-progress">
          <span class="progress-time" id="cur-time">0:00</span>
          <div class="progress-track" id="progress-track">
            <div class="progress-fill" id="progress-fill" style="width:0%"></div>
          </div>
          <span class="progress-time right" id="dur-time">0:00</span>
        </div>
      </div>

      <!-- Правая часть -->
      <div class="player-right">
        <div class="eq-bars" id="player-eq"><span></span><span></span><span></span></div>
        <button class="ctrl-btn" id="mute-btn" title="Звук">🔊</button>
        <div class="volume-wrap">
          <div class="volume-track" id="volume-track">
            <div class="volume-fill" id="volume-fill" style="width:70%"></div>
          </div>
        </div>
      </div>

    </div>
  `;

  bindPlayerEvents(container);
  subscribeToState();
}

function bindPlayerEvents(container) {
  container.querySelector('#play-btn').addEventListener('click', () => {
    if (!getState().currentTrack) return;
    togglePlay();
  });

  container.querySelector('#prev-btn').addEventListener('click', prevTrack);
  container.querySelector('#next-btn').addEventListener('click', nextTrack);

  container.querySelector('#shuffle-btn').addEventListener('click', () => {
    toggleShuffle();
    container.querySelector('#shuffle-btn').classList.toggle('active', getState().isShuffle);
  });

  container.querySelector('#repeat-btn').addEventListener('click', () => {
    cycleRepeat();
    updateRepeatBtn();
  });

  container.querySelector('#mute-btn').addEventListener('click', () => {
    toggleMute();
    updateMuteBtn();
  });

  container.querySelector('#progress-track').addEventListener('click', (e) => {
    const track = getState().currentTrack;
    if (!track) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(Math.round(pct * track.duration_ms));
  });

  container.querySelector('#volume-track').addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(v);
    document.getElementById('volume-fill').style.width = (v * 100) + '%';
  });

  container.querySelector('#now-like-btn').addEventListener('click', () => {
    const track = getState().currentTrack;
    if (!track) return;
    toggleLikeTrack(track.id);
    updateLikeBtn();
  });
}

function subscribeToState() {
  subscribe('currentTrack', updateTrackInfo);
  subscribe('isPlaying', updatePlayState);
  subscribe('likedTrackIds', updateLikeBtn);
  subscribe('progressMs', updateProgress);
}

function updateTrackInfo(state) {
  const track = state.currentTrack;
  if (!track) return;

  const coverEl = document.getElementById('now-cover');
  if (track.image) {
    coverEl.innerHTML = `<img src="${track.image}" alt="${track.title}">`;
  } else {
    coverEl.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${track.gradient||'var(--surface3)'};font-size:24px;border-radius:10px">${track.emoji || '♫'}</div>`;
  }

  document.getElementById('now-title').textContent = track.title;
  document.getElementById('now-artist').textContent = track.artist;
  document.getElementById('dur-time').textContent = formatTime(track.duration_ms);
  updateLikeBtn();
}

function updatePlayState(state) {
  const btn = document.getElementById('play-btn');
  const eq = document.getElementById('player-eq');
  if (!btn) return;

  btn.textContent = state.isPlaying ? '⏸' : '▶';
  eq.className = 'eq-bars' + (state.isPlaying ? ' playing' : '');

  if (state.isPlaying) {
    startProgressTick();
  } else {
    stopProgressTick();
  }
}

function updateProgress(state) {
  const track = state.currentTrack;
  if (!track) return;
  const pct = (state.progressMs / track.duration_ms) * 100;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = pct + '%';
  const cur = document.getElementById('cur-time');
  if (cur) cur.textContent = formatTime(state.progressMs);
}

function updateLikeBtn() {
  const state = getState();
  const track = state.currentTrack;
  const btn = document.getElementById('now-like-btn');
  if (!btn || !track) return;
  const liked = state.likedTrackIds.has(track.id);
  btn.textContent = liked ? '❤️' : '🤍';
  btn.classList.toggle('liked', liked);
}

function updateRepeatBtn() {
  const state = getState();
  const btn = document.getElementById('repeat-btn');
  if (!btn) return;
  const icons = { none: '↺', all: '↺', one: '↻' };
  btn.textContent = icons[state.repeatMode] || '↺';
  btn.classList.toggle('active', state.repeatMode !== 'none');
  btn.title = state.repeatMode === 'one' ? 'Повтор трека' : state.repeatMode === 'all' ? 'Повтор очереди' : 'Повтор выкл';
}

function updateMuteBtn() {
  const state = getState();
  const btn = document.getElementById('mute-btn');
  if (!btn) return;
  btn.textContent = state.isMuted ? '🔇' : '🔊';
}

// ─── PROGRESS TICKER ────────────────────────────────────────────────────────
function startProgressTick() {
  stopProgressTick();
  progressInterval = setInterval(() => {
    const state = getState();
    if (!state.isPlaying || !state.currentTrack) return;
    const newMs = state.progressMs + 1000;
    if (newMs >= state.currentTrack.duration_ms) {
      if (state.repeatMode === 'one') {
        setProgress(0);
      } else {
        nextTrack();
      }
    } else {
      setProgress(newMs);
    }
  }, 1000);
}

function stopProgressTick() {
  if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
export function formatTime(ms) {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
