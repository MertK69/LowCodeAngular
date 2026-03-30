from typing import Any
import urllib.request
import json

N8N_WEBHOOK_URL = "https://fast-automation.de/webhook/0d467980-64c6-45ed-9054-7f911ceaffcc"

def trigger_n8n_webhook(data: Any) -> None:
    if not N8N_WEBHOOK_URL:
        return
    try:
        # Convert SQLAlchemy object to dict if necessary
        payload = data
        if hasattr(data, "__dict__") and hasattr(data, "__table__"):
            payload = {c.name: getattr(data, c.name) for c in data.__table__.columns}
            
        req = urllib.request.Request(
            N8N_WEBHOOK_URL,
            data=json.dumps(payload, default=str).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            pass
    except Exception as e:
        print(f"Error triggering n8n webhook: {e}")
