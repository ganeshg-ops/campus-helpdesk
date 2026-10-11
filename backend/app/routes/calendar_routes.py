from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AcademicCalendarEvent, User
from app.schemas import CalendarEventResponse, CalendarEventCreate
from app.auth import require_admin

router = APIRouter(prefix="/api/calendar", tags=["Academic Calendar"])

@router.get("", response_model=List[CalendarEventResponse])
def get_calendar_events(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AcademicCalendarEvent)
    if category and category.lower() != "all":
        query = query.filter(AcademicCalendarEvent.category.ilike(f"%{category}%"))
    return query.order_by(AcademicCalendarEvent.start_date.asc()).all()

@router.post("", response_model=CalendarEventResponse)
def create_calendar_event(
    event_data: CalendarEventCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    new_event = AcademicCalendarEvent(**event_data.model_dump())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event
