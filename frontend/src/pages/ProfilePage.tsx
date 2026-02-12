import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { KycStatus, RiskProfile } from '../types/auth';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [riskProfile, setRiskProfile] = useState<RiskProfile>('moderate');
  const [kycStatus, setKycStatus] = useState<KycStatus>('unverified');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRiskProfile(user.risk_profile);
      setKycStatus(user.kyc_status);
    }
  }, [user]);

  const save = async () => {
    await api.put('/users/me', {
      name,
      risk_profile: riskProfile,
      kyc_status: kycStatus
    });
    await refreshProfile();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile & Risk Management</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-5">
          <h2 className="mb-3 text-lg font-semibold">User Profile Details</h2>
          <label className="mb-2 block text-sm text-slate-500">Full Name</label>
          <input className="mb-4 w-full rounded-lg border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="mb-2 block text-sm text-slate-500">Email</label>
          <input className="w-full rounded-lg border bg-slate-100 px-3 py-2" disabled value={user?.email ?? ''} />
        </div>

        <div className="rounded-xl border p-5">
          <h2 className="mb-3 text-lg font-semibold">Risk Profile Selection</h2>
          <div className="space-y-2">
            {(['conservative', 'moderate', 'aggressive'] as RiskProfile[]).map((value) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 capitalize">
                <input type="radio" checked={riskProfile === value} onChange={() => setRiskProfile(value)} />
                {value}
              </label>
            ))}
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm text-slate-500">KYC Status</p>
            <select className="w-full rounded-lg border px-3 py-2" value={kycStatus} onChange={(e) => setKycStatus(e.target.value as KycStatus)}>
              <option value="unverified">unverified</option>
              <option value="verified">verified</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={save} className="rounded-lg bg-brand-600 px-5 py-2 text-white hover:bg-brand-500">Save Changes</button>
      </div>
    </div>
  );
};

export default ProfilePage;
