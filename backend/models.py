from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Enum, JSON, Numeric
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone
from database import Base

class RiskProfileEnum(str, enum.Enum):
    conservative = "conservative"
    moderate = "moderate"
    aggressive = "aggressive"

class KYCStatusEnum(str, enum.Enum):
    unverified = "unverified"
    verified = "verified"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    risk_profile = Column(Enum(RiskProfileEnum), default=RiskProfileEnum.moderate)
    kyc_status = Column(Enum(KYCStatusEnum), default=KYCStatusEnum.unverified)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    goals = relationship("Goal", back_populates="user")
    investments = relationship("Investment", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")

class GoalTypeEnum(str, enum.Enum):
    retirement = "retirement"
    home = "home"
    education = "education"
    custom = "custom"

class GoalStatusEnum(str, enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    goal_type = Column(Enum(GoalTypeEnum), default=GoalTypeEnum.custom)
    target_amount = Column(Numeric(12, 2))
    target_date = Column(DateTime)
    monthly_contribution = Column(Numeric(12, 2))
    status = Column(Enum(GoalStatusEnum), default=GoalStatusEnum.active)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="goals")

class AssetTypeEnum(str, enum.Enum):
    stock = "stock"
    etf = "etf"
    mutual_fund = "mutual_fund"
    bond = "bond"
    cash = "cash"

class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    asset_type = Column(Enum(AssetTypeEnum), default=AssetTypeEnum.stock)
    symbol = Column(String(50), index=True)
    units = Column(Numeric(12, 4), default=0)
    avg_buy_price = Column(Numeric(12, 2), default=0)
    cost_basis = Column(Numeric(12, 2), default=0)
    current_value = Column(Numeric(12, 2), default=0)
    last_price = Column(Numeric(12, 2), default=0)
    last_price_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="investments")

class TransactionTypeEnum(str, enum.Enum):
    buy = "buy"
    sell = "sell"
    dividend = "dividend"
    contribution = "contribution"
    withdrawal = "withdrawal"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String(50), index=True)
    type = Column(Enum(TransactionTypeEnum))
    quantity = Column(Numeric(12, 4))
    price = Column(Numeric(12, 2))
    fees = Column(Numeric(12, 2), default=0)
    executed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="transactions")

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=True)
    scenario_name = Column(String(255))
    assumptions = Column(JSON)
    results = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
    goal = relationship("Goal")
