import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/customer/MenuPage';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ClientList from './pages/admin/ClientList';
import QrGenerator from './pages/admin/QrGenerator';
import Settings from './pages/admin/Settings';
import ClientForm from './pages/admin/ClientForm';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Menu Route */}
        <Route path="/menu/:slug" element={<MenuPage />} />
        
        {/* Super Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients/new/:step?" element={<ClientForm />} />
          <Route path="clients/:clientId/:step?" element={<ClientForm />} />
          <Route path="restaurants" element={<ClientList />} />
          <Route path="dhabas" element={<ClientList />} />
          <Route path="cafes" element={<ClientList />} />
          <Route path="qr" element={<QrGenerator />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback to a demo menu for now */}
        <Route path="*" element={<Navigate to="/menu/demo-dhaba" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
