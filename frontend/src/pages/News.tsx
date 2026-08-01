import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiGet } from '../lib/api';
import ReactMarkdown from 'react-markdown';

interface Headline {
  title: string;
  symbol: string;
  publisher: string;
}

interface NewsData {
  summary: string;
  headlines: Headline[];
  portfolio_impact: string;
}

const sentimentIcon = (title: string) => {
  const lower = title.toLowerCase();
  const pos = ['surge', 'gain', 'rise', 'beat', 'growth', 'profit', 'bullish', 'upgrade', 'record'];
  const neg = ['fall', 'drop', 'loss', 'miss', 'decline', 'bearish', 'downgrade', 'crash', 'weak'];
  if (pos.some(w => lower.includes(w))) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (neg.some(w => lower.includes(w))) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

export default function News() {
  const { token } = useAuth();
  const [data, setData] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchNews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await aiGet<NewsData>('/ai/news', token);
      setData(res);
    } catch {
      setError('Failed to fetch market news. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Newspaper className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </span>
            Market News
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 ml-1">
            AI-summarized news with personalized portfolio impact analysis
          </p>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {data && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Summary */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🤖 AI Market Summary
            </h2>
            <div className="prose dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-gray-300">
              <ReactMarkdown>{data.summary}</ReactMarkdown>
            </div>
          </div>

          {/* Portfolio Impact */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-6">
            <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center gap-2">
              📊 Your Portfolio Impact
            </h2>
            <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{data.portfolio_impact}</p>
          </div>

          {/* Headlines */}
          <div className="md:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📰 Latest Headlines</h2>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.headlines.map((h, i) => (
                <div key={i} className="flex items-start gap-3 py-3 group">
                  <div className="mt-0.5">{sentimentIcon(h.title)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {h.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full font-mono">
                        {h.symbol}
                      </span>
                      <span className="text-xs text-gray-400">{h.publisher}</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
