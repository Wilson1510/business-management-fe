const API_ORIGIN = import.meta.env.VITE_API_ORIGIN

export type CurrentUser = {
  id: number
  username: string
  email: string
  name: string
  role: string
  is_active: boolean
}

export async function fetchCurrentUser(accessToken: string): Promise<CurrentUser> {
  const response = await fetch(`${API_ORIGIN}/api/users/me/`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }
  return response.json()
}
