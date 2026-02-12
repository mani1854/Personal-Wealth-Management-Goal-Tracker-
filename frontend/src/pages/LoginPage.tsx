import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-brand-600 to-slate-900 px-4">
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <h1 className="mb-1 text-2xl font-bold">Welcome Back</h1>
        <p className="mb-6 text-sm text-slate-500">Sign in to continue managing your wealth goals.</p>
        {error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <label className="mb-3 block text-sm">Email</label>
        <input className="mb-4 w-full rounded-lg border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <label className="mb-3 block text-sm">Password</label>
        <input className="mb-6 w-full rounded-lg border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-500">Login</button>
        <p className="mt-4 text-center text-sm text-slate-500">
          No account? <Link to="/register" className="text-brand-600">Create one</Link>
        </p>
      </motion.form>
    </div>
  );
};

export default LoginPage;
