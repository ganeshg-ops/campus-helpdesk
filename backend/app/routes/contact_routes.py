import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import StudentMessage, User, Ticket
from app.schemas import (
    StudentMessageCreate, StudentMessageResponse,
    StudentMessageStatusUpdate, StudentMessageReply
)
from app.auth import get_current_user, require_admin, require_staff_or_admin
from app.services.email_service import email_service

router = APIRouter(prefix="/api/contact", tags=["Student Contact & Admin Messages"])

@router.post("/email-admin", response_model=StudentMessageResponse)
def submit_contact_admin_request(
    data: StudentMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Student submits question to the college admin via email.
    Auto-fills student name and email from authenticated session.
    Persists the message in the database, sends the email through the backend,
    and returns confirmed delivery status or error details for retry.
    """
    student_name = current_user.full_name if current_user else (data.student_name or "Student")
    student_email = current_user.email if current_user else (data.student_email or "")

    if not student_email:
        raise HTTPException(status_code=400, detail="Student email is required.")

    # 1. First, persist the message to database so admin can view it even if delivery fails
    message_record = StudentMessage(
        student_id=current_user.id if current_user else None,
        student_name=student_name,
        student_email=student_email,
        question=data.question.strip(),
        message=data.message.strip() if data.message else None,
        chat_context=data.chat_context.strip() if data.chat_context else None,
        ticket_id=data.ticket_id,
        status="New",
        email_delivery_status="Pending",
        email_error=None
    )
    db.add(message_record)
    db.commit()
    db.refresh(message_record)

    # 2. Attempt email dispatch through configured server-side mailer
    ref_id = f"MSG-{message_record.id}"
    if data.ticket_id:
        t = db.query(Ticket).filter(Ticket.id == data.ticket_id).first()
        if t:
            ref_id = t.ticket_number

    delivery_result = email_service.send_student_message_to_admin(
        student_name=student_name,
        student_email=student_email,
        question=message_record.question,
        additional_message=message_record.message,
        chat_context=message_record.chat_context,
        submission_time=message_record.created_at,
        reference_id=ref_id
    )

    if delivery_result.get("success"):
        message_record.email_delivery_status = "Delivered"
        message_record.email_error = None
        db.commit()
        db.refresh(message_record)
        return message_record
    else:
        # Record failed delivery status in database
        error_msg = delivery_result.get("error", "Email dispatch service unreachable.")
        message_record.email_delivery_status = "Failed"
        message_record.email_error = error_msg
        db.commit()
        db.refresh(message_record)
        raise HTTPException(
            status_code=502,
            detail=f"Email dispatch failed: {error_msg}. Your request has been saved in the portal database. Please click retry."
        )

@router.get("/messages", response_model=List[StudentMessageResponse])
def get_student_messages(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to view all submitted student emails and messages.
    Supports filtering by status (New, In Progress, Resolved).
    """
    query = db.query(StudentMessage)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(StudentMessage.status.ilike(f"%{status_filter}%"))
    return query.order_by(StudentMessage.created_at.desc()).all()

@router.get("/my-messages", response_model=List[StudentMessageResponse])
def get_my_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Student endpoint to view their own submitted messages and admin replies.
    """
    return db.query(StudentMessage).filter(
        StudentMessage.student_id == current_user.id
    ).order_by(StudentMessage.created_at.desc()).all()

@router.get("/messages/{message_id}", response_model=StudentMessageResponse)
def get_message_detail(
    message_id: int,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to view full message details including AI chat context."""
    msg = db.query(StudentMessage).filter(StudentMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Student message not found.")
    return msg

@router.patch("/messages/{message_id}/status", response_model=StudentMessageResponse)
def update_message_status(
    message_id: int,
    update: StudentMessageStatusUpdate,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to update message status: New, In Progress, or Resolved."""
    valid_statuses = ["New", "In Progress", "Resolved"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    msg = db.query(StudentMessage).filter(StudentMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Student message not found.")

    msg.status = update.status
    db.commit()
    db.refresh(msg)
    return msg

@router.post("/messages/{message_id}/reply", response_model=StudentMessageResponse)
def reply_to_student_message(
    message_id: int,
    reply_data: StudentMessageReply,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to reply to a student message.
    Sends response email to student, updates status to Resolved, and persists reply in DB.
    """
    msg = db.query(StudentMessage).filter(StudentMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Student message not found.")

    # Send email reply to student
    delivery = email_service.send_admin_reply_to_student(
        student_name=msg.student_name,
        student_email=msg.student_email,
        original_question=msg.question,
        reply_message=reply_data.reply.strip(),
        admin_name=current_user.full_name or "Campus Helpdesk Administration"
    )

    if not delivery.get("success"):
        raise HTTPException(
            status_code=502,
            detail=f"Failed to send email reply to student: {delivery.get('error', 'Mail server error')}"
        )

    msg.admin_reply = reply_data.reply.strip()
    msg.replied_at = datetime.datetime.utcnow()
    msg.status = "Resolved"
    db.commit()
    db.refresh(msg)
    return msg

@router.post("/messages/{message_id}/retry-email", response_model=StudentMessageResponse)
def retry_failed_email(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retry sending email for a previously failed submission.
    """
    msg = db.query(StudentMessage).filter(StudentMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Student message not found.")

    if current_user.role == "student" and msg.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to message.")

    delivery_result = email_service.send_student_message_to_admin(
        student_name=msg.student_name,
        student_email=msg.student_email,
        question=msg.question,
        additional_message=msg.message,
        chat_context=msg.chat_context,
        submission_time=msg.created_at,
        reference_id=f"MSG-{msg.id}"
    )

    if delivery_result.get("success"):
        msg.email_delivery_status = "Delivered"
        msg.email_error = None
        db.commit()
        db.refresh(msg)
        return msg
    else:
        msg.email_delivery_status = "Failed"
        msg.email_error = delivery_result.get("error", "Email dispatch service unreachable.")
        db.commit()
        db.refresh(msg)
        raise HTTPException(status_code=502, detail=f"Retry failed: {msg.email_error}")

@router.delete("/messages/{message_id}")
def delete_student_message(
    message_id: int,
    current_user: User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Admin/Staff endpoint to delete a student message."""
    msg = db.query(StudentMessage).filter(StudentMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Student message not found.")
    db.delete(msg)
    db.commit()
    return {"success": True, "message": "Student message deleted successfully."}
