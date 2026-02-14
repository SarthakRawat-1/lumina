from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from src.config.settings import settings

security = HTTPBearer()

class TokenData(BaseModel):
    user_id: Optional[str] = None


def decode_access_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return TokenData(user_id=user_id)
    except jwt.PyJWTError:
        return None


async def get_current_user(token: str = Depends(security)) -> TokenData:
    token_data = decode_access_token(token.credentials)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token_data