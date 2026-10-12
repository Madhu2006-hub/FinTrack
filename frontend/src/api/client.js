import axios from 'axios';

export const TOKEN_KEY = 'fintrack.token';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let unauthorizedHandler = null;

/** AuthProvider registers a handler so an expired token logs the user out everywhere. */
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    // Login and register return 401 for bad credentials; only protected calls should log out.
    if (status === 401 && !url.startsWith('/api/auth/') && unauthorizedHandler) {
      unauthorizedHandler();
    }
    return Promise.reject(normalizeError(error));
  }
);

/** Converts any Axios failure into one shape that pages can display. */
export function normalizeError(error) {
  if (!error.response) {
    return {
      status: 0,
      message: 'Cannot reach the server. Check that the backend is running and try again.',
      fieldErrors: {},
    };
  }
  const data = error.response.data || {};
  return {
    status: error.response.status,
    message: data.message || 'Something went wrong. Please try again.',
    fieldErrors: data.fieldErrors || {},
  };
}
