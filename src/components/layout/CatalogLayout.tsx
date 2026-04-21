import { Outlet, NavLink } from 'react-router-dom';
import { Package, Tags, Scale } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function CatalogLayout() {
  const { user } = useAuth();

  const tabs = [
    { name: 'Products', path: '/catalog', end: true, icon: Package },
    ...(user.role === 'admin' ? [
      { name: 'Categories', path: '/catalog/categories', end: false, icon: Tags },
      { name: 'Units', path: '/catalog/units', end: false, icon: Scale },
    ] : [])
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-6 flex items-center justify-between">
          <span>{user.role === 'admin' ? 'Catalog Hub' : 'Products'}</span>
        </h1>
        
        {tabs.length > 1 && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <NavLink
                    key={tab.name}
                    to={tab.path}
                    end={tab.end}
                    className={({ isActive }) =>
                      `group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`
                    }
                  >
                    <Icon size={18} />
                    {tab.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
