from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Ticket
from app.schemas import TicketCreate, TicketUpdate, TicketResponse
from app.auth import get_current_user, require_staff_or_admin
from app.tools.ticket_management import create_support_ticket, get_ticket_with_auth, update_ticket_status

router = APIRouter(prefix="/api/tickets", tags=["Support Tickets"])

@router.post("", response_model=TicketResponse)
def create_ticket(
    ticket_in: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new support ticket."""
    result = create_support_ticket(
        user_id=current_user.id,
        subject=ticket_in.subject,
        description=ticket_in.description,
        category=ticket_in.category,
        priority=ticket_in.priority,
        db=db
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    ticket_detail = get_ticket_with_auth(str(result["ticket_id"]), current_user, db)
    return ticket_detail["ticket"]

@router.get("", response_model=List[TicketResponse])
def get_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List tickets. If student, lists ONLY their tickets.
    If staff/admin, lists all tickets.
    """
    if current_user.role in ["staff", "admin"]:
        tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    else:
        tickets = db.query(Ticket).filter(Ticket.user_id == current_user.id).order_by(Ticket.created_at.desc()).all()

    formatted = []
    for t in tickets:
        ticket_detail = get_ticket_with_auth(str(t.id), current_user, db)
        if ticket_detail.get("success"):
            formatted.append(ticket_detail["ticket"])
    return formatted

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket_by_id(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve single ticket with strict authorization:
    Students can ONLY see their own ticket. Returns 403 otherwise.
    """
    result = get_ticket_with_auth(ticket_id, current_user, db)
    if not result.get("success"):
        code = result.get("status_code", 400)
        raise HTTPException(status_code=code, detail=result.get("error"))
    return result["ticket"]

@router.patch("/{ticket_id}")
def update_ticket(
    ticket_id: int,
    update_data: TicketUpdate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Update ticket status, assign officer, or add resolution notes (Staff/Admin only)."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    new_status = update_data.status or ticket.status
    result = update_ticket_status(
        ticket_id=ticket.id,
        new_status=new_status,
        changed_by_user=current_user,
        comment=update_data.comment,
        resolution_notes=update_data.resolution_notes,
        assigned_to_id=update_data.assigned_to_user_id,
        db=db
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error"))

    ticket_detail = get_ticket_with_auth(str(ticket.id), current_user, db)
    return ticket_detail["ticket"]

@router.delete("/{ticket_id}")
def delete_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a support ticket.
    Admins and staff can delete any ticket.
    Students can delete their own ticket.
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    if current_user.role not in ["staff", "admin"] and ticket.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this ticket.")

    # Remove history first
    from app.models import TicketStatusHistory
    db.query(TicketStatusHistory).filter(TicketStatusHistory.ticket_id == ticket.id).delete()
    db.delete(ticket)
    db.commit()
    return {"success": True, "message": "Ticket deleted successfully."}
