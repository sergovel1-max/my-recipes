const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';

// Получаем токен из localStorage
const getToken = () => localStorage.getItem('recipes-token');

// Базовый fetch с авторизацией
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };
  
  const res = await fetch(`${API_URL}${url}`, { ...options, headers });
  
  if (res.status === 401) {
    localStorage.removeItem('recipes-token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  
  return res.json();
};

// AUTH API
export const auth = {
  register: (email: string, password: string, name?: string) => 
    fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name })
    }),
    
  login: (email: string, password: string) => 
    fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
    
  me: () => fetchWithAuth('/api/auth/me'),
  
  logout: () => {
    localStorage.removeItem('recipes-token');
  },
  
  setToken: (token: string) => {
    localStorage.setItem('recipes-token', token);
  },
  
  isLoggedIn: () => !!getToken()
};

// RECIPES API
export const recipes = {
  getAll: () => fetchWithAuth('/api/recipes'),
  
  create: (data: any) => fetchWithAuth('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  update: (id: string, data: any) => fetchWithAuth(`/api/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (id: string) => fetchWithAuth(`/api/recipes/${id}`, {
    method: 'DELETE'
  }),
  
  reorder: (orders: { id: string, order: number }[]) => 
    fetchWithAuth('/api/recipes/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orders })
    })
};

// UPLOAD API (использует FormData, не JSON)
export const upload = {
  image: (file: File, onProgress?: (p: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const xhr = new XMLHttpRequest();
      const token = getToken();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          resolve(res.url);
        } else {
          reject(new Error('Upload failed'));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Upload error')));
      
      xhr.open('POST', `${API_URL}/api/upload-image`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  },
  
  video: (file: File, onProgress?: (p: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('video', file);
      
      const xhr = new XMLHttpRequest();
      const token = getToken();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.responseText);
          resolve(res.url);
        } else {
          reject(new Error('Upload failed'));
        }
      });
      
      xhr.addEventListener('error', () => reject(new Error('Upload error')));
      
      xhr.open('POST', `${API_URL}/api/upload-video`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }
};

export default { auth, recipes, upload };
