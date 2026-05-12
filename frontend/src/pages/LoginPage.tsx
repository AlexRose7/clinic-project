import { useState } from 'react';
import { api } from '../api/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      window.location.href = '/';
    } catch {
      alert('Ошибка входа');
    }
  };

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 400, margin: '4rem auto', padding: '2rem' }}>
      <h1>Вход</h1>
      <form onSubmit={handleSubmit}>
        <input value={email} onChange={e => setEmail(e.target.value)}
          type="email" placeholder="Email" required
          style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }} />
        <input value={password} onChange={e => setPassword(e.target.value)}
          type="password" placeholder="Пароль" required
          style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8 }} />
        <button type="submit" style={{ width: '100%', padding: 10, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Войти
        </button>
      </form>
    </main>
  );
}
