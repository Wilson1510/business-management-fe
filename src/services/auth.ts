const API_ORIGIN = import.meta.env.VITE_API_ORIGIN

export async function login(username: string, password: string): Promise<{ access: string, refresh: string }> {
    const response = await fetch(`${API_ORIGIN}/api/auth/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    if (!response.ok) {
        throw new Error(response.statusText)
    }
    return response.json()
}