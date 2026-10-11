import time
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import AcademicCalendarEvent, ToolExecutionLog

def lookup_academic_calendar(
    query: str,
    db: Session,
    conversation_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Tool 3: Real Academic Calendar Lookup.
    Retrieves official examination, registration, and holiday dates.
    Strictly reports verified calendar events; NEVER invents dates.
    """
    start_time = time.time()
    query_str = (query or "").strip().lower()

    if not query_str:
        return {
            "success": False,
            "error": "Query cannot be empty",
            "events": [],
            "count": 0
        }

    events = db.query(AcademicCalendarEvent).all()
    matched = []

    keywords = query_str.split()
    for ev in events:
        text = f"{ev.title} {ev.category} {ev.description or ''}".lower()
        if any(kw in text for kw in keywords if len(kw) > 2):
            matched.append({
                "id": ev.id,
                "title": ev.title,
                "category": ev.category,
                "start_date": ev.start_date,
                "end_date": ev.end_date,
                "description": ev.description,
                "source": ev.source,
                "is_verified": ev.is_verified
            })

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    # Log tool execution
    try:
        log_entry = ToolExecutionLog(
            conversation_id=conversation_id,
            tool_name="academic_calendar_lookup",
            input_data=json.dumps({"query": query_str}),
            output_data=json.dumps({"matched_events_count": len(matched)}),
            status="success" if matched else "not_found",
            execution_time_ms=elapsed_ms
        )
        db.add(log_entry)
        db.commit()
    except Exception:
        db.rollback()

    return {
        "success": True,
        "query": query_str,
        "count": len(matched),
        "execution_time_ms": elapsed_ms,
        "events": matched
    }
