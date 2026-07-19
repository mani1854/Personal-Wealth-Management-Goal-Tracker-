from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
from typing import Optional
from models import RiskProfileEnum, KYCStatusEnum

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    risk_profile: RiskProfileEnum
    kyc_status: KYCStatusEnum
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Goal Schemas ---
from models import GoalTypeEnum, GoalStatusEnum, AssetTypeEnum, TransactionTypeEnum
from decimal import Decimal

class GoalBase(BaseModel):
    goal_type: GoalTypeEnum
    target_amount: Decimal
    target_date: datetime
    monthly_contribution: Decimal
    status: GoalStatusEnum = GoalStatusEnum.active

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    goal_type: Optional[GoalTypeEnum] = None
    target_amount: Optional[Decimal] = None
    target_date: Optional[datetime] = None
    monthly_contribution: Optional[Decimal] = None
    status: Optional[GoalStatusEnum] = None

class GoalResponse(GoalBase):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Investment Schemas ---
class InvestmentBase(BaseModel):
    asset_type: AssetTypeEnum
    symbol: str
    units: Decimal
    avg_buy_price: Decimal
    cost_basis: Decimal
    current_value: Decimal
    last_price: Decimal
    last_price_at: Optional[datetime] = None

class InvestmentResponse(InvestmentBase):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    symbol: str
    type: TransactionTypeEnum
    quantity: Decimal
    price: Decimal
    fees: Decimal = 0

class TransactionCreate(TransactionBase):
    pass

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    executed_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Simulation Schemas ---
from typing import Dict, Any

class SimulationBase(BaseModel):
    goal_id: Optional[int] = None
    scenario_name: str
    assumptions: Dict[str, Any]

class SimulationCreate(SimulationBase):
    pass

class SimulationResponse(SimulationBase):
    id: int
    user_id: int
    results: Dict[str, Any]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
