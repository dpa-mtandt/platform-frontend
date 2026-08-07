import axios, { type InternalAxiosRequestConfig } from 'axios';

const ACCESS_KEY = 'mtandt_access';

let accessToken: string | null = localStorage.getItem(ACCESS_KEY);

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem(ACCESS_KEY, token);
  else localStorage.removeItem(ACCESS_KEY);
}

export function getAccessToken() {
  return accessToken;
}

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL + '/api/v1', withCredentials: true });

api.interceptors.request.use((cfg) => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});

// Single in-flight refresh shared across concurrent 401s.
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true });
    const token = (res.data?.data?.accessToken as string | undefined) ?? null;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { __retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    if (status === 401 && original && !original.__retry && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
      original.__retry = true;
      refreshing = refreshing ?? doRefresh();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  },
);
