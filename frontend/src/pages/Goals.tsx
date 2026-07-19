import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface Goal {
  id: number;
  goal_name?: string;
  goal_type: string;
  target_amount: number;
  target_date: string;
  monthly_contribution: number;
  status: string;
}

const Goals = () => {
  const { token } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [goalName, setGoalName] = useState('');
  const [goalType, setGoalType] = useState('retirement');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContrib, setMonthlyContrib] = useState('');

  const fetchGoals = async () => {
    try {
      const res = await axios.get('http://localhost:8000/goals/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(res.data);
    } catch (err) {
      console.error("Failed to fetch goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchGoals();
  }, [token]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:8000/goals/', {
        goal_name: goalName || goalType,
        goal_type: goalType,
        target_amount: parseFloat(targetAmount),
        target_date: new Date(targetDate).toISOString(),
        monthly_contribution: parseFloat(monthlyContrib)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsModalOpen(false);
      setGoalName('');
      setGoalType('retirement');
      setTargetAmount('');
      setTargetDate('');
      setMonthlyContrib('');
      fetchGoals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create goal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Goals</h1>
          <p className="text-gray-400 mt-1">Track and manage your long-term wealth objectives.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary w-auto flex items-center gap-2 px-6 py-2.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Goal
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : goals.length === 0 ? (
        <div className="glass-card p-12 text-center border-dashed border-2 border-dark-border/50">
          <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No goals set yet</h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">Setting a goal is the first step towards financial freedom. Add your first goal to start tracking your progress.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary w-auto inline-block">Create Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {goals.map(goal => {
            const amt = parseFloat(String(goal.target_amount)) || 0;
            const contrib = parseFloat(String(goal.monthly_contribution)) || 0;
            // Mocking progress at 15% until live portfolio linkage is built
            const progress = 15;
            
            return (
              <div key={goal.id} className="glass-card p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-full -z-10 group-hover:bg-primary-500/10 transition-colors" />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded-full">
                      {goal.goal_type}
                    </span>
                    <h3 className="text-xl font-bold mt-2">{goal.goal_name || goal.goal_type}</h3>
                    <p className="text-2xl font-black text-white mt-1">${amt.toLocaleString()}</p>
                  </div>
                  <Target className="w-6 h-6 text-gray-400" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-medium text-white">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-dark-bg/80 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end pt-2 border-t border-dark-border/50">
                    <div>
                      <p className="text-xs text-gray-500">Target Date</p>
                      <p className="text-sm font-medium">{new Date(goal.target_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Monthly</p>
                      <p className="text-sm font-medium text-emerald-400">+${contrib.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Create Financial Goal</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Goal Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Dream Home, Retirement Fund"
                  value={goalName}
                  onChange={e => setGoalName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Goal Type</label>
                <select 
                  className="input-field appearance-none"
                  value={goalType}
                  onChange={e => setGoalType(e.target.value)}
                >
                  <option value="retirement">Retirement</option>
                  <option value="home">Home Purchase</option>
                  <option value="education">Education</option>
                  <option value="custom">Custom Goal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Target Amount ($)</label>
                <input
                  type="number"
                  required min="1" step="0.01"
                  className="input-field"
                  placeholder="1000000"
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Target Date</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Monthly Contribution ($)</label>
                <input
                  type="number"
                  required min="0" step="0.01"
                  className="input-field"
                  placeholder="500"
                  value={monthlyContrib}
                  onChange={e => setMonthlyContrib(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
