from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get the directory of the current file (backend/components/core/)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Move up to the backend directory
BACKEND_DIR = os.path.dirname(os.path.dirname(BASE_DIR))
# Database file path in backend/
DB_PATH = os.path.join(BACKEND_DIR, "sql_app.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
