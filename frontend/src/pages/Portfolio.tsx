import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, ArrowUpRight, ArrowDownRight, Briefcase, RefreshCw } from 'lucide-react';

interface Investment {
  id: number;
  symbol: string;
  asset_type: string;
  units: number;
  avg_buy_price: number;
  cost_basis: number;
  current_value: number;
  last_price: number;
}

const Portfolio = () => {
  const { token } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Transaction Form State
  const [type, setType] = useState('buy');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  const fetchInvestments = async () => {
    try {
      const res = await axios.get('http://localhost:8000/investments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvestments(res.data);
    } catch (err) {
      console.error("Failed to fetch investments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInvestments();
  }, [token]);

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/transactions', {
        type,
        symbol: symbol.toUpperCase(),
        quantity: parseFloat(quantity),
        price: parseFloat(price)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsModalOpen(false);
      setSymbol('');
      setQuantity('');
      setPrice('');
      fetchInvestments();
    } catch (err) {
      console.error(err);
      alert("Transaction failed. Check inputs or units available to sell.");
    }
  };

  const handleSyncMarket = async () => {
    setSyncing(true);
    try {
      await axios.post('http://localhost:8000/market/sync', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInvestments(); // refetch after sync
    } catch (err) {
      console.error("Failed to sync market");
      alert("Failed to sync market prices.");
    } finally {
      setSyncing(false);
    }
  };

  // Aggregates — safely parse to float to prevent NaN from Decimal strings
  const totalValue = investments.reduce((sum, inv) => sum + (parseFloat(String(inv.current_value)) || 0), 0);
  const totalCost  = investments.reduce((sum, inv) => sum + (parseFloat(String(inv.cost_basis))    || 0), 0);
  const totalReturn  = totalValue - totalCost;
  const returnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Investment Portfolio</h1>
          <p className="text-gray-400 mt-1">Manage your holdings and track performance.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSyncMarket}
            disabled={syncing}
            className="btn-secondary w-auto flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            {syncing ? (
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Briefcase className="w-4 h-4" />
            )}
            Sync Market
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary w-auto flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            Log Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <p className="text-sm font-medium text-gray-400">Total Balance</p>
          <h2 className="text-3xl font-bold mt-2">${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
        </div>
        <div className="glass-card p-6">
          <p className="text-sm font-medium text-gray-400">Total Cost Basis</p>
          <h2 className="text-3xl font-bold mt-2">${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h2>
        </div>
        <div className="glass-card p-6 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 ${totalReturn >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} />
          <p className="text-sm font-medium text-gray-400">Total Return</p>
          <div className="flex items-center gap-3 mt-2">
            <h2 className={`text-3xl font-bold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalReturn >= 0 ? '+' : ''}${totalReturn.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </h2>
            <div className={`flex items-center text-sm px-2 py-1 rounded-md ${totalReturn >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
              {totalReturn >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
              {Math.abs(returnPercent).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-dark-border flex justify-between items-center">
          <h3 className="text-lg font-bold">Your Holdings</h3>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>
        ) : investments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No investments found. Log a transaction to add an asset.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-bg/50 text-xs uppercase tracking-wider text-gray-400 border-b border-dark-border">
                  <th className="p-4 font-medium">Asset</th>
                  <th className="p-4 font-medium text-right">Units</th>
                  <th className="p-4 font-medium text-right">Avg Price</th>
                  <th className="p-4 font-medium text-right">Current Price</th>
                  <th className="p-4 font-medium text-right">Value</th>
                  <th className="p-4 font-medium text-right">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                    {investments.map(inv => {
                      const curVal  = parseFloat(String(inv.current_value)) || 0;
                      const cost    = parseFloat(String(inv.cost_basis))    || 0;
                      const units   = parseFloat(String(inv.units))         || 0;
                      const avgPrice= parseFloat(String(inv.avg_buy_price)) || 0;
                      const lastPx  = parseFloat(String(inv.last_price))    || 0;
                      const ret     = curVal - cost;
                      const retPct  = cost > 0 ? (ret / cost) * 100 : 0;
                      return (
                        <tr key={inv.id} className="hover:bg-dark-bg/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center font-bold text-blue-400 text-sm">
                                {inv.symbol.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold">{inv.symbol}</p>
                                <p className="text-xs text-gray-500 capitalize">{inv.asset_type}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-medium">{units.toLocaleString(undefined, {maximumFractionDigits:4})}</td>
                          <td className="p-4 text-right text-gray-300">${avgPrice.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                          <td className="p-4 text-right font-medium">${lastPx.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                          <td className="p-4 text-right font-bold">${curVal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                          <td className="p-4 text-right">
                            <div className={`inline-flex flex-col items-end ${ret >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              <span className="font-medium">{ret >= 0 ? '+' : ''}${ret.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                              <span className="text-xs">{ret >= 0 ? '+' : ''}{retPct.toFixed(2)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Log Transaction</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>

            <form onSubmit={handleTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <button 
                  type="button" 
                  onClick={() => setType('buy')}
                  className={`py-2 px-4 rounded-lg font-medium transition-all ${type === 'buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-dark-bg text-gray-400 border border-dark-border'}`}
                >Buy</button>
                <button 
                  type="button" 
                  onClick={() => setType('sell')}
                  className={`py-2 px-4 rounded-lg font-medium transition-all ${type === 'sell' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-dark-bg text-gray-400 border border-dark-border'}`}
                >Sell</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Asset Symbol</label>
                <input
                  type="text" required placeholder="AAPL"
                  className="input-field uppercase"
                  value={symbol} onChange={e => setSymbol(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Quantity</label>
                  <input
                    type="number" required min="0.0001" step="any" placeholder="10"
                    className="input-field"
                    value={quantity} onChange={e => setQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Price per share</label>
                  <input
                    type="number" required min="0.01" step="any" placeholder="150.00"
                    className="input-field"
                    value={price} onChange={e => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className={`btn-primary ${type === 'buy' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'}`}>
                  Confirm {type === 'buy' ? 'Purchase' : 'Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
