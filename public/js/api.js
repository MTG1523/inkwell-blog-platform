// ── API Client ──────────────────────────────────────────────
const BASE = '';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw { status: res.status, message: data.error || 'Request failed' };
  return data;
}

const api = {
  // Auth
  register: (body) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => apiFetch('/api/auth/me'),

  // Posts
  getPosts: () => apiFetch('/api/posts'),
  getPost: (id) => apiFetch(`/api/posts/${id}`),
  createPost: (body) => apiFetch('/api/posts', { method: 'POST', body: JSON.stringify(body) }),
  updatePost: (id, body) => apiFetch(`/api/posts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePost: (id) => apiFetch(`/api/posts/${id}`, { method: 'DELETE' }),

  // Comments
  getComments: (postId) => apiFetch(`/api/posts/${postId}/comments`),
  addComment: (postId, body) => apiFetch(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  deleteComment: (id) => apiFetch(`/api/comments/${id}`, { method: 'DELETE' }),
};

window.api = api;
