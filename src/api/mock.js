/**
 * mock.js — Моковые данные для разработки без Spotify API
 * Используется как fallback когда токен не установлен
 */

export const MOCK_TRACKS = [
  { id: 'm1', title: 'Сумерки', artist: 'Земфира', album: 'Ромео и Джульетта', duration_ms: 213000, emoji: '🌅', gradient: 'linear-gradient(135deg,#b34700,#4a1500)', preview_url: null },
  { id: 'm2', title: 'Пасош', artist: 'Скриптонит', album: 'Уму теряю', duration_ms: 224000, emoji: '🌃', gradient: 'linear-gradient(135deg,#1a1a4a,#050510)', preview_url: null },
  { id: 'm3', title: 'Кофе', artist: 'Монеточка', album: 'Раскраска', duration_ms: 178000, emoji: '☕', gradient: 'linear-gradient(135deg,#2a1500,#4a2500)', preview_url: null },
  { id: 'm4', title: 'Океан', artist: 'Дельфин', album: 'Звук', duration_ms: 256000, emoji: '🌊', gradient: 'linear-gradient(135deg,#001a4a,#003580)', preview_url: null },
  { id: 'm5', title: 'Пространство', artist: 'IC3PEAK', album: 'СКАЗКА', duration_ms: 267000, emoji: '🌌', gradient: 'linear-gradient(135deg,#05050f,#1a0040)', preview_url: null },
  { id: 'm6', title: 'Весна', artist: 'Brainstorm', album: 'Сезоны', duration_ms: 203000, emoji: '🌸', gradient: 'linear-gradient(135deg,#0a2a00,#1a5000)', preview_url: null },
  { id: 'm7', title: 'Позвони мне', artist: 'Mujuice', album: 'Forward', duration_ms: 241000, emoji: '📞', gradient: 'linear-gradient(135deg,#1a0a2a,#380060)', preview_url: null },
  { id: 'm8', title: 'Numb', artist: 'КиШ', album: 'Электро', duration_ms: 198000, emoji: '⚡', gradient: 'linear-gradient(135deg,#1a0000,#3a0000)', preview_url: null },
  { id: 'm9', title: 'Разбуди меня', artist: 'Rauf & Faik', album: 'Детство', duration_ms: 195000, emoji: '🎠', gradient: 'linear-gradient(135deg,#0a1a4a,#152a70)', preview_url: null },
  { id: 'm10', title: 'Ультразвук', artist: 'Лжец', album: 'Синяя', duration_ms: 234000, emoji: '🔵', gradient: 'linear-gradient(135deg,#001030,#003060)', preview_url: null },
  { id: 'm11', title: 'Мне нравится', artist: 'Глюк\'oZa', album: 'Superstar', duration_ms: 187000, emoji: '💛', gradient: 'linear-gradient(135deg,#2a2a00,#5a5000)', preview_url: null },
  { id: 'm12', title: 'Гудбай', artist: 'Anacondaz', album: 'Мёртвый сезон', duration_ms: 221000, emoji: '🖤', gradient: 'linear-gradient(135deg,#0f0f0f,#1a1a1a)', preview_url: null },
];

export const MOCK_ALBUMS = [
  { id: 'a1', title: 'Ромео и Джульетта', artist: 'Земфира', year: 2010, emoji: '🌅', gradient: 'linear-gradient(135deg,#b34700,#4a1500)', tracks: ['m1'] },
  { id: 'a2', title: 'Уму теряю', artist: 'Скриптонит', year: 2019, emoji: '🌃', gradient: 'linear-gradient(135deg,#1a1a4a,#050510)', tracks: ['m2'] },
  { id: 'a3', title: 'СКАЗКА', artist: 'IC3PEAK', year: 2020, emoji: '🌌', gradient: 'linear-gradient(135deg,#05050f,#1a0040)', tracks: ['m5'] },
  { id: 'a4', title: 'Раскраска', artist: 'Монеточка', year: 2018, emoji: '☕', gradient: 'linear-gradient(135deg,#2a1500,#4a2500)', tracks: ['m3'] },
  { id: 'a5', title: 'Электро', artist: 'КиШ', year: 2006, emoji: '⚡', gradient: 'linear-gradient(135deg,#1a0000,#3a0000)', tracks: ['m8'] },
  { id: 'a6', title: 'Звук', artist: 'Дельфин', year: 2015, emoji: '🌊', gradient: 'linear-gradient(135deg,#001a4a,#003580)', tracks: ['m4'] },
];

export const MOCK_PLAYLISTS = [
  {
    id: 'p1',
    name: 'Вечерняя атмосфера',
    description: 'Для расслабленного вечера',
    emoji: '🌆',
    gradient: 'linear-gradient(135deg,#fc3f1d,#ff8c42)',
    tracks: ['m1', 'm4', 'm5', 'm7'],
  },
  {
    id: 'p2',
    name: 'Фокус и работа',
    description: 'Помогает сосредоточиться',
    emoji: '🎯',
    gradient: 'linear-gradient(135deg,#1e88e5,#42a5f5)',
    tracks: ['m2', 'm6', 'm10'],
  },
  {
    id: 'p3',
    name: 'Ночная поездка',
    description: 'Для долгой дороги',
    emoji: '🌙',
    gradient: 'linear-gradient(135deg,#7b1fa2,#ce93d8)',
    tracks: ['m2', 'm5', 'm7', 'm8', 'm12'],
  },
];
