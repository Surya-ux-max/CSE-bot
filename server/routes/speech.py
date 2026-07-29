"""
routes/speech.py
Speech-to-Text dictation logging endpoint.
"""
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["Speech"])


class SpeechLogRequest(BaseModel):
    email: str
    converted_text: str
    audio_metadata: Optional[Dict[str, Any]] = None


@router.post("/speech/log")
def log_speech_text(payload: SpeechLogRequest):
    """Saves Speech-to-Text dictation logs inside the isolated user DB."""
    from db import get_user_db_session, SpeechLog
    from services.time_utils import get_ist_now, get_ist_str

    email_clean = payload.email.strip().lower()
    text = payload.converted_text.strip()

    if not email_clean or not text:
        raise HTTPException(status_code=400, detail="Both 'email' and 'converted_text' are required for speech logging.")

    ist_now = get_ist_now()
    ist_now_str = get_ist_str(ist_now)

    with get_user_db_session(email_clean) as db:
        log = SpeechLog(
            user_email=email_clean,
            converted_text=text,
            audio_metadata=payload.audio_metadata,
            created_at=ist_now,
            ist_date_time=ist_now_str
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return {"status": "success", "log_id": log.id}


@router.get("/speech/logs")
def get_speech_logs(email: str):
    """Retrieves Speech-to-Text dictation history for a user."""
    from db import get_user_db_session, SpeechLog

    email_clean = email.strip().lower()
    if not email_clean:
        raise HTTPException(status_code=400, detail="User email is required.")

    with get_user_db_session(email_clean) as db:
        logs = db.query(SpeechLog).order_by(SpeechLog.created_at.desc()).all()
        return [l.to_dict() for l in logs]
