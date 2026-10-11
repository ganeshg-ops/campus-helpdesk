from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Ticket, FAQ, Document, User, TicketStatusHistory, StudentMessage, ConversationMessage, Conversation
from app.schemas import AdminStatsResponse, StudentListItem, StudentStatusUpdate, StudentCreateByAdmin, StudentPasswordReset
from app.auth import require_staff_or_admin, require_admin, hash_password

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

@router.post("/students", response_model=StudentListItem, status_code=status.HTTP_201_CREATED)
def create_student_account(
    student_data: StudentCreateByAdmin,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to provision a new authorized student login."""
    normalized_email = student_data.email.strip().lower()
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An account with email '{student_data.email}' already exists."
        )

    if student_data.student_id:
        existing_sid = db.query(User).filter(User.student_id == student_data.student_id.strip()).first()
        if existing_sid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student ID '{student_data.student_id}' is already registered."
            )

    new_student = User(
        email=normalized_email,
        full_name=student_data.full_name.strip(),
        role="student",
        student_id=student_data.student_id.strip() if student_data.student_id else None,
        department=student_data.department.strip() if student_data.department else "Computer Science & Engineering",
        phone=student_data.phone.strip() if student_data.phone else None,
        password_hash=hash_password(student_data.password.strip()),
        is_active=student_data.is_active
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "id": new_student.id,
        "full_name": new_student.full_name,
        "email": new_student.email,
        "role": new_student.role,
        "student_id": new_student.student_id,
        "department": new_student.department,
        "phone": new_student.phone,
        "is_active": new_student.is_active,
        "created_at": new_student.created_at,
        "ticket_count": 0
    }

@router.patch("/students/{student_id}")
def update_student_status(
    student_id: int,
    update_data: StudentStatusUpdate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to update student account active status, name, or department."""
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    if update_data.is_active is not None:
        student.is_active = update_data.is_active
    if update_data.department:
        student.department = update_data.department.strip()
    if update_data.full_name:
        student.full_name = update_data.full_name.strip()
    if update_data.student_id:
        student.student_id = update_data.student_id.strip()
    if update_data.phone is not None:
        student.phone = update_data.phone.strip() if update_data.phone else None

    db.commit()
    db.refresh(student)
    return {
        "success": True,
        "student_id": student.id,
        "is_active": student.is_active,
        "full_name": student.full_name,
        "department": student.department
    }

@router.post("/students/{student_id}/reset-password")
def reset_student_password(
    student_id: int,
    data: StudentPasswordReset,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to reset a student's login password."""
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    student.password_hash = hash_password(data.new_password.strip())
    db.commit()
    return {"success": True, "message": f"Password reset successfully for {student.full_name}."}

@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to delete a student account and remove their login access."""
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Cleanly remove dependent student records
    db.query(StudentMessage).filter(StudentMessage.student_id == student.id).delete(synchronize_session=False)

    convs = db.query(Conversation).filter(Conversation.user_id == student.id).all()
    for c in convs:
        db.query(ConversationMessage).filter(ConversationMessage.conversation_id == c.id).delete(synchronize_session=False)
        db.delete(c)

    tickets = db.query(Ticket).filter(Ticket.user_id == student.id).all()
    for t in tickets:
        db.query(TicketStatusHistory).filter(TicketStatusHistory.ticket_id == t.id).delete(synchronize_session=False)
        db.delete(t)

    db.delete(student)
    db.commit()
    return {"success": True, "message": f"Student account {student.email} deleted successfully."}

@router.get("/staff-members")
def get_staff_members(
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """List staff members for ticket assignment dropdown."""
    staff = db.query(User).filter(User.role.in_(["staff", "admin"])).all()
    return [{"id": s.id, "name": s.full_name, "email": s.email, "department": s.department} for s in staff]
