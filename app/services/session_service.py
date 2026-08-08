from datetime import datetime, timezone
from typing import Optional
from app.crypto.memory import zero_buffer
from app.config import settings

class SessionService:
    def __init__(self):
        self._master_key_buf: Optional[bytearray] = None
        self.unlocked_at: Optional[str] = None
        self.auto_lock_minutes: int = settings.AUTO_LOCK_DEFAULT_MINUTES

    def set_master_key(self, key_bytes: bytes) -> None:
        self.lock_vault()  # Clear existing buffer if any
        self._master_key_buf = bytearray(key_bytes)
        self.unlocked_at = datetime.now(timezone.utc).isoformat()

    def get_master_key(self) -> Optional[bytes]:
        if self._master_key_buf is not None:
            return bytes(self._master_key_buf)
        return None

    def is_unlocked(self) -> bool:
        if self._master_key_buf is None:
            return False
        if self.auto_lock_minutes > 0 and self.unlocked_at:
            unlocked_time = datetime.fromisoformat(self.unlocked_at)
            now = datetime.now(timezone.utc)
            if (now - unlocked_time).total_seconds() > (self.auto_lock_minutes * 60):
                self.lock_vault()
                return False
        return True

    def lock_vault(self) -> None:
        if self._master_key_buf is not None:
            zero_buffer(self._master_key_buf)
            self._master_key_buf = None
        self.unlocked_at = None

session_service = SessionService()
