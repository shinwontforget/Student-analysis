import os
import secrets
from fastapi import Header, HTTPException, status

def get_internal_secret() -> str:
    secret = os.getenv("INTERNAL_API_SECRET")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server configuration error: INTERNAL_API_SECRET is not configured",
        )
    return secret

async def verify_internal_secret(
    x_internal_secret: str = Header(None, alias="X-Internal-Secret")
):
    """
    FastAPI security dependency enforcing internal API authentication.
    Rejects any request missing or having an invalid `X-Internal-Secret` header with a 401 Unauthorized response.
    Uses constant-time comparison to prevent timing attacks.
    """
    if not x_internal_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing internal secret header",
        )

    expected_secret = get_internal_secret()
    
    if not secrets.compare_digest(x_internal_secret, expected_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing internal secret header",
        )
    return x_internal_secret
