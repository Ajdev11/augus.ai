const API_BASE =
  (typeof window !== 'undefined' && window.location && window.location.port === '3000')
    ? 'http://localhost:4000'
    : '';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('augus_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}


