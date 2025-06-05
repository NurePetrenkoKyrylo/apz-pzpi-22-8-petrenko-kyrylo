import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pharmacies from './pages/Pharmacies';
import Users from './pages/Users';
import Inventory from './pages/Inventory';
import Transactions from './pages/Transactions';
import IoTDevices from './pages/IoTDevices';
import Reports from './pages/Reports';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/pharmacies" element={<Pharmacies />} />
        <Route path="/users" element={<Users />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/iot-devices" element={<IoTDevices />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/login" element={<Login />} /> {/* Add this route */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;