import { apiFetch } from './api'

export type CurrentUser = {
  id: number
  username: string
  email: string
  name: string
  role: string
  is_active: boolean
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await apiFetch('/api/users/me/')
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}
