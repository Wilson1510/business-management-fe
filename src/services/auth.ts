import { apiFetch } from './api'

export async function login(username: string, password: string): Promise<{ access: string, refresh: string }> {
  const response = await apiFetch('/api/auth/login/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ username, password }),
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}