import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('staffToken');
  if (!token) return <Navigate to="/staff/login" replace />;
  return children;
}
