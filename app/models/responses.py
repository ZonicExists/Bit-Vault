from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None

def success_response(data: Any = None) -> dict:
    return {
        "success": True,
        "data": data
    }

def error_response(code: str, message: str, status_code: int = 400) -> dict:
    return {
        "success": False,
        "error": {
            "code": code,
            "message": message
        }
    }
