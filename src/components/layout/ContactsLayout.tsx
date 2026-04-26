import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Users, Truck } from 'lucide-react';

export default function ContactsLayout() {
  const location = useLocation();
  const tabs = [
    { name: 'Customers', path: '/contacts/customers', end: false, icon: Users },
    { name: 'Suppliers', path: '/contacts/suppliers', end: false, icon: Truck },
  ];

  if (location.pathname === '/contacts' || location.pathname === '/contacts/') {
    return <Navigate to="/contacts/customers" replace />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">Contacts Hub</h1>
        
        <div className="border-b border-gray-200">
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
      </div>

      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
