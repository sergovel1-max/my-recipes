import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS - разрешаем запросы с любого домена
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
}));

// Cloudinary конфигурация из переменных окружения
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Хранилище для изображений в Cloudinary
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'recipes/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

// Хранилище для видео в Cloudinary
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'recipes/videos',
    allowed_formats: ['mp4', 'webm', 'mov', 'mkv'],
    resource_type: 'video',
  },
});

const uploadImage = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage });

// Middleware
app.use(express.json());

// 📤 Загрузка изображения
app.post('/api/upload-image', uploadImage.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // CloudinaryStorage возвращает путь в req.file.path
    res.json({ 
      url: req.file.path,
      public_id: req.file.filename 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 📤 Загрузка видео
app.post('/api/upload-video', uploadVideo.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
      url: req.file.path,
      public_id: req.file.filename 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// 🗑️ Удаление файла
app.delete('/api/delete-file', async (req, res) => {
  try {
    const { public_id, resource_type = 'image' } = req.body;
    
    if (!public_id) {
      return res.status(400).json({ error: 'No public_id provided' });
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type
    });
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// 🏥 Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'recipes-api' });
});

// 🚀 Старт сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📸 Images: Cloudinary`);
  console.log(`🎥 Videos: Cloudinary`);
  console.log(`✅ API ready for deployment!`);
});

export default app;
