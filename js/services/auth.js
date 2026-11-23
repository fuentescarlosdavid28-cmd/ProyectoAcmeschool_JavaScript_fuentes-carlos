import { getAll } from './storage.js';

const SESSION_KEY = 'acme_sesion';

export function login(email, password) {
  const user = getAll('usuarios').find(u =>
    u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
  );
  if (!user) return false;

  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, nombre: user.nombre, email: user.email }));
  return true;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}
