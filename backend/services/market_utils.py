def normalize_symbol(symbol: str) -> str:
    """Normalize stock symbols for external APIs."""
    symbol = symbol.strip().upper()
    if symbol.endswith('.NS') or symbol.endswith('.BO'):
        return symbol
    # Add generic mapping logic if needed
    return symbol
