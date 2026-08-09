import os
from fastapi import Header, HTTPException, status

def get_internal_secret() -> str:
    secret = os.getenv("INTERNAL_API_SECRET")
    if not secret:
        # Fallback for local testing if env is not loaded, but warn
        return "your-shared-internal-api-secret-key"
    return secret

async def verify_internal_secret(
    x_internal_secret: str = Header(..., alias="X-Internal-Secret")
):
    """
    FastAPI security dependency enforcing internal API authentication.
    Rejects any request missing or having an invalid `X-Internal-Secret` header with a 401 Unauthorized response.
    """
    expected_secret = get_internal_secret()
    
    if not x_internal_secret or x_internal_secret != expected_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing X-Internal-Secret header",
        )
    return x_internal_secret
