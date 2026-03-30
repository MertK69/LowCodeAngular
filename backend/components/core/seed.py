from sqlalchemy.orm import Session
from components.core.database import SessionLocal, engine, Base
from components.login.login_models import User
from components.application.application_models import Application, LogEntry

def seed_db():
    Base.metadata.drop_all(bind=engine) # Start fresh
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Create customer user
    customer = User(
        username="kunde",
        password="password123", # In real apps use hashing!
        role="customer"
    )
    
    # Create employee admin user
    employee = User(
        username="mitarbeiter",
        password="adminpassword",
        role="employee"
    )
    
    db.add(customer)
    db.add(employee)
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_db()
    print("Database seeded successfully!")
