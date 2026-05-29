// auth.js — Gestión de sesión con sessionStorage

const AUTH_KEY = 'nutrix_session';

/**
 * Guarda la sesión del nutriólogo en sessionStorage
 * @param {string} name — Nombre del nutriólogo
 */
export function login(name) {
  const session = {
    nutriologist: name.trim(),
    loginAt: new Date().toISOString(),
  };
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

/**
 * Cierra la sesión eliminando el registro de sessionStorage
 */
export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  window.location.href = '../index.html';
}

/**
 * Retorna el objeto de sesión o null si no existe
 * @returns {{ nutriologist: string, loginAt: string } | null}
 */
export function getSession() {
  const raw = sessionStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Verifica si hay sesión activa
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getSession() !== null;
}

/**
 * Guard: redirige al login si no hay sesión.
 * Llamar al inicio de cada página protegida.
 */
export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.replace('../index.html');
  }
}