from components.login.login_classes import LoginRequest, LoginResponse
from sqlalchemy.orm import Session
from components.login.login_models import User

def perform_login(request: LoginRequest, db: Session) -> LoginResponse:
    user = db.query(User).filter(User.username == request.username).first()
    
    if user and user.password == request.password:
        return LoginResponse(
            success=True,
            username=user.username,
            role=user.role,
            message=f"Login erfolgreich als {user.role}"
        )
    
    return LoginResponse(
        success=False,
        message="Ungültiger Benutzername oder Passwort"
    )
