from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from components.core.database import get_db
from components.application.application_models import Application, LogEntry
from components.application.application_functions import trigger_n8n_webhook
from typing import List, Any

router = APIRouter(prefix="/applications", tags=["applications"])

@router.get("/")
async def get_applications(db: Session = Depends(get_db)):
    return db.query(Application).options(joinedload(Application.logs)).all()

@router.get("/{application_id}")
async def get_application(application_id: int, db: Session = Depends(get_db)):
    app = db.query(Application).options(joinedload(Application.logs)).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

@router.post("/")
async def create_application(application_data: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Handle logs separately to link them
    logs_data = application_data.pop("logs", [])
    
    new_app = Application(**application_data)
    db.add(new_app)
    db.flush() 
    
    for log in logs_data:
        log.pop("recordId", None) 
        new_log = LogEntry(**log, recordId=new_app.id)
        db.add(new_log)
        
    db.commit()
    db.refresh(new_app)
    
    # Trigger n8n Webhook
    background_tasks.add_task(trigger_n8n_webhook, new_app)
    
    return new_app

@router.post("/bulk")
async def create_applications_bulk(applications_list: List[dict], background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        created_apps = []
        for app_data in applications_list:
            logs_data = app_data.pop("logs", [])
            new_app = Application(**app_data)
            db.add(new_app)
            db.flush() 
            
            if logs_data:
                for log in logs_data:
                    log.pop("recordId", None)
                    new_log = LogEntry(**log, recordId=new_app.id)
                    db.add(new_log)
            created_apps.append(new_app)
        
        db.commit()
        
        # Trigger webhook for each app (or you could send a summary)
        for app in created_apps:
            background_tasks.add_task(trigger_n8n_webhook, app)
            
        return {"status": "success", "count": len(applications_list)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{application_id}")
async def update_application(application_id: int, update_data: dict, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Handle logs if they are part of the update
    if "logs" in update_data:
        logs_data = update_data.pop("logs")
        db.query(LogEntry).filter(LogEntry.recordId == application_id).delete()
        for log in logs_data:
            log.pop("recordId", None) # Remove if exists to avoid TypeError
            new_log = LogEntry(**log, recordId=application_id)
            db.add(new_log)

    for key, value in update_data.items():
        setattr(app, key, value)
    
    db.commit()
    db.refresh(app)
    return app
