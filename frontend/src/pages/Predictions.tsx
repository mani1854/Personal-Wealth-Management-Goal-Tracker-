import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { aiGet } from '../lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PredictionData {
  symbol: string;
  current_price: number;
  predicted_price: number;
  horizon_days: number;
  trend: 'bullish' | 'bearish';
  change_pct: number;
  confidence: number;
  daily_predictions: Array<{ day: number; price: number }>;
  model: string;
}

export default function Predictions() {
  const { token } = useAuth();
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<PredictionData | null>(null);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await aiGet<PredictionData>(`/ai/predict/${symbol.toUpperCase()}?days=7`, token);
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate prediction. Check the symbol.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = data ? [
    { day: 0, price: data.current_price },
    ...data.daily_predictions
  ] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Market Predictions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            AI-powered short-term price forecasting using Ridge Regression.
          </p>
        </div>
        
        <form onSubmit={handlePredict} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Enter stock symbol (e.g. AAPL)"
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-64"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !symbol}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Predict'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Price</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">${data.current_price.toFixed(2)}</p>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">7-Day Target</p>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">${data.predicted_price.toFixed(2)}</p>
                <span className={`flex items-center text-sm font-medium px-2 py-1 rounded-md ${
                  data.change_pct >= 0 
                    ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30' 
                    : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
                }`}>
                  {data.change_pct >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {Math.abs(data.change_pct)}%
                </span>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Trend Signal</p>
              <p className={`text-2xl font-bold mt-2 capitalize ${
                data.trend === 'bullish' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {data.trend}
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Model Confidence</p>
              <div className="flex items-center gap-3 mt-2">
                <Activity className="w-6 h-6 text-indigo-500" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.confidence}%</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">7-Day Trajectory Forecast ({data.model})</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    tickFormatter={(val) => val === 0 ? 'Today' : `Day ${val}`}
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `$${val}`}
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff' }}
                    itemStyle={{ color: '#818cf8' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    labelFormatter={(label) => label === 0 ? 'Today' : `Day ${label}`}
                  />
                  <ReferenceLine y={data.current_price} stroke="#6b7280" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#818cf8', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
