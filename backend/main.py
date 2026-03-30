from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

# Add current directory and components to path to help with imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from components.login.login_routes import router as login_router
from components.application.application_routes import router as application_router
from components.core.database import engine, Base

# Import all models to ensure they are registered with Base.metadata
from components.login.login_models import User
from components.application.application_models import Application, LogEntry
try:
    from components.interest.interest_models import Base as InterestBase
except ImportError:
    pass

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MFLB Kredit API")

# Enable CORS for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(login_router)
app.include_router(application_router)

# Mocking other routers if they don't exist yet to avoid startup errors
try:
    from components.interest.interest_routes import router as interest_router
    app.include_router(interest_router)
except ImportError:
    pass

@app.get("/")
async def root():
    return {"message": "MFLB Kredit API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
