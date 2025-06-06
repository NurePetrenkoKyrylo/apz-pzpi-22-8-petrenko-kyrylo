import React, { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: ReactElement;
}

export default function PrivateRoute({ children }: PrivateRouteProps): ReactElement {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" replace />;
}