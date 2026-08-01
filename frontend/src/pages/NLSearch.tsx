import React, { useState } from 'react';
import { Search, Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiPost } from '../lib/api';

interface SearchResult {
  query: string;
  matched_holdings: Array<{
    symbol: string;
    current_value: number;
    return_pct: number;
    pct: number;
    units: number;
    avg_buy_price: number;
    last_price: number;
  }>;
  summary: string;
  total_matched_value: number;
}

const exampleQueries = [
  'Show my tech stocks',
  'Which holdings are at a loss?',
  'What are my top performers?',
  'Show investments worth over ₹50,000',
];

export default function NLSearch() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<SearchResult | null>(null);

  const handleSearch = async (q?: string) => {
    const searchQ = q || query;
    if (!searchQ.trim()) return;
    if (q) setQuery(q);
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await aiPost<SearchResult>('/ai/search', token, { query: searchQ });
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Search className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </span>
          Natural Language Search
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 ml-1">
          Search your portfolio using plain English — no filters needed.
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-2 flex gap-2">
        <div className="flex-1 flex items-center gap-3 px-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. 'Show my losing stocks' or 'Which are my top 3 holdings?'"
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 text-sm py-2"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-40 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {/* Example Queries */}
      {!data && !loading && (
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSearch(q)}
                className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-full text-sm hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Summary */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Search: "{data.query}"</p>
            <p className="text-amber-900 dark:text-amber-200">{data.summary}</p>
            {data.total_matched_value > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
                Total matched value: <strong>₹{data.total_matched_value.toLocaleString()}</strong>
              </p>
            )}
          </div>

          {/* Results Table */}
          {(data.matched_holdings?.length ?? 0) > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Symbol</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Units</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Avg Buy</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Current</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Value</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Return</th>
                    <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-400">Portfolio %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.matched_holdings.map((h, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-gray-900 dark:text-white">{h.symbol}</td>
                      <td className="px-5 py-4 text-right text-gray-600 dark:text-gray-400">{h.units}</td>
                      <td className="px-5 py-4 text-right text-gray-600 dark:text-gray-400">₹{h.avg_buy_price?.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right text-gray-600 dark:text-gray-400">₹{h.last_price?.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900 dark:text-white">₹{h.current_value?.toLocaleString()}</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`flex items-center justify-end gap-1 font-semibold ${h.return_pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {h.return_pct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {h.return_pct?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-gray-500 dark:text-gray-400">{h.pct?.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No holdings matched your search query.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
