import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Add useNavigate
import API from '../services/api';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Add navigate hook

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.post('/user/login/', { email, password });
      const token = res.data.accessToken; // Use accessToken instead of token
      localStorage.setItem('token', token);
      navigate('/dashboard'); // Use navigate instead of window.location
    } catch (err) {
      setError('Невірний email або пароль');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <h2>Вхід</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button type="submit">Увійти</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}