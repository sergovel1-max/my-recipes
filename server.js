import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// CORS - разрешаем запросы с фронтенда
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Создаем папку uploads если нет
const uploadsDir = path.join(__dirname, 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir);

// Статические файлы
app.use('/uploads', express.static(uploadsDir));

// Middleware
app.use(express.json());

// Настройка multer для сохранения файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, imagesDir);
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, videosDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max
});

// Загрузка картинки
app.post('/api/upload/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    url: `/uploads/images/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size
  });
});

// Загрузка видео
app.post('/api/upload/video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ 
    url: `/uploads/videos/${req.file.filename}`,
    filename: req.file.filename,
    size: req.file.size
  });
});

// Удаление файла
app.delete('/api/upload/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const filePath = path.join(uploadsDir, type, filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Список всех файлов (для отладки)
app.get('/api/files', (req, res) => {
  const files = {
    images: fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir) : [],
    videos: fs.existsSync(videosDir) ? fs.readdirSync(videosDir) : []
  };
  res.json(files);
});

app.listen(PORT, () => {
  console.log(`📁 Server running on http://localhost:${PORT}`);
  console.log(`📸 Images: ${imagesDir}`);
  console.log(`🎥 Videos: ${videosDir}`);
});
