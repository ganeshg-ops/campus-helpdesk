import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Student Portal Pages
import StudentDashboard from './pages/StudentDashboard';
import ChatPage from './pages/ChatPage';
import TicketsPage from './pages/TicketsPage';
import KnowledgePage from './pages/KnowledgePage';
import StudentProfilePage from './pages/StudentProfilePage';

// Admin Portal Pages
import AdminDashboard from './pages/AdminDashboard';
import StudentMessagesPage from './pages/StudentMessagesPage';
import AdminStudentsPage from './pages/AdminStudentsPage';
import EvaluationPage from './pages/EvaluationPage';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Gateway & Login Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/student/register" element={<StudentRegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Dedicated Protected Student Portal */}
          <Route
            path="/student"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="profile" element={<StudentProfilePage />} />
          </Route>

          {/* Dedicated Protected Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="messages" element={<StudentMessagesPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="knowledge-base" element={<KnowledgePage />} />
            <Route path="students" element={<AdminStudentsPage />} />
            <Route path="evaluation" element={<EvaluationPage />} />
          </Route>

          {/* Compatibility redirects */}
          <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
          <Route path="/chat" element={<Navigate to="/student/chat" replace />} />
          <Route path="/tickets" element={<Navigate to="/student/tickets" replace />} />
          <Route path="/knowledge" element={<Navigate to="/admin/knowledge-base" replace />} />
          <Route path="/evaluation" element={<Navigate to="/admin/evaluation" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
