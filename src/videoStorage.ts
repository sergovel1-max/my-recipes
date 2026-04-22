const DB_NAME = 'CulinaryBlogVideos';
const DB_VERSION = 1;
const STORE_NAME = 'videos';

let db: IDBDatabase | null = null;

export async function initVideoDB(): Promise<void> {
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

// Chunk size: 5MB chunks to avoid blocking UI
const CHUNK_SIZE = 5 * 1024 * 1024;

export async function saveVideo(
  id: string, 
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> {
  if (!db) await initVideoDB();
  
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
        
        // Report progress
        const progress = Math.round((currentChunk / totalChunks) * 100);
        onProgress?.(progress);
        
        if (currentChunk < totalChunks) {
          // Yield to event loop to prevent UI blocking
          setTimeout(readNextChunk, 0);
        } else {
          // All chunks read, combine and save
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
            chunks: totalChunks,
          });
          
          request.onsuccess = () => resolve(`indexeddb://${id}`);
          request.onerror = () => reject(request.error);
        }
      };
      
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(chunk);
    }
    
    // Start reading first chunk
    setTimeout(readNextChunk, 0);
  });
}

export async function getVideo(id: string): Promise<string | null> {
  if (!db) await initVideoDB();
  if (!id.startsWith('indexeddb://')) return id; // External URL
  
  const videoId = id.replace('indexeddb://', '');
  
  return new Promise((resolve, reject) => {
    try {
      const transaction = db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(videoId);
      
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

export async function deleteVideo(id: string): Promise<void> {
  if (!db) await initVideoDB();
  if (!id.startsWith('indexeddb://')) return;
  
  const videoId = id.replace('indexeddb://', '');
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(videoId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllVideos(): Promise<void> {
  if (!db) await initVideoDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
