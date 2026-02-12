import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch {
      setError('Registration failed. Try another email.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-600 via-slate-900 to-slate-950 px-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <h1 className="mb-1 text-2xl font-bold">Create Account</h1>
        <p className="mb-6 text-sm text-slate-500">Start tracking your portfolio and goals today.</p>
        {error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        <input placeholder="Full name" className="mb-4 w-full rounded-lg border px-3 py-2" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
        <input placeholder="Email" type="email" className="mb-4 w-full rounded-lg border px-3 py-2" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
        <input placeholder="Password" type="password" className="mb-6 w-full rounded-lg border px-3 py-2" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
        <button className="w-full rounded-lg bg-brand-600 py-2 font-medium text-white hover:bg-brand-500">Register</button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have account? <Link to="/login" className="text-brand-600">Login</Link>
        </p>
      </motion.form>
    </div>
  );
};

export default RegisterPage;
