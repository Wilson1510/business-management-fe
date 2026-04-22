import { apiFetch } from './api'

export async function login(username: string, password: string): Promise<{ access: string, refresh: string }> {
  try {
    const response = await apiFetch('/api/auth/login/', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ username, password }),
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Username atau password salah')
      }
      
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } catch {
        // Ignored if response is not JSON
      }
      throw new Error(errorMessage || 'Terjadi kesalahan pada server')
    }
    
    return await response.json()
  } catch (error) {
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Tidak dapat terhubung ke server. Silahkan coba lagi nanti'
      )
    }
    throw error
  }
}