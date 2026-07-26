import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export const api = axios.create({ baseURL: API_BASE });

export function authHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function aiGet<T>(path: string, token: string | null): Promise<T> {
  const res = await api.get(path, { headers: authHeaders(token) });
  return res.data;
}

export async function aiPost<T>(path: string, token: string | null, data?: unknown): Promise<T> {
  const res = await api.post(path, data, { headers: authHeaders(token) });
  return res.data;
}
