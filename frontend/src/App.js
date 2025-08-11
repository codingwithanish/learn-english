import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import Speak from './pages/Speak';
import SpeakDetail from './pages/SpeakDetail';
import Profile from './pages/Profile';
import TutorPortal from './pages/TutorPortal/TutorPortal';
import StudentDetail from './pages/TutorPortal/StudentDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/speak" element={
              <ProtectedRoute>
                <Speak />
              </ProtectedRoute>
            } />
            <Route path="/speak/:id" element={
              <ProtectedRoute>
                <SpeakDetail />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/tutor" element={
              <ProtectedRoute roles={['TUTOR', 'ADMIN']}>
                <TutorPortal />
              </ProtectedRoute>
            } />
            <Route path="/tutor/student/:id" element={
              <ProtectedRoute roles={['TUTOR', 'ADMIN']}>
                <StudentDetail />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;