# Размещение в интернете

## Быстрый старт (бесплатно)

### 1. Cloudinary (хранение файлов)
1. Зарегистрируйся на https://cloudinary.com
2. Получи:
   - **Cloud name**
   - **API Key**
   - **API Secret**

### 2. Render.com (сервер + сайт)
1. Зарегистрируйся на https://render.com (через GitHub)
2. Подключи свой GitHub репозиторий
3. Создай **Web Service** для бэкенда:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables:
     ```
     CLOUDINARY_CLOUD_NAME=твой-cloud-name
     CLOUDINARY_API_KEY=твой-api-key
     CLOUDINARY_API_SECRET=твой-api-secret
     ```

### 3. Обнови фронтенд
В `src/fileStorage.ts` замени:
```typescript
const API_URL = 'https://твой-сервис.onrender.com';
```

### 4. Статический сайт (Vercel)
1. Зарегистрируйся на https://vercel.com
2. Импортируй frontend
3. Добавь Environment Variable:
   ```
   VITE_API_URL=https://твой-сервис.onrender.com
   ```

## Альтернатива: Всё на Render (проще)
Render может хостить и фронтенд, и бэкенд:
- Создай **Static Site** для фронтенда
- Создай **Web Service** для бэкенда
- Оба будут на одном домене (CORS не нужен!)

## Важно
- Файлы на бесплатном Render "засыпают" после 15 минут бездействия
- Первый запрос может занять 30-60 секунд (разогрев)
- Cloudinary даёт 25GB бесплатно — хватит надолго

## Проверка
После деплоя открой:
- `https://твой-сайт.com` — должен открыться интерфейс
- Загрузи фото — должно сохраниться в Cloudinary
