import React, { useState, useEffect } from 'react';
import { Briefcase, Loader2, Sparkles, ArrowRight, PieChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiGet } from '../lib/api';
import ReactMarkdown from 'react-markdown';

interface Recommendation {
  symbol: string;
  name: string;
  type: string;
  reason: string;
}

interface PortfolioRecData {
  current_holdings: string[];
  sector_allocation: Record<string, number>;
  recommendations: Recommendation[];
  explanation: string;
  method: string;
}

const typeColors: Record<string, string> = {
  etf: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  stock: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  mf: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export default function PortfolioRecommender() {
  const { token } = useAuth();
  const [data, setData] = useState<PortfolioRecData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await aiGet<PortfolioRecData>('/ai/recommendations/portfolio', token);
      setData(res);
    } catch {
      setError('Failed to fetch portfolio recommendations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecs(); }, []);

  const totalSectors = Object.values(data?.sector_allocation || {}).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Briefcase className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </span>
            Portfolio Recommender
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 ml-1">
            AI-powered stock & ETF suggestions based on your risk profile and current holdings.
          </p>
        </div>
        <button
          onClick={fetchRecs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="font-medium">Analyzing your portfolio...</span>
          </div>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Holdings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Current Holdings</h2>
              <div className="flex flex-wrap gap-2">
                {data.current_holdings.length > 0 ? data.current_holdings.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-mono font-medium">
                    {s}
                  </span>
                )) : <p className="text-sm text-gray-400">No holdings found.</p>}
              </div>
            </div>

            {/* Sector Allocation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-500" /> Sector Allocation
              </h2>
              <div className="space-y-2">
                {Object.entries(data.sector_allocation).map(([sector, pct], i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{sector}</span>
                      <span className="text-gray-500">{totalSectors > 0 ? ((pct / totalSectors) * 100).toFixed(0) : 0}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${totalSectors > 0 ? (pct / totalSectors) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Explanation */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 p-6">
              <h2 className="text-base font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Insight
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-purple-900 dark:text-purple-200">
                <ReactMarkdown>{data.explanation}</ReactMarkdown>
              </div>
              <p className="text-xs text-purple-400 dark:text-purple-500 mt-3">{data.method}</p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Suggested Additions</h2>
            <div className="space-y-3">
              {data.recommendations.map((rec, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:border-purple-200 dark:hover:border-purple-700 border border-transparent transition-colors">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">{rec.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white font-mono">{rec.symbol}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${typeColors[rec.type] || typeColors.stock}`}>
                        {rec.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{rec.name}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <ArrowRight className="w-4 h-4 text-purple-400" />
                    {rec.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
