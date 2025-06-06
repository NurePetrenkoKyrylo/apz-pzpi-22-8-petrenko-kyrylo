import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type Language = 'uk' | 'en'; // Define allowed languages

const translations = {
  uk: {
    title: 'Вхід',
    email: 'Електронна пошта',
    password: 'Пароль',
    login: 'Увійти',
    error: 'Невірний email або пароль',
    language: 'Мова',
  },
  en: {
    title: 'Login',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    error: 'Invalid email or password',
    language: 'Language',
  },
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<Language>('uk'); // Use Language type
  const navigate = useNavigate();
  const t = translations[language];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/user/login/', {
        email,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const token = res.data.accessToken;
      localStorage.setItem('token', token);
      navigate('/dashboard');
    } catch (err) {
      setError(t.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{t.title}</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)} // Cast to Language
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="uk">Українська</option>
            <option value="en">English</option>
          </select>
        </div>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              {t.email}
            </label>
            <input
              type="email"
              id="email"
              placeholder={t.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              {t.password}
            </label>
            <input
              type="password"
              id="password"
              placeholder={t.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            {t.login}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;