const DB_NAME = 'CulinaryBlogMedia';
const DB_VERSION = 2;
const STORE_NAME = 'media';

let db: IDBDatabase | null = null;

export async function initMediaDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };
    
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Save any media file (image or video)
export async function saveMediaFile(id: string, file: File): Promise<string> {
  if (!db) await initMediaDB();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        id,
        data: arrayBuffer,
        type: file.type,
        name: file.name,
        size: file.size,
      });
      
      request.onsuccess = () => resolve(`indexeddb://${id}`);
      request.onerror = () => reject(request.error);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// Get media file as blob URL
export async function getMediaFile(id: string): Promise<string | null> {
  if (!db) await initMediaDB();
  if (!id.startsWith('indexeddb://')) return id; // External URL or base64
  
  const mediaId = id.replace('indexeddb://', '');
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(mediaId);
      
      request.onsuccess = () => {
        if (!request.result || !request.result.data) {
          resolve(null);
          return;
        }
        
        const blob = new Blob([request.result.data], { type: request.result.type });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };
      
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    } catch (err) {
      reject(err);
    }
  });
}

// Delete media file
export async function deleteMediaFile(id: string): Promise<void> {
  if (!db) await initMediaDB();
  if (!id.startsWith('indexeddb://')) return;
  
  const mediaId = id.replace('indexeddb://', '');
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(mediaId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Legacy compatibility - redirect old video functions to new media functions
export async function saveVideo(id: string, file: File, onProgress?: (progress: number) => void): Promise<string> {
  // For videos, use chunked approach for large files
  if (file.size > 10 * 1024 * 1024) { // > 10MB - use chunked
    return saveVideoChunked(id, file, onProgress);
  }
  return saveMediaFile(id, file);
}

async function saveVideoChunked(id: string, file: File, onProgress?: (progress: number) => void): Promise<string> {
  if (!db) await initMediaDB();
  const CHUNK_SIZE = 5 * 1024 * 1024;
  
  return new Promise((resolve, reject) => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const chunks: ArrayBuffer[] = [];
    let currentChunk = 0;
    
    function readNextChunk() {
      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        chunks.push(reader.result as ArrayBuffer);
        currentChunk++;
        
        const progress = Math.round((currentChunk / totalChunks) * 100);
        onProgress?.(progress);
        
        if (currentChunk < totalChunks) {
          setTimeout(readNextChunk, 0);
        } else {
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
          const combined = new Uint8Array(totalLength);
          let offset = 0;
          
          for (const chunk of chunks) {
            combined.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
          }
          
          const transaction = db!.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          const request = store.put({
            id,
            data: combined.buffer,
            type: file.type,
            name: file.name,
            size: file.size,
          });
          
          request.onsuccess = () => resolve(`indexeddb://${id}`);
          request.onerror = () => reject(request.error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(chunk);
    }
    
    setTimeout(readNextChunk, 0);
  });
}

export async function getVideo(id: string): Promise<string | null> {
  return getMediaFile(id);
}

export async function deleteVideo(id: string): Promise<void> {
  return deleteMediaFile(id);
}

export async function initVideoDB(): Promise<void> {
  return initMediaDB();
}

export async function clearAllVideos(): Promise<void> {
  if (!db) await initMediaDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Save base64 image to IndexedDB
export async function saveBase64Image(id: string, base64Data: string): Promise<string> {
  if (!db) await initMediaDB();
  
  // Convert base64 to ArrayBuffer
  const byteString = atob(base64Data.split(',')[1] || base64Data);
  const mimeType = base64Data.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put({
      id,
      data: ab,
      type: mimeType,
      name: id,
      size: ab.byteLength,
    });
    
    request.onsuccess = () => resolve(`indexeddb://${id}`);
    request.onerror = () => reject(request.error);
  });
}

// Check if URL is external (not base64 or indexeddb)
export function isExternalUrl(url: string): boolean {
  return !url.startsWith('data:') && !url.startsWith('indexeddb://') && !url.startsWith('blob:');
}

// Migrate base64 images to IndexedDB (call on app start)
export async function migrateBase64Images(recipes: any[]): Promise<any[]> {
  const migrated = [...recipes];
  
  for (const recipe of migrated) {
    if (recipe.image?.startsWith('data:')) {
      try {
        const newId = `img-${recipe.id}`;
        const newUrl = await saveBase64Image(newId, recipe.image);
        recipe.image = newUrl;
      } catch (e) {
        console.error('Failed to migrate image for recipe', recipe.id);
      }
    }
  }
  
  return migrated;
}

// Compress image before saving (resize to max 1200px, quality 0.8)
export async function compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          console.log(`Compressed ${file.size} bytes -> ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`);
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    
    img.src = url;
  });
}

// Save compressed image
export async function saveCompressedImage(id: string, file: File): Promise<string> {
  const compressed = await compressImage(file);
  return saveMediaFile(id, compressed);
}

// Request persistent storage (increases quota significantly in Chrome)
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    const isPersistent = await navigator.storage.persist();
    console.log('Persistent storage:', isPersistent ? 'granted' : 'denied');
    return isPersistent;
  }
  return false;
}

// Get storage usage info
export async function getStorageInfo(): Promise<{ usage: number; quota: number; percent: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    return {
      usage,
      quota,
      percent: quota > 0 ? Math.round((usage / quota) * 100) : 0,
    };
  }
  return { usage: 0, quota: 0, percent: 0 };
}

// Check if using persistent storage
export async function isPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persisted) {
    return navigator.storage.persisted();
  }
  return false;
}
