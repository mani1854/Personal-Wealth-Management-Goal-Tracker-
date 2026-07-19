from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
import models, schemas, auth
from database import get_db

router = APIRouter(tags=["investments"])

@router.post("/transactions", response_model=schemas.TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # 1. Record Transaction
    new_tx = models.Transaction(**transaction.model_dump(), user_id=current_user.id)
    db.add(new_tx)

    # 2. Update Investment Position
    # For simplicity, if it's a 'buy' we add to units, 'sell' we subtract.
    symbol_upper = transaction.symbol.upper()
    investment = db.query(models.Investment).filter(
        models.Investment.user_id == current_user.id,
        models.Investment.symbol == symbol_upper
    ).first()

    if transaction.type == models.TransactionTypeEnum.buy:
        if not investment:
            # Determine asset type simply based on symbol length/pattern or default to stock
            # (In reality, we'd lookup the ticker to find the type)
            investment = models.Investment(
                user_id=current_user.id,
                symbol=symbol_upper,
                asset_type=models.AssetTypeEnum.stock,
                units=transaction.quantity,
                avg_buy_price=transaction.price,
                cost_basis=transaction.price * transaction.quantity,
                current_value=transaction.price * transaction.quantity,
                last_price=transaction.price
            )
            db.add(investment)
        else:
            total_cost = (investment.avg_buy_price * investment.units) + (transaction.price * transaction.quantity)
            investment.units += transaction.quantity
            investment.avg_buy_price = total_cost / investment.units if investment.units > 0 else 0
            investment.cost_basis += transaction.price * transaction.quantity
            investment.last_price = transaction.price
            investment.current_value = investment.units * investment.last_price

    elif transaction.type == models.TransactionTypeEnum.sell:
        if not investment or investment.units < transaction.quantity:
            raise HTTPException(status_code=400, detail="Not enough units to sell")
        
        investment.units -= transaction.quantity
        # Cost basis proportionally reduced
        investment.cost_basis -= investment.avg_buy_price * transaction.quantity
        investment.last_price = transaction.price
        investment.current_value = investment.units * investment.last_price
        
        if investment.units <= 0:
            db.delete(investment)

    db.commit()
    db.refresh(new_tx)
    return new_tx

@router.get("/investments", response_model=List[schemas.InvestmentResponse])
def get_investments(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Investment).filter(models.Investment.user_id == current_user.id).all()

@router.get("/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id).order_by(models.Transaction.executed_at.desc()).all()
