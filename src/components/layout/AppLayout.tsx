import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Package, X, Menu, Sun, Moon, KeyRound, LogOut, Users, ShoppingCart, Settings, ShoppingBag,
  LayoutDashboard, Box, Truck } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { readStoredThemeIsDark } from "../../theme";

function getNavItems(role: string) {
  if (role === 'staff') {
    return [
      { name: 'Products', path: '/catalog', icon: Package },
      { name: 'Deliveries', path: '/sales/deliveries', icon: Truck },
      { name: 'Receipts', path: '/purchases/receipts', icon: Box },
    ]
  }

  return [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Catalog', path: '/catalog', icon: Package },
    { name: 'Sales', path: '/sales', icon: ShoppingCart },
    { name: 'Purchases', path: '/purchases', icon: ShoppingBag },
    { name: 'Contacts', path: '/contacts', icon: Users },
    { name: 'System Users', path: '/settings/users', icon: Settings },
  ]
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(readStoredThemeIsDark)
  
  useEffect(function() {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode])

  const visibleNavs = useMemo(function() {
    if (!user) return []
    return getNavItems(user.role)
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dim dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-surface-dim dark:bg-gray-900 transition-colors duration-300 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300" 
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-30 shadow-2xl lg:shadow-sm transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Package size={24} />
            Invensys
          </div>
          {/* Mobile close button inside sidebar */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {visibleNavs.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-primary dark:text-blue-400' : 'text-gray-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-auto flex flex-col relative w-full bg-surface-dim dark:bg-gray-900 transition-colors duration-300">
        
        {/* Top Navbar */}
        <div className="h-[72px] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10 transition-colors duration-300 shadow-sm">
          <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
             {/* Mobile Hamburger */}
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
             >
               <Menu size={24} />
             </button>
             <span className="text-lg font-medium hidden sm:block">Overview</span>
          </div>

          <div className="flex items-center gap-6">
             {/* Dark Mode Toggle */}
             <button 
               onClick={() => setIsDarkMode(!isDarkMode)}
               className="p-2 text-gray-400 hover:text-amber-500 dark:hover:text-blue-400 bg-gray-50 dark:bg-gray-700 hover:bg-amber-50 dark:hover:bg-gray-600 rounded-full transition-all"
             >
               {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             {/* Vertical divider */}
             <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />

             {/* User Profile */}
             <div className="flex items-center gap-3 group relative cursor-pointer">
               <div className="text-right">
                 <p className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 font-bold flex items-center justify-center uppercase">
                 {user.name.charAt(0)}
               </div>

               {/* Dropdown Menu (Hover) */}
               <div className="absolute top-full right-0 pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0">
                <div className="w-56 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-2">
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{user.role} Account</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Settings and preferences</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsSidebarOpen(false);
                      navigate('/profile/password');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <KeyRound size={16} />
                    Change Password
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer mt-1"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
             </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
