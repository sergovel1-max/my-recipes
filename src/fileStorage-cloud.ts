// API URL для облачного сервера (Render.com)
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

export async function uploadImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded * 100) / e.total);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.url);
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload error')));
    
    xhr.open('POST', `${API_URL}/api/upload-image`);
    xhr.send(formData);
  });
}

export async function uploadVideo(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const formData = new FormData();
  formData.append('video', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const progress = Math.round((e.loaded * 100) / e.total);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response.url);
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload error')));
    
    xhr.open('POST', `${API_URL}/api/upload-video`);
    xhr.send(formData);
  });
}

export async function deleteFile(url: string): Promise<void> {
  // Извлекаем public_id из Cloudinary URL
  // URL формата: https://res.cloudinary.com/.../recipes/images/filename.jpg
  const match = url.match(/\/recipes\/(images|videos)\/(\w+)/);
  if (!match) return;
  
  const resourceType = match[1] === 'videos' ? 'video' : 'image';
  const publicId = `recipes/${match[1]}/${match[2]}`;
  
  await fetch(`${API_URL}/api/delete-file`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_id: publicId, resource_type: resourceType }),
  });
}

export function isLocalFile(url: string): boolean {
  // Cloudinary файлы всегда имеют URL с res.cloudinary.com
  return url.includes('res.cloudinary.com');
}

export function getFullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
}
