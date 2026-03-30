from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    username: Optional[str] = None
    role: Optional[str] = None
    message: Optional[str] = None
