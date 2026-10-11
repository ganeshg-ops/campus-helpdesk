from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- Auth & User Schemas ---
class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "student"  # student, staff, admin
    student_id: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

class StudentRegister(BaseModel):
    email: str
    full_name: str
    password: str
    student_id: str
    department: str
    phone: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None

class StudentListItem(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    student_id: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    ticket_count: int = 0

    class Config:
        from_attributes = True

class StudentStatusUpdate(BaseModel):
    is_active: Optional[bool] = None
    department: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Chat & Agent Workflow Schemas ---
class SourceCitation(BaseModel):
    title: str
    category: str
    document: str
    excerpt: str
    page_number: Optional[int] = None
    relevance_score: Optional[float] = None
    is_verified: bool = True

class WorkflowStep(BaseModel):
    step_number: int
    agent: str
    action: str
    summary: str
    timestamp: str
    status: str = "completed"  # in_progress, completed, failed

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[int] = None
    category_filter: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    sources: List[SourceCitation] = []
    workflow_steps: List[WorkflowStep] = []
    category: str = "General"
    action_taken: str = "knowledge_search"
    ticket_created: Optional[bool] = False
    ticket_id: Optional[str] = None
    escalation_offered: bool = False
    answer_available: bool = True
    is_demo: bool = False

class MessageResponse(BaseModel):
    id: int
    sender: str
    content: str
    steps: Optional[List[WorkflowStep]] = None
    sources: Optional[List[SourceCitation]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


# --- Ticket Schemas ---
class TicketCreate(BaseModel):
    subject: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1, max_length=100)
    priority: str = Field(default="Medium")

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to_user_id: Optional[int] = None
    resolution_notes: Optional[str] = None
    comment: Optional[str] = None

class TicketHistoryResponse(BaseModel):
    id: int
    changed_by_name: str
    old_status: str
    new_status: str
    comment: Optional[str]
    created_at: datetime

class TicketResponse(BaseModel):
    id: int
    ticket_number: str
    subject: str
    description: str
    category: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
    user_id: int
    creator_name: str
    assigned_to_user_id: Optional[int] = None
    assignee_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    history: List[TicketHistoryResponse] = []

    class Config:
        from_attributes = True


# --- FAQ Schemas ---
class FAQCreate(BaseModel):
    question: str
    answer: str
    category: str
    source_document: str = "College Official Guidelines 2026"
    is_approved: bool = True

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    source_document: Optional[str] = None
    is_approved: Optional[bool] = None

class FAQResponse(BaseModel):
    id: int
    question: str
    answer: str
    category: str
    source_document: str
    is_approved: bool
    is_demo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Document Schemas ---
class DocumentResponse(BaseModel):
    id: int
    filename: str
    title: str
    description: Optional[str] = None
    category: str
    file_size: int
    page_count: int = 0
    ocr_needed: bool = False
    is_approved: bool
    status: str
    error_message: Optional[str] = None
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Student Messages (Email Admin) Schemas ---
class StudentMessageCreate(BaseModel):
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    question: str = Field(..., min_length=1)
    message: Optional[str] = None
    chat_context: Optional[str] = None
    ticket_id: Optional[int] = None

class StudentMessageStatusUpdate(BaseModel):
    status: str  # New, In Progress, Resolved

class StudentMessageReply(BaseModel):
    reply: str = Field(..., min_length=1)

class StudentMessageResponse(BaseModel):
    id: int
    student_id: Optional[int] = None
    student_name: str
    student_email: str
    question: str
    message: Optional[str] = None
    chat_context: Optional[str] = None
    ticket_id: Optional[int] = None
    status: str
    email_delivery_status: str
    email_error: Optional[str] = None
    admin_reply: Optional[str] = None
    replied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# --- Calendar Schemas ---
class CalendarEventCreate(BaseModel):
    title: str
    category: str
    start_date: str
    end_date: Optional[str] = None
    description: Optional[str] = None
    source: str = "Academic Calendar 2025-2026"
    is_verified: bool = True

class CalendarEventResponse(BaseModel):
    id: int
    title: str
    category: str
    start_date: str
    end_date: Optional[str]
    description: Optional[str]
    source: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Admin & Evaluation Schemas ---
class AdminStatsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    escalated_tickets: int
    resolved_tickets: int
    total_faqs: int
    approved_documents: int
    total_uploaded_pdfs: int
    recent_student_questions: List[str] = []
    student_emails_count: int = 0
    unanswered_questions_count: int = 0
    pdf_upload_status: List[dict[str, Any]] = []
    total_students: int
    tickets_by_category: dict[str, int]
    tickets_by_status: dict[str, int]
    recent_activity: List[dict[str, Any]]

class EvaluationScenarioResult(BaseModel):
    id: int
    scenario_name: str
    status: str  # PASS, FAIL
    expected_outcome: str
    actual_outcome: str
    details: Optional[str] = None
    timestamp: datetime
