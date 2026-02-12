export type RiskProfile = 'conservative' | 'moderate' | 'aggressive';
export type KycStatus = 'unverified' | 'verified';

export interface User {
  id: number;
  name: string;
  email: string;
  risk_profile: RiskProfile;
  kyc_status: KycStatus;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
