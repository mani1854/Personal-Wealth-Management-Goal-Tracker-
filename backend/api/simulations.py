from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/simulations", tags=["simulations"])

@router.post("/", response_model=schemas.SimulationResponse, status_code=status.HTTP_201_CREATED)
def create_simulation(sim_data: schemas.SimulationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Creates a new simulation based on assumptions.
    Assumptions should include:
    - initial_amount
    - monthly_contribution
    - expected_annual_return (e.g., 0.08 for 8%)
    - years
    """
    assumptions = sim_data.assumptions
    initial_amount = float(assumptions.get("initial_amount", 0))
    monthly_contribution = float(assumptions.get("monthly_contribution", 0))
    expected_annual_return = float(assumptions.get("expected_annual_return", 0.05))
    years = int(assumptions.get("years", 10))

    # Calculate compounded results (monthly compounding)
    monthly_rate = expected_annual_return / 12
    total_months = years * 12
    
    current_balance = initial_amount
    yearly_data = []

    for month in range(1, total_months + 1):
        current_balance = current_balance * (1 + monthly_rate) + monthly_contribution
        if month % 12 == 0:
            yearly_data.append({
                "year": month // 12,
                "projected_value": round(current_balance, 2)
            })

    results = {
        "final_value": round(current_balance, 2),
        "total_contributed": round(initial_amount + (monthly_contribution * total_months), 2),
        "yearly_projections": yearly_data
    }

    new_sim = models.Simulation(
        user_id=current_user.id,
        goal_id=sim_data.goal_id,
        scenario_name=sim_data.scenario_name,
        assumptions=assumptions,
        results=results
    )
    
    db.add(new_sim)
    db.commit()
    db.refresh(new_sim)
    return new_sim

@router.get("/", response_model=List[schemas.SimulationResponse])
def get_simulations(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Simulation).filter(models.Simulation.user_id == current_user.id).order_by(models.Simulation.created_at.desc()).all()
