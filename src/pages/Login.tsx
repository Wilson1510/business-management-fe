import { LogIn, UserRound, KeyRound } from "lucide-react"
import { ErrorAlert } from "../components/ErrorAlert"
import { useState } from "react"
import { login } from "../services/auth"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../components/auth/AuthContext"
import { getDefaultAuthenticatedPath } from "../utils/authPaths"

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { loadUser } = useAuth()

  async function handleLogin(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await login(username, password)
      localStorage.setItem('access', response.access)
      localStorage.setItem('refresh', response.refresh)
      const profile = await loadUser()
      if (profile) {
        navigate(getDefaultAuthenticatedPath(profile.role))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
    finally {
      setIsLoading(false)
    }
  }
  
  return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim dark:bg-gray-900 relative overflow-hidden transition-colors">
        {/* Background Decorative Blob */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="w-full max-w-md p-8 relative z-10">
          <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 dark:border-gray-700 p-8 transition-colors">
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 text-primary mb-4">
                <LogIn size={32} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invensys ERP</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Sign in to manage your business</p>
            </div>

            {error && <ErrorAlert message={error} variant="login" />}

            <form onSubmit={handleLogin} className="space-y-5">
              <fieldset disabled={isLoading} className="min-w-0 border-0 p-0 m-0 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <UserRound size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
                      <KeyRound size={18} />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full pt-1 pb-1.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 ease-in-out disabled:opacity-70 flex items-center justify-center min-h-[44px] cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </button>
              </fieldset>
            </form>

          </div>
        </div>
      </div>
  )
}
