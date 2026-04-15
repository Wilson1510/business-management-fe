/* eslint-disable react-refresh/only-export-components -- Provider + useAuth hook */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { fetchCurrentUser, type CurrentUser } from '../../services/users'

type AuthContextValue = {
  user: CurrentUser | null
  isAuthReady: boolean
  loadUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  const logout = useCallback(function() {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    setUser(null)
  }, [])

  const loadUser = useCallback(async function() {
    const token = localStorage.getItem('access')
    if (!token) {
      setUser(null)
      return
    }
    try {
      const profile = await fetchCurrentUser(token)
      setUser(profile)
    } catch {
      logout()
    }
  }, [logout])

  useEffect(function() {
    let cancelled = false;
    async function loadData() {
      const token = localStorage.getItem('access')
      if (!token) {
        if (!cancelled) {
          setUser(null)
          setIsAuthReady(true)
        }
        return
      }
      try {
        const profile = await fetchCurrentUser(token)
        if (!cancelled) setUser(profile)
      } catch {
        if (!cancelled) logout()
      } finally {
        if (!cancelled) setIsAuthReady(true)
      }
    }
    loadData();
    return function cleanup() {
      cancelled = true
    }
  }, [logout])

  const value = useMemo(function() {
    return { 
      user: user, 
      isAuthReady: isAuthReady, 
      loadUser: loadUser, 
      logout: logout 
    };
  }, [user, isAuthReady, loadUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
