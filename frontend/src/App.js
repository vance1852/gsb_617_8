import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import ShortUrls from './pages/ShortUrls';
import Stats from './pages/Stats';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="shorturls" element={<ShortUrls />} />
        <Route path="stats/:id" element={<Stats />} />
      </Route>
    </Routes>
  );
}

export default App;
