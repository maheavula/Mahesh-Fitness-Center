import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Navbar } from '../components/layout/Navbar.js';
import { Sidebar } from '../components/layout/Sidebar.js';
import { Footer } from '../components/layout/Footer.js';

export const AdminLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#e8ecf2] flex items-center justify-center text-sm font-semibold text-gray-600">
        Authenticating administrator session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#e8ecf2]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
};
