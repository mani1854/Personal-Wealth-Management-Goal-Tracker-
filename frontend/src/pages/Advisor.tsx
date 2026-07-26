import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Advisor: React.FC = () => {
  const { token } = useAuth();
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:8000/ai/insights', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsights(response.data.insights);
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.detail
        : null;
      setError(
        typeof detail === 'string'
          ? detail
          : 'Failed to fetch insights from AI Advisor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary-500/20 rounded-lg text-primary-400">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">AI Financial Advisor</h1>
        </div>
        <p className="text-gray-400">
          Get personalized financial insights based on your portfolio and goals.
        </p>
      </div>

      {!insights && !loading && (
        <div className="glass-card p-8 text-center space-y-4">
          <div className="text-5xl">🤖</div>
          <h3 className="text-xl font-semibold">Ready for a checkup?</h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Our AI will analyze your asset allocation, compare it against your risk profile,
            and review your progress towards your goals.
          </p>
          <button
            onClick={fetchInsights}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors"
          >
            Generate Insights
          </button>
        </div>
      )}

      {loading && (
        <div className="glass-card p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Analyzing your portfolio...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-200">
          {error}
        </div>
      )}

      {insights && !loading && (
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-dark-border pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💡</span>
              <h2 className="text-xl font-semibold">Advisor Report</h2>
            </div>
            <button
              onClick={fetchInsights}
              className="flex items-center gap-2 text-sm px-4 py-2 bg-dark-card hover:bg-dark-border border border-dark-border text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <div className="markdown-content text-gray-300">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default Advisor;
