import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Target, Briefcase, LogOut, Wallet, Calculator, Lightbulb, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Portfolio', path: '/portfolio', icon: Briefcase },
    { name: 'Simulations', path: '/simulations', icon: Calculator },
    { name: 'AI Advisor', path: '/advisor', icon: Lightbulb },
    { name: 'Predictions', path: '/predictions', icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen bg-dark-bg text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-dark-border bg-dark-card flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
            <Wallet className="w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">WealthTracker</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-primary-500/10 text-primary-400 font-medium' 
                    : 'text-gray-400 hover:bg-dark-border/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-border">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase">
              {user?.name.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex w-full items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-dark-border bg-dark-card">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary-400" />
            <h1 className="font-bold text-lg">WealthTracker</h1>
          </div>
          <button onClick={logout} className="text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto border-b border-dark-border bg-dark-bg px-4 py-2 gap-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap rounded-lg text-sm ${
                  isActive ? 'bg-primary-500/10 text-primary-400' : 'text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-6 lg:p-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
