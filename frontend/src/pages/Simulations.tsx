import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator } from 'lucide-react';

interface SimulationResult {
  id: number;
  scenario_name: string;
  assumptions: any;
  results: any;
  created_at: string;
}

const Simulations = () => {
  const { token } = useAuth();
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [scenarioName, setScenarioName] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [monthlyContrib, setMonthlyContrib] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('8');
  const [years, setYears] = useState('10');
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchSimulations = async () => {
    try {
      const res = await axios.get('http://localhost:8000/simulations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSimulations(res.data);
    } catch (err) {
      console.error("Failed to fetch simulations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSimulations();
  }, [token]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      await axios.post('http://localhost:8000/simulations/', {
        scenario_name: scenarioName || "Custom Projection",
        assumptions: {
          initial_amount: parseFloat(initialAmount || '0'),
          monthly_contribution: parseFloat(monthlyContrib || '0'),
          expected_annual_return: parseFloat(expectedReturn) / 100,
          years: parseInt(years)
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setScenarioName('');
      fetchSimulations();
    } catch (err) {
      console.error(err);
      alert("Simulation failed.");
    } finally {
      setIsSimulating(false);
    }
  };

  const latestSim = simulations[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">What-If Simulations</h1>
        <p className="text-gray-400 mt-1">Project your wealth growth based on compounding returns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Form */}
        <div className="glass-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-5 h-5 text-primary-400" />
            <h2 className="text-xl font-bold">New Projection</h2>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Scenario Name</label>
              <input type="text" className="input-field" placeholder="E.g., Aggressive Growth" value={scenarioName} onChange={e => setScenarioName(e.target.value)} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Initial Amount ($)</label>
              <input type="number" required min="0" className="input-field" value={initialAmount} onChange={e => setInitialAmount(e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Monthly Contribution ($)</label>
              <input type="number" required min="0" className="input-field" value={monthlyContrib} onChange={e => setMonthlyContrib(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Return Rate (%)</label>
                <input type="number" required step="0.1" className="input-field" value={expectedReturn} onChange={e => setExpectedReturn(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Years</label>
                <input type="number" required min="1" className="input-field" value={years} onChange={e => setYears(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={isSimulating} className="btn-primary mt-2">
              {isSimulating ? "Calculating..." : "Run Simulation"}
            </button>
          </form>
        </div>

        {/* Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="glass-card p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div></div>
          ) : latestSim ? (
            <div className="glass-card p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-emerald-400">{latestSim.scenario_name}</h3>
                  <p className="text-sm text-gray-400">Projected Final Value: <span className="text-white font-bold">${latestSim.results.final_value.toLocaleString()}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total Invested: <span className="text-white font-bold">${latestSim.results.total_contributed.toLocaleString()}</span></p>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latestSim.results.yearly_projections} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Yr ${val}`} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#10b981' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Projected']}
                      labelFormatter={(label) => `Year ${label}`}
                    />
                    <Line type="monotone" dataKey="projected_value" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center text-gray-400 h-full flex flex-col justify-center">
              <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No simulations run yet. Fill out the form to project your wealth.</p>
            </div>
          )}

          {/* History */}
          {simulations.length > 1 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold mb-4">Past Scenarios</h3>
              <div className="space-y-3">
                {simulations.slice(1).map(sim => (
                  <div key={sim.id} className="flex justify-between items-center p-3 rounded-lg bg-dark-bg/50 border border-dark-border">
                    <div>
                      <p className="font-medium text-sm">{sim.scenario_name}</p>
                      <p className="text-xs text-gray-400">{sim.assumptions.years} Yrs @ {(sim.assumptions.expected_annual_return * 100).toFixed(1)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">${sim.results.final_value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Simulations;
