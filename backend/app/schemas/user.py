from datetime import datetime
from pydantic import BaseModel, EmailStr

from app.models.user import KycStatus, RiskProfile


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    risk_profile: RiskProfile
    kyc_status: KycStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str
    risk_profile: RiskProfile
    kyc_status: KycStatus


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
