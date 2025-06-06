import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import axios from 'axios';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  bonusPoints: number;
}

type Language = 'uk' | 'en';

const translations = {
  uk: {
    title: 'Керування користувачами',
    sidebar: {
      dashboard: 'Дашборд',
      inventory: 'Запаси',
      transactions: 'Історія видачі',
      reports: 'Звіти',
      IoTDevices: 'IoT-пристрої',
      logout: 'Вийти',
      pharmacies: 'Аптеки',
      users: 'Користувачі',
    },
    table: {
      id: 'ID',
      firstName: 'Ім’я',
      lastName: 'Прізвище',
      role: 'Роль',
      email: 'Електронна пошта',
      bonusPoints: 'Бонусні бали',
    },
    success: {
      fetched: 'Користувачів отримано успішно',
    },
    error: 'Помилка: {message}',
    noToken: 'Токен відсутній. Будь ласка, увійдіть знову.',
    language: 'Мова',
  },
  en: {
    title: 'User Management',
    sidebar: {
      dashboard: 'Dashboard',
      inventory: 'Inventory',
      transactions: 'Transaction History',
      reports: 'Reports',
      IoTDevices: 'IoTDevices',
      logout: 'Logout',
      pharmacies: 'Pharmacies',
      users: 'Users',
    },
    table: {
      id: 'ID',
      firstName: 'First Name',
      lastName: 'Last Name',
      role: 'Role',
      email: 'Email',
      bonusPoints: 'Bonus Points',
    },
    success: {
      fetched: 'Users fetched successfully',
    },
    error: 'Error: {message}',
    noToken: 'Token missing. Please log in again.',
    language: 'Language',
  },
};

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('language') as Language) || 'uk'
  );
  const navigate = useNavigate();
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t.noToken);
        navigate('/');
        return;
      }
      const res = await API.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setSuccess(t.success.fetched);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || 'Невідома помилка';
        setError(t.error.replace('{message}', message));
        if (err.response?.status === 403 || err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        }
      } else {
        setError(t.error.replace('{message}', 'Невідома помилка'));
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Pharmacy System</h2>
        <nav>
          <ul>
            <li className="mb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.dashboard}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/inventory')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.inventory}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/transactions')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.transactions}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/reports')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.reports}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/iot-devices')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.IoTDevices}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => navigate('/pharmacies')}
                className="w-full text-left py-2 px-4 hover:bg-blue-600 rounded"
              >
                {t.sidebar.pharmacies}
              </button>
            </li>
            <li className="mb-4">
              <button
                className="w-full text-left py-2 px-4 bg-blue-700 rounded hover:bg-blue-600"
              >
                {t.sidebar.users}
              </button>
            </li>
            <li className="mb-4">
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/');
                }}
                className="w-full text-left py-2 px-4 hover:bg-red-600 rounded"
              >
                {t.sidebar.logout}
              </button>
            </li>
          </ul>
        </nav>
        <div className="mt-6">
          <label className="block text-sm mb-2">{t.language}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="w-full bg-white text-gray-800 rounded px-2 py-1"
          >
            <option value="uk">Українська</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{t.title}</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 text-left">{t.table.id}</th>
                <th className="px-4 py-2 text-left">{t.table.firstName}</th>
                <th className="px-4 py-2 text-left">{t.table.lastName}</th>
                <th className="px-4 py-2 text-left">{t.table.role}</th>
                <th className="px-4 py-2 text-left">{t.table.email}</th>
                <th className="px-4 py-2 text-left">{t.table.bonusPoints}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{user._id}</td>
                  <td className="px-4 py-2">{user.firstName}</td>
                  <td className="px-4 py-2">{user.lastName}</td>
                  <td className="px-4 py-2">{user.role}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.bonusPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}