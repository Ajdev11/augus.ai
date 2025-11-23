const API_BASE =
  (typeof window !== 'undefined' && window.location && window.location.port === '3000')
    ? 'http://localhost:4000'
    : '';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('augus_token');
  const method = (options.method || 'GET').toUpperCase();
  const baseHeaders = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const headers =
    method === 'GET' || method === 'HEAD'
      ? baseHeaders
      : { 'Content-Type': 'application/json', ...baseHeaders };

  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, { ...options, method, headers, mode: 'cors' });
  } catch (e) {
    throw new Error('Network error: failed to reach API');
  }
  let json = {};
  try {
    json = await res.json();
  } catch {
    // ignore non-JSON
  }
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}


