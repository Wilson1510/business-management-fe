import { apiFetch } from './api'
import { handleCommonErrors } from '../utils/errorHandling'

export async function login(username: string, password: string): Promise<{ access: string, refresh: string }> {
  const response = await apiFetch('/api/auth/login/', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ username, password }),
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Username atau password salah')
    }
    await handleCommonErrors(response)
  }
  
  return await response.json()
}