import { Bell, LogOut, Settings, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Profile & Risk', to: '/profile' }
];

const AppLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-brand-600">
            <Wallet size={20} />
            <span className="text-lg font-semibold">Infosys Wealth Tracker</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <Bell size={18} />
            <Settings size={18} />
            <button onClick={logout} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1 text-sm">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl bg-white p-4 shadow-soft">
          <div className="mb-4 rounded-xl bg-brand-50 p-3">
            <p className="text-sm text-slate-500">Welcome back</p>
            <p className="font-semibold">{user?.name}</p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <motion.main
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl bg-white p-6 shadow-soft"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default AppLayout;
