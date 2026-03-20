# 🎵 Волна — Музыкальный плеер

Аналог Яндекс.Музыки с интеграцией Spotify API. Ванильный JS + ES Modules, без сборщиков.

## Структура проекта

```
music-app/
├── index.html                  # Точка входа
├── .gitlab-ci.yml              # CI/CD для GitLab Pages
├── src/
│   ├── api/
│   │   ├── spotify.js          # Spotify Web API клиент
│   │   └── mock.js             # Моковые данные (fallback)
│   ├── components/
│   │   ├── Sidebar.js          # Боковая навигация + плейлисты
│   │   ├── Player.js           # Нижний плеер
│   │   ├── Catalog.js          # Каталог альбомов и треков
│   │   └── Search.js           # Поиск с фильтрацией по жанрам
│   ├── store/
│   │   └── state.js            # Глобальный стейт (subscribe/setState)
│   └── styles/
│       └── main.css            # Все стили
```

## Запуск локально

Нужен любой локальный HTTP-сервер (из-за ES Modules):

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve .

# VS Code → Live Server расширение
```

Открыть: http://localhost:8080

## Подключение Spotify API

1. Зарегистрируй приложение на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. В настройках приложения добавь **Redirect URI**: `http://localhost:8080` (и продакшн URL)
3. Скопируй **Client ID**
4. Вставь его в `src/api/spotify.js`:

```js
const CONFIG = {
  CLIENT_ID: 'вставь_сюда_свой_client_id',
  ...
};
```

5. Пользователь нажимает «Войти через Spotify» → OAuth redirect → токен сохраняется в `localStorage`

### Что работает без Spotify (мок-режим):
- ✅ Навигация между страницами
- ✅ Плеер (прогресс, перемотка, очередь, повтор, перемешивание)
- ✅ Каталог альбомов и треков
- ✅ Поиск с фильтрацией по жанрам
- ✅ Лайки треков (сохраняются в сессии)
- ✅ Плейлисты (моковые)

### Что добавляет Spotify:
- 🎵 Реальные треки и предпрослушивание (30 сек preview)
- 🖼 Обложки альбомов
- 📋 Плейлисты пользователя
- 🔍 Поиск по каталогу Spotify
- ❤️ Синхронизация лайков

## Деплой на GitLab Pages

```bash
git init
git remote add origin https://gitlab.com/USERNAME/music-app.git
git add .
git commit -m "feat: initial music app"
git push -u origin main
```

После пуша → CI запустится автоматически → приложение будет доступно на:
`https://USERNAME.gitlab.io/music-app`

Не забудь добавить этот URL в **Redirect URIs** в Spotify Dashboard.

## Архитектура стейта

Стейт управляется через `src/store/state.js` — простой pub/sub без зависимостей:

```js
import { setState, subscribe } from './store/state.js';

// Подписка на изменение
subscribe('isPlaying', (state) => {
  console.log('Playing:', state.isPlaying);
});

// Изменение стейта
setState({ isPlaying: true });
```

## Дальнейшее развитие

- [ ] Добавить Spotify Web Playback SDK для полного воспроизведения (требует Premium)
- [ ] Визуализация звука через Web Audio API
- [ ] Кэширование данных в IndexedDB
- [ ] PWA (Service Worker + manifest)
- [ ] Создание и редактирование плейлистов
