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
  loadUser: () => Promise<CurrentUser | null>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  const logout = useCallback(function () {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    setUser(null)
  }, [])

  const syncSession = useCallback(
    async function (
      isCancelled: () => boolean,
      completeAuthReady: boolean,
    ): Promise<CurrentUser | null> {
      const alive = () => !isCancelled()

      try {
        const token = localStorage.getItem('access')
        if (!token) {
          if (alive()) setUser(null)
          return null
        }
        const profile = await fetchCurrentUser()
        if (alive()) setUser(profile)
        return alive() ? profile : null
      } catch {
        if (alive()) logout()
        return null
      } finally {
        if (completeAuthReady && alive()) setIsAuthReady(true)
      }
    },
    [logout],
  )

  const loadUser = useCallback(
    async function () {
      return await syncSession(() => false, false)
    },
    [syncSession],
  )

  useEffect(function () {
    let cancelled = false
    syncSession(() => cancelled, true)
    return function cleanup() {
      cancelled = true
    }
  }, [syncSession])

  const value = useMemo(
    function () {
      return { user, isAuthReady, loadUser, logout }
    },
    [user, isAuthReady, loadUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
