export function isAuthenticated() {
  return !!localStorage.getItem('augus_token');
}

export function login(token) {
  localStorage.setItem('augus_token', token);
}

export function logout() {
  localStorage.removeItem('augus_token');
  localStorage.removeItem('augus_remember');
}


