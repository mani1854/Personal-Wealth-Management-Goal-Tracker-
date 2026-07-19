import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, TrendingDown, Target, Briefcase, ArrowUpRight, ArrowDownRight,
  DollarSign, Activity, ChevronRight, Clock, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashboardSummary {
  net_worth: number;
  total_cost: number;
  total_return: number;
  return_pct: number;
  num_holdings: number;
  num_active_goals: number;
  total_goal_target: number;
  total_monthly_contrib: number;
  allocation: { symbol: string; value: number; pct: number }[];
  recent_transactions: {
    id: number;
    symbol: string;
    type: string;
    quantity: number;
    price: number;
    total: number;
    executed_at: string;
  }[];
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

const fmtCurrency = (v: number) =>
  v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

const StatCard = ({
  title, value, sub, icon: Icon, color, positive
}: {
  title: string; value: string; sub?: string; icon: any; color: string; positive?: boolean;
}) => (
  <div className="glass-card p-6 flex items-start gap-4 group hover:scale-[1.01] transition-transform">
    <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-gray-400 font-medium">{title}</p>
      <p className="text-2xl font-bold mt-1 truncate">{value}</p>
      {sub && (
        <p className={`text-xs mt-1 font-medium ${positive === undefined ? 'text-gray-400' : positive ? 'text-emerald-400' : 'text-red-400'}`}>
          {sub}
        </p>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSummary(res.data);
    } catch {
      setError('Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSummary();
  }, [token]);

  if (!user) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{greeting}, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-gray-400 mt-1">Here's your complete wealth overview.</p>
        </div>
        <button
          onClick={fetchSummary}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-dark-border hover:border-primary-500 px-4 py-2 rounded-lg transition-all w-fit"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-gray-400">
          <p>{error}</p>
        </div>
      ) : summary ? (
        <>
          {/* ── Hero Net-Worth Banner ───────────────────────── */}
          <div className="relative glass-card p-8 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-primary-500 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-blue-500 blur-3xl" />
            </div>

            <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Net Worth</p>
                <h2 className="text-5xl md:text-6xl font-black mt-2 bg-gradient-to-r from-white to-emerald-400 bg-clip-text text-transparent">
                  {fmtCurrency(summary.net_worth)}
                </h2>
                <div className={`flex items-center gap-2 mt-3 text-sm font-medium ${summary.total_return >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {summary.total_return >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {fmtCurrency(Math.abs(summary.total_return))} ({fmtPct(summary.return_pct)}) all time
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                <div className="text-center p-4 bg-dark-bg/50 rounded-xl border border-dark-border min-w-[100px]">
                  <p className="text-2xl font-bold">{summary.num_holdings}</p>
                  <p className="text-xs text-gray-400 mt-1">Holdings</p>
                </div>
                <div className="text-center p-4 bg-dark-bg/50 rounded-xl border border-dark-border min-w-[100px]">
                  <p className="text-2xl font-bold">{summary.num_active_goals}</p>
                  <p className="text-xs text-gray-400 mt-1">Active Goals</p>
                </div>
                <div className="text-center p-4 bg-dark-bg/50 rounded-xl border border-dark-border min-w-[100px]">
                  <p className="text-2xl font-bold">${(summary.total_monthly_contrib / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-gray-400 mt-1">Monthly Saving</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stat Cards ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Portfolio Value" value={fmtCurrency(summary.net_worth)}
              sub={`Cost basis: ${fmtCurrency(summary.total_cost)}`}
              icon={DollarSign} color="bg-emerald-500/20 text-emerald-400"
            />
            <StatCard
              title="Total Return" value={fmtCurrency(summary.total_return)}
              sub={fmtPct(summary.return_pct)}
              icon={summary.total_return >= 0 ? ArrowUpRight : ArrowDownRight}
              color={summary.total_return >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}
              positive={summary.total_return >= 0}
            />
            <StatCard
              title="Active Goals" value={`${summary.num_active_goals} Goals`}
              sub={`Target: ${fmtCurrency(summary.total_goal_target)}`}
              icon={Target} color="bg-purple-500/20 text-purple-400"
            />
            <StatCard
              title="Monthly Savings" value={fmtCurrency(summary.total_monthly_contrib)}
              sub="Across all goals"
              icon={Activity} color="bg-blue-500/20 text-blue-400"
            />
          </div>

          {/* ── Allocation Chart + Recent Transactions ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Allocation Pie */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Asset Allocation</h3>
                <Link to="/portfolio" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                  View Portfolio <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {summary.allocation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                  <Briefcase className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No holdings yet</p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full md:w-48 h-48 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summary.allocation}
                          dataKey="value"
                          nameKey="symbol"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {summary.allocation.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(value: number) => [fmtCurrency(value), '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    {summary.allocation.map((item, i) => (
                      <div key={item.symbol} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-sm font-medium">{item.symbol}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold">{fmtCurrency(item.value)}</span>
                          <span className="text-xs text-gray-400 ml-2">{item.pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Recent Transactions</h3>
                <Link to="/portfolio" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                  All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {summary.recent_transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.recent_transactions.map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-bg/50 border border-dark-border/50 hover:border-dark-border transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                          ${tx.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {tx.type === 'buy' ? '↑' : '↓'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{tx.symbol}</p>
                          <p className="text-xs text-gray-400 capitalize">{tx.type} · {tx.quantity} shares</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{fmtCurrency(tx.total)}</p>
                        <p className="text-xs text-gray-400">
                          {tx.executed_at ? new Date(tx.executed_at).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Quick Actions ────────────────────────────────── */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Log Transaction', to: '/portfolio', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400' },
                { label: 'Add Goal', to: '/goals', color: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-400' },
                { label: 'Run Simulation', to: '/simulations', color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400' },
                { label: 'Sync Market', to: '/portfolio', color: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400' },
              ].map(a => (
                <Link
                  key={a.label}
                  to={a.to}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border font-medium text-sm transition-all ${a.color}`}
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Dashboard;
