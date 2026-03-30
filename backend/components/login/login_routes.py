from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from components.core.database import get_db
from components.login.login_classes import LoginRequest, LoginResponse
from components.login.login_functions import perform_login

router = APIRouter(prefix="/login", tags=["login"])

@router.post("/", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    return perform_login(request, db)
