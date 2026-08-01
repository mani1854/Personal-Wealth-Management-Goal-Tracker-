import React, { useState } from 'react';
import { Target, IndianRupee, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiPost } from '../lib/api';
import ReactMarkdown from 'react-markdown';

interface GoalProjection {
  goal_type: string;
  goal_id: number;
  target_amount: number;
  monthly_contribution: number;
  completion_date: string;
  years_approx: number;
  achievement_probability: number;
}

interface RecommendData {
  income: number;
  expenses: number;
  disposable_income: number;
  recommended_monthly_investment: number;
  safe_max_monthly: number;
  suggested_per_goal: number;
  goal_projections: GoalProjection[];
  explanation: string;
}

export default function GoalRecommender() {
  const { token } = useAuth();
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<RecommendData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!income || !expenses) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await aiPost<RecommendData>('/ai/goals/recommend', token, {
        income: parseFloat(income),
        expenses: parseFloat(expenses),
      });
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const probColor = (p: number) =>
    p >= 75 ? 'text-green-600 dark:text-green-400' :
    p >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Target className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </span>
          Goal Recommender
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 ml-1">
          Enter your income & expenses to get AI-powered goal recommendations with achievement probabilities.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Financials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monthly Income (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={income}
                onChange={e => setIncome(e.target.value)}
                placeholder="e.g. 80000"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Monthly Expenses (₹)
            </label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={expenses}
                onChange={e => setExpenses(e.target.value)}
                placeholder="e.g. 45000"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Get Recommendations'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Disposable Income', value: `₹${data.disposable_income.toLocaleString()}` },
              { label: 'Recommended SIP', value: `₹${data.recommended_monthly_investment.toLocaleString()}` },
              { label: 'Safe Max Monthly', value: `₹${data.safe_max_monthly.toLocaleString()}` },
              { label: 'Per Goal SIP', value: `₹${data.suggested_per_goal.toLocaleString()}` },
            ].map((card, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {/* AI Explanation */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 p-6">
            <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> AI Recommendation
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-emerald-900 dark:text-emerald-200">
              <ReactMarkdown>{data.explanation}</ReactMarkdown>
            </div>
          </div>

          {/* Goal Projections */}
          {data.goal_projections.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Goal-by-Goal Projections</h2>
              <div className="space-y-4">
                {data.goal_projections.map((gp, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white capitalize">{gp.goal_type} Goal</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Target: ₹{gp.target_amount?.toLocaleString()} · SIP: ₹{gp.monthly_contribution?.toLocaleString()}/mo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{gp.completion_date ? `By ${gp.completion_date}` : `~${gp.years_approx} yrs`}</p>
                      <p className={`text-lg font-bold mt-0.5 ${probColor(gp.achievement_probability)}`}>
                        {gp.achievement_probability}% likely
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
