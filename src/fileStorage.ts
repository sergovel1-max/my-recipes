const API_URL = 'http://localhost:3001';

// Upload image to server
export async function uploadImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(`${API_URL}${response.url}`);
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Upload error')));
    xhr.open('POST', `${API_URL}/api/upload/image`);
    xhr.send(formData);
  });
}

// Upload video to server
export async function uploadVideo(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const formData = new FormData();
  formData.append('video', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(`${API_URL}${response.url}`);
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Upload error')));
    xhr.open('POST', `${API_URL}/api/upload/video`);
    xhr.send(formData);
  });
}

// Delete file from server
export async function deleteFile(url: string): Promise<void> {
  const match = url.match(/\/uploads\/(images|videos)\/(.+)$/);
  if (!match) return;
  
  const [, type, filename] = match;
  
  await fetch(`${API_URL}/api/upload/${type}/${filename}`, {
    method: 'DELETE'
  });
}

// Check if URL is from our server
export function isLocalFile(url: string): boolean {
  return url.startsWith(`${API_URL}/uploads/`);
}

// Get full URL
export function getFullUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
}
