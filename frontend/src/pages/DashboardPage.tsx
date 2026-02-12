import { motion } from 'framer-motion';

const goals = [
  { name: 'Retirement Fund', current: 180000, target: 500000 },
  { name: 'Buy a Home', current: 75000, target: 200000 },
  { name: "Child's Education", current: 30000, target: 100000 }
];

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Your Goals</h1>
      <div className="grid gap-4 lg:grid-cols-3">
        {goals.map((goal, index) => {
          const progress = Math.round((goal.current / goal.target) * 100);
          return (
            <motion.div
              key={goal.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="rounded-xl border border-slate-200 p-5"
            >
              <h2 className="mb-2 text-xl font-semibold">{goal.name}</h2>
              <p className="text-3xl font-bold">${goal.current.toLocaleString()}</p>
              <p className="mb-3 text-slate-500">Target: ${goal.target.toLocaleString()}</p>
              <div className="h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-right text-sm text-slate-500">{progress}% achieved</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
