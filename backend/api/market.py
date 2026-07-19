from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import yfinance as yf
import models, auth
from database import get_db
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market", tags=["market"])

def sync_market_prices(db: Session):
    """
    Background job or manual sync function to update all investment prices
    """
    investments = db.query(models.Investment).all()
    # Ensure symbols are clean and stripped of whitespace
    unique_symbols = list(set([inv.symbol.strip().upper() for inv in investments if inv.symbol]))
    
    if not unique_symbols:
        return {"status": "no investments to sync"}

    try:
        # Fetch data for all symbols at once
        tickers = yf.Tickers(" ".join(unique_symbols))
        
        updates_count = 0
        for inv in investments:
            try:
                symbol = inv.symbol.strip().upper()
                ticker = tickers.tickers.get(symbol)
                if ticker:
                    # Get the most recent price
                    history = ticker.history(period="1d")
                    if not history.empty:
                        last_price = float(history['Close'].iloc[-1])
                        inv.last_price = Decimal(str(last_price))
                        inv.current_value = inv.units * Decimal(str(last_price))
                        updates_count += 1
            except Exception as e:
                logger.error(f"Error syncing {inv.symbol}: {str(e)}")
                
        db.commit()
        return {"status": "success", "updated": updates_count}
    except Exception as e:
        logger.error(f"Market sync failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to sync market data")

@router.post("/sync")
def trigger_manual_sync(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Manually triggers the market sync. In a real app, this might be restricted to admins
    or we'd only sync the current user's portfolio. For this demo, it syncs all.
    """
    return sync_market_prices(db)
