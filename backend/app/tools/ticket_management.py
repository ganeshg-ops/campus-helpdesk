import time
import json
import random
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import Ticket, TicketStatusHistory, User, ToolExecutionLog

def generate_ticket_number() -> str:
    rnd = random.randint(1000, 9999)
    return f"CHD-2026-{rnd}"

def create_support_ticket(
    user_id: int,
    subject: str,
    description: str,
    category: str,
    priority: str,
    db: Session,
    conversation_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Tool 2: Create a support ticket for college staff with persistence and history.
    """
    start_time = time.time()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"success": False, "error": "Invalid user ID"}

    # Assign to default staff member if available
    staff = db.query(User).filter(User.role == "staff").first()
    assigned_to = staff.id if staff else None

    ticket_num = generate_ticket_number()
    ticket = Ticket(
        ticket_number=ticket_num,
        user_id=user.id,
        subject=subject,
        description=description,
        category=category or "General",
        priority=priority or "Medium",
        status="Open",
        assigned_to_user_id=assigned_to
    )
    db.add(ticket)
    db.flush()

    # Add initial history entry
    hist = TicketStatusHistory(
        ticket_id=ticket.id,
        changed_by_user_id=user.id,
        old_status="None",
        new_status="Open",
        comment="Ticket submitted via Campus Helpdesk AI Agent."
    )
    db.add(hist)
    db.commit()

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    # Log tool execution
    try:
        log_entry = ToolExecutionLog(
            conversation_id=conversation_id,
            tool_name="create_support_ticket",
            input_data=json.dumps({"subject": subject, "category": category, "user_id": user_id}),
            output_data=json.dumps({"ticket_number": ticket_num, "ticket_id": ticket.id}),
            status="success",
            execution_time_ms=elapsed_ms
        )
        db.add(log_entry)
        db.commit()
    except Exception:
        db.rollback()

    return {
        "success": True,
        "ticket_id": ticket.id,
        "ticket_number": ticket.ticket_number,
        "subject": ticket.subject,
        "status": ticket.status,
        "category": ticket.category,
        "priority": ticket.priority,
        "assigned_to": staff.full_name if staff else "Unassigned",
        "created_at": ticket.created_at.isoformat()
    }

def get_ticket_with_auth(
    ticket_identifier: str,  # either id (int string) or ticket_number
    requesting_user: User,
    db: Session
) -> Dict[str, Any]:
    """
    Retrieve ticket enforcing strict authorization:
    - Students can ONLY view their own tickets.
    - Staff and Admin can view all tickets.
    """
    query = db.query(Ticket)
    if ticket_identifier.isdigit():
        ticket = query.filter((Ticket.id == int(ticket_identifier)) | (Ticket.ticket_number == ticket_identifier)).first()
    else:
        ticket = query.filter(Ticket.ticket_number == ticket_identifier).first()

    if not ticket:
        return {"success": False, "error": "Ticket not found", "status_code": 404}

    # Strict Authorization check
    if requesting_user.role == "student" and ticket.user_id != requesting_user.id:
        return {
            "success": False,
            "error": "Forbidden: You are not authorized to view another student's support ticket.",
            "status_code": 403
        }

    history_items = []
    for h in ticket.history:
        history_items.append({
            "id": h.id,
            "changed_by_name": h.changed_by.full_name if h.changed_by else "System",
            "old_status": h.old_status,
            "new_status": h.new_status,
            "comment": h.comment,
            "created_at": h.created_at.isoformat()
        })

    return {
        "success": True,
        "ticket": {
            "id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "subject": ticket.subject,
            "description": ticket.description,
            "category": ticket.category,
            "priority": ticket.priority,
            "status": ticket.status,
            "user_id": ticket.user_id,
            "creator_name": ticket.creator.full_name if ticket.creator else "Unknown",
            "assigned_to_user_id": ticket.assigned_to_user_id,
            "assignee_name": ticket.assignee.full_name if ticket.assignee else "Unassigned",
            "resolution_notes": ticket.resolution_notes,
            "created_at": ticket.created_at.isoformat(),
            "updated_at": ticket.updated_at.isoformat(),
            "history": history_items
        }
    }

def list_student_tickets(student_id: int, db: Session) -> List[Dict[str, Any]]:
    """List tickets belonging to a specific student."""
    tickets = db.query(Ticket).filter(Ticket.user_id == student_id).order_by(Ticket.created_at.desc()).all()
    results = []
    for t in tickets:
        results.append({
            "id": t.id,
            "ticket_number": t.ticket_number,
            "subject": t.subject,
            "category": t.category,
            "priority": t.priority,
            "status": t.status,
            "assignee_name": t.assignee.full_name if t.assignee else "Unassigned",
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat()
        })
    return results

def update_ticket_status(
    ticket_id: int,
    new_status: str,
    changed_by_user: User,
    comment: Optional[str],
    resolution_notes: Optional[str],
    assigned_to_id: Optional[int],
    db: Session
) -> Dict[str, Any]:
    """Authorized ticket updates with audit trail."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        return {"success": False, "error": "Ticket not found"}

    if changed_by_user.role not in ["staff", "admin"]:
        return {"success": False, "error": "Only authorized staff or administrators may update ticket status"}

    old_status = ticket.status
    ticket.status = new_status
    if resolution_notes:
        ticket.resolution_notes = resolution_notes
    if assigned_to_id is not None:
        ticket.assigned_to_user_id = assigned_to_id

    # Create history entry
    hist = TicketStatusHistory(
        ticket_id=ticket.id,
        changed_by_user_id=changed_by_user.id,
        old_status=old_status,
        new_status=new_status,
        comment=comment or f"Status updated to {new_status} by {changed_by_user.full_name}"
    )
    db.add(hist)
    db.commit()

    return {"success": True, "ticket_id": ticket.id, "new_status": new_status}
