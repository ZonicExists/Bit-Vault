from fastapi import HTTPException, status
from app.services.session_service import session_service

def require_unlocked_vault() -> bytes:
    """
    FastAPI dependency that ensures vault is unlocked and returns the active master key.
    """
    master_key = session_service.get_master_key()
    if not master_key or not session_service.is_unlocked():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "VAULT_LOCKED",
                "message": "Vault is currently locked. Master password required."
            }
        )
    return master_key
