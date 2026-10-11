from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Ticket, FAQ, Document, User, TicketStatusHistory, StudentMessage, ConversationMessage
from app.schemas import AdminStatsResponse, StudentListItem, StudentStatusUpdate
from app.auth import require_staff_or_admin, require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Portal Management"])

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_dashboard_stats(
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Aggregate metrics, PDF statuses, student emails, and distributions for admin dashboard."""
    total_tickets = db.query(Ticket).count()
    open_tickets = db.query(Ticket).filter(Ticket.status == "Open").count()
    in_progress_tickets = db.query(Ticket).filter(Ticket.status == "In Progress").count()
    escalated_tickets = db.query(Ticket).filter(Ticket.status == "Escalated").count()
    resolved_tickets = db.query(Ticket).filter(Ticket.status == "Resolved").count()

    total_faqs = db.query(FAQ).count()
    approved_documents = db.query(Document).filter(Document.is_approved == True).count()
    total_uploaded_pdfs = db.query(Document).filter(Document.filename.ilike("%.pdf")).count()
    total_students = db.query(User).filter(User.role == "student").count()

    # Student emails and messages
    student_emails_count = db.query(StudentMessage).count()
    unanswered_questions_count = db.query(StudentMessage).filter(StudentMessage.status == "New").count()

    # Recent student questions (from student emails and recent inquiries)
    recent_msgs = db.query(StudentMessage).order_by(StudentMessage.created_at.desc()).limit(5).all()
    recent_student_questions = [m.question for m in recent_msgs]
    if len(recent_student_questions) < 5:
        recent_chats = db.query(ConversationMessage).filter(ConversationMessage.sender == "user").order_by(ConversationMessage.created_at.desc()).limit(5 - len(recent_student_questions)).all()
        for c in recent_chats:
            if c.content not in recent_student_questions:
                recent_student_questions.append(c.content)

    # PDF upload statuses
    all_docs = db.query(Document).order_by(Document.created_at.desc()).limit(8).all()
    pdf_upload_status = [
        {
            "id": d.id,
            "title": d.title,
            "filename": d.filename,
            "status": d.status,
            "page_count": getattr(d, "page_count", 0) or 0,
            "chunk_count": d.chunk_count,
            "ocr_needed": getattr(d, "ocr_needed", False) or False,
            "created_at": d.created_at.isoformat() if d.created_at else ""
        }
        for d in all_docs
    ]

    # Category breakdown
    cat_counts = db.query(Ticket.category, func.count(Ticket.id)).group_by(Ticket.category).all()
    tickets_by_category = {cat: count for cat, count in cat_counts}

    # Status breakdown
    tickets_by_status = {
        "Open": open_tickets,
        "In Progress": in_progress_tickets,
        "Escalated": escalated_tickets,
        "Resolved": resolved_tickets
    }

    # Recent activity logs
    recent_history = db.query(TicketStatusHistory).order_by(TicketStatusHistory.created_at.desc()).limit(8).all()
    recent_activity = []
    for h in recent_history:
        recent_activity.append({
            "id": h.id,
            "ticket_number": h.ticket.ticket_number if h.ticket else f"T-{h.ticket_id}",
            "changed_by": h.changed_by.full_name if h.changed_by else "System",
            "old_status": h.old_status,
            "new_status": h.new_status,
            "comment": h.comment,
            "timestamp": h.created_at.isoformat()
        })

    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "in_progress_tickets": in_progress_tickets,
        "escalated_tickets": escalated_tickets,
        "resolved_tickets": resolved_tickets,
        "total_faqs": total_faqs,
        "approved_documents": approved_documents,
        "total_uploaded_pdfs": total_uploaded_pdfs,
        "recent_student_questions": recent_student_questions,
        "student_emails_count": student_emails_count,
        "unanswered_questions_count": unanswered_questions_count,
        "pdf_upload_status": pdf_upload_status,
        "total_students": total_students,
        "tickets_by_category": tickets_by_category,
        "tickets_by_status": tickets_by_status,
        "recent_activity": recent_activity
    }

@router.get("/students", response_model=List[StudentListItem])
def list_students(
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to list all registered students and their ticket statistics."""
    students = db.query(User).filter(User.role == "student").order_by(User.created_at.desc()).all()
    result = []
    for s in students:
        t_count = db.query(Ticket).filter(Ticket.user_id == s.id).count()
        result.append({
            "id": s.id,
            "full_name": s.full_name,
            "email": s.email,
            "role": s.role,
            "student_id": s.student_id,
            "department": s.department,
            "phone": getattr(s, "phone", None),
            "is_active": getattr(s, "is_active", True),
            "created_at": s.created_at,
            "ticket_count": t_count
        })
    return result

@router.patch("/students/{student_id}")
def update_student_status(
    student_id: int,
    update_data: StudentStatusUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to update student account active status or department."""
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    if update_data.is_active is not None:
        student.is_active = update_data.is_active
    if update_data.department:
        student.department = update_data.department

    db.commit()
    db.refresh(student)
    return {
        "success": True,
        "student_id": student.id,
        "is_active": student.is_active,
        "department": student.department
    }

@router.get("/staff-members")
def get_staff_members(
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """List staff members for ticket assignment dropdown."""
    staff = db.query(User).filter(User.role.in_(["staff", "admin"])).all()
    return [{"id": s.id, "name": s.full_name, "email": s.email, "department": s.department} for s in staff]
