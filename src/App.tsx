import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuth } from './components/auth/AuthContext';
import AppLayout from './components/layout/AppLayout';
import CatalogLayout from './components/layout/CatalogLayout';
import SalesLayout from './components/layout/SalesLayout';
import PurchasesLayout from './components/layout/PurchasesLayout';
import ContactsLayout from './components/layout/ContactsLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { StaffRouteGuard } from './components/auth/StaffRouteGuard';
import { AuthProvider } from './components/auth/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import ProductForm from './pages/ProductForm';
import Categories from './pages/Categories';
import Units from './pages/Units';
import SalesOrders from './pages/SalesOrders';
import SalesOrderForm from './pages/SalesOrderForm';
import Deliveries from './pages/Deliveries';
import DeliveryDetail from './pages/DeliveryDetail';
import PurchaseOrders from './pages/PurchaseOrders';
import PurchaseOrderForm from './pages/PurchaseOrderForm';
import Receipts from './pages/Receipts';
import ReceiptDetail from './pages/ReceiptDetail';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import UserForm from './pages/UserForm';
import ChangePassword from './pages/ChangePassword';
import { getDefaultAuthenticatedPath } from './utils/authPaths';
import ResetPassword from './pages/ResetPassword';

function RoleAwareHomeRedirect() {
  const { user } = useAuth()
  if (!user) return null
  return <Navigate to={getDefaultAuthenticatedPath(user.role)} replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<StaffRouteGuard />}>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<RoleAwareHomeRedirect />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="catalog" element={<CatalogLayout />}>
                <Route index element={<Catalog />} />
                <Route path="product/new" element={<ProductForm />} />
                <Route path="product/:id" element={<ProductForm />} />
                <Route path="categories" element={<Categories />} />
                <Route path="units" element={<Units />} />
              </Route>
              <Route path="sales" element={<SalesLayout />}>
                <Route index element={<SalesOrders />} />
                <Route path="new" element={<SalesOrderForm />} />
                <Route path=":id" element={<SalesOrderForm />} />
                <Route path="deliveries" element={<Deliveries />} />
                <Route path="deliveries/:id" element={<DeliveryDetail />} />
              </Route>
              <Route path="purchases" element={<PurchasesLayout />}>
                <Route index element={<PurchaseOrders />} />
                <Route path="new" element={<PurchaseOrderForm />} />
                <Route path=":id" element={<PurchaseOrderForm />} />
                <Route path="receipts" element={<Receipts />} />
                <Route path="receipts/:id" element={<ReceiptDetail />} />
              </Route>
              <Route path="contacts" element={<ContactsLayout />}>
                <Route index element={<Navigate to="customers" replace />} />
                <Route path="customers" element={<Customers />} />
                <Route path="suppliers" element={<Suppliers />} />
              </Route>

              <Route path="settings">
                <Route path="users">
                  <Route index element={<Users />} />
                  <Route path="new" element={<UserForm />} />
                  <Route path=":id" element={<UserForm />} />
                  <Route path=":id/password" element={<ResetPassword />} />
                </Route>
              </Route>

              <Route path="profile">
                <Route path="password" element={<ChangePassword />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
