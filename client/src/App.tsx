import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';

// Public Pages
import { LandingPage } from './pages/LandingPage.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { SignupPage } from './pages/auth/SignupPage.js';

// Member Pages
import { MemberLayout } from './layouts/MemberLayout.js';
import { MemberDashboard } from './pages/member/MemberDashboard.js';
import { MembershipPage } from './pages/member/MembershipPage.js';
import { ClassesPage } from './pages/member/ClassesPage.js';
import { MyBookingsPage } from './pages/member/MyBookingsPage.js';
import { AttendancePage } from './pages/member/AttendancePage.js';
import { FitnessActivityPage } from './pages/member/FitnessActivityPage.js';
import { TrainersPage } from './pages/member/TrainersPage.js';
import { ProfilePage } from './pages/member/ProfilePage.js';
import { SecurityPage } from './pages/member/SecurityPage.js';

// Admin Pages
import { AdminLayout } from './layouts/AdminLayout.js';
import { AdminDashboard } from './pages/admin/AdminDashboard.js';
import { AdminMembersPage } from './pages/admin/AdminMembersPage.js';
import { AdminMemberDetailPage } from './pages/admin/AdminMemberDetailPage.js';
import { AdminPlansPage } from './pages/admin/AdminPlansPage.js';
import { AdminTrainersPage } from './pages/admin/AdminTrainersPage.js';
import { AdminClassesPage } from './pages/admin/AdminClassesPage.js';
import { AdminBookingsPage } from './pages/admin/AdminBookingsPage.js';
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage.js';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage.js';
import { AdminAuditPage } from './pages/admin/AdminAuditPage.js';
import { AdminSystemPage } from './pages/admin/AdminSystemPage.js';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Member App Routes */}
          <Route path="/app" element={<MemberLayout />}>
            <Route index element={<MemberDashboard />} />
            <Route path="membership" element={<MembershipPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="classes/:id" element={<ClassesPage />} />
            <Route path="bookings" element={<MyBookingsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="activity" element={<FitnessActivityPage />} />
            <Route path="trainers" element={<TrainersPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="security" element={<SecurityPage />} />
          </Route>

          {/* Admin App Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<AdminMembersPage />} />
            <Route path="members/:id" element={<AdminMemberDetailPage />} />
            <Route path="plans" element={<AdminPlansPage />} />
            <Route path="trainers" element={<AdminTrainersPage />} />
            <Route path="classes" element={<AdminClassesPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="attendance" element={<AdminAttendancePage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
            <Route path="system" element={<AdminSystemPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
};
