# 🚀 Размещение в интернете

## Быстрый старт (бесплатно)

### Шаг 1: Регистрация на Cloudinary
1. Открой https://cloudinary.com
2. Нажми **Sign Up for Free**
3. Войди через Google или создай аккаунт
4. После регистрации получи:
   - **Cloud name** (например: `myrecipes123`)
   - **API Key** (например: `123456789012345`)
   - **API Secret** (длинная строка)

### Шаг 2: Загрузка на GitHub
1. Создай новый репозиторий на https://github.com
2. Загрузи туда весь код проекта:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/ТВОЙ_НИК/ТВОЙ_РЕПО.git
   git push -u origin main
   ```

### Шаг 3: Разворачиваем бэкенд на Render.com
1. Открой https://render.com
2. Нажми **Get Started for Free** → войди через GitHub
3. Нажми **New +** → **Web Service**
4. Выбери свой репозиторий
5. Настройки:
   - **Name**: `recipes-api` (или любое другое)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. Нажми **Advanced** и добавь переменные окружения:
   ```
   CLOUDINARY_CLOUD_NAME=твой_cloud_name
   CLOUDINARY_API_KEY=твой_api_key
   CLOUDINARY_API_SECRET=твой_api_secret
   ```
7. Нажми **Create Web Service**
8. Жди пока соберётся (2-3 минуты)
9. Скопируй полученный URL (например: `https://recipes-api.onrender.com`)

### Шаг 4: Разворачиваем фронтенд
#### Вариант A: Vercel (рекомендую)
1. Открой https://vercel.com
2. Войди через GitHub
3. Нажми **Add New...** → **Project**
4. Выбери свой репозиторий
5. Настройки:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Нажми **Environment Variables** и добавь:
   ```
   VITE_API_URL=https://recipes-api.onrender.com
   ```
7. Нажми **Deploy**
8. Готово! Получишь URL типа `https://myrecipes.vercel.app`

#### Вариант B: Netlify
1. Открой https://netlify.com
2. Войди через GitHub
3. Перетащи папку `dist` (предварительно собери: `npm run build`)
4. Или подключи GitHub репозиторий
5. Добавь переменную окружения `VITE_API_URL`
6. Готово!

## ✅ Проверка
1. Открой сайт (например: `https://myrecipes.vercel.app`)
2. Добавь рецепт с фото
3. Фото должно загрузиться и сохраниться
4. Перезагрузи страницу — фото должно остаться!

## ⚠️ Важно знать
- **Бесплатный Render** "засыпает" после 15 мин бездействия
- Первый запрос после "сна" занимает 30-60 секунд (разогрев)
- **Cloudinary** даёт 25GB бесплатно — этого хватит на тысячи фото
- Все файлы хранятся в облаке и не пропадут!

## 🔧 Если что-то не работает

### Сервер не запускается
Проверь логи на Render (Dashboard → Logs). Частые ошибки:
- Нет переменных окружения — добавь CLOUDINARY_*
- Порт занят — Render сам назначает PORT, не меняй

### Фото не загружается
1. Открой DevTools (F12) → Console
2. Проверь ошибки CORS — должно работать если сервер и фронтенд на разных доменах
3. Проверь что `VITE_API_URL` правильный

### Хочу использовать свой домен
- **Vercel**: Settings → Domains → добавь свой
- **Render**: Settings → Custom Domains → добавь свой
- Нужно настроить DNS у регистратора домена

## 💡 Советы
- Имя проекта на Render делай уникальным (добавь свои инициалы)
- Фотографии на телефоне сжимаются автоматически до 1200px — экономит место
- Видео тоже работают, но грузятся дольше

## 📞 Помощь
Если что-то пошло не так:
1. Проверь логи на Render (Dashboard → Logs)
2. Проверь Console в браузере (F12)
3. Проверь что переменные окружения правильные

Удачи! 🎉
