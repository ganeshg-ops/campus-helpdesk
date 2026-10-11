import io
import time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.models import User, Ticket, Document, StudentMessage
from app.seed_data import seed_database

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()

def get_student_headers():
    res = client.post("/api/auth/student-login", json={
        "email": "priya.sharma@campus.edu",
        "password": "campus123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def get_admin_headers():
    res = client.post("/api/auth/admin-login", json={
        "email": "admin@campus.edu",
        "password": "campus123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Router / Triage Agent" in data["agents"]

def test_student_login_flow():
    """Verify dedicated student login works with student credentials."""
    response = client.post("/api/auth/student-login", json={
        "email": "priya.sharma@campus.edu",
        "password": "campus123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"

def test_admin_login_flow():
    """Verify dedicated admin login works with admin credentials."""
    response = client.post("/api/auth/admin-login", json={
        "email": "admin@campus.edu",
        "password": "campus123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"

def test_student_rejected_from_admin_login():
    """Verify student credentials attempting admin login receive HTTP 403 Forbidden."""
    response = client.post("/api/auth/admin-login", json={
        "email": "priya.sharma@campus.edu",
        "password": "campus123"
    })
    assert response.status_code == 403
    assert "denied" in response.json()["detail"].lower() or "not authorized" in response.json()["detail"].lower()

def test_student_cannot_access_admin_api():
    """Verify student token is rejected from admin stats endpoint with HTTP 403 Forbidden."""
    student_headers = get_student_headers()
    response = client.get("/api/admin/stats", headers=student_headers)
    assert response.status_code == 403
    assert "authorization required" in response.json()["detail"].lower()

def test_student_cannot_access_admin_students_api():
    """Verify student token is rejected from admin student list with HTTP 403 Forbidden."""
    student_headers = get_student_headers()
    response = client.get("/api/admin/students", headers=student_headers)
    assert response.status_code == 403

def test_student_cannot_access_admin_messages_api():
    """Verify student token is rejected from viewing all student messages."""
    student_headers = get_student_headers()
    response = client.get("/api/contact/messages", headers=student_headers)
    assert response.status_code == 403

def test_admin_can_access_admin_stats():
    """Verify authenticated admin can access admin statistics with PDF count and emails."""
    admin_headers = get_admin_headers()
    response = client.get("/api/admin/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_tickets" in data
    assert "total_uploaded_pdfs" in data
    assert "student_emails_count" in data
    assert "unanswered_questions_count" in data
    assert "pdf_upload_status" in data

def test_student_registration_forces_student_role():
    """Verify student registration strictly assigns role='student' without privilege escalation."""
    uniq_ts = time.time_ns()
    reg_res = client.post("/api/auth/student-register", json={
        "full_name": "Test Student New",
        "email": f"test.student.{uniq_ts}@campus.edu",
        "password": "password123",
        "student_id": f"CS-{uniq_ts % 100000}",
        "department": "Computer Science & Engineering",
        "phone": "+91 99999 88888"
    })
    assert reg_res.status_code == 200
    user_data = reg_res.json()["user"]
    assert user_data["role"] == "student"

def test_manoj_kumar_seeded_login():
    """Verify pre-stored student account Manoj Kumar logs in successfully with password manoj123."""
    response = client.post("/api/auth/student-login", json={
        "email": "manoj@campus.edu",
        "password": "manoj123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "manoj@campus.edu"
    assert data["user"]["full_name"] == "Manoj Kumar"
    assert data["user"]["role"] == "student"
    assert data["user"]["is_active"] is True

def test_admin_student_management_lifecycle():
    """Verify Admin can create student, suspend login, reactivate login, reset password, and delete."""
    admin_headers = get_admin_headers()
    uniq = time.time_ns()
    student_email = f"managed.student.{uniq}@campus.edu"
    
    # 1. Admin creates student
    create_res = client.post("/api/admin/students", json={
        "full_name": "Managed Student",
        "email": student_email,
        "password": "initialPass123",
        "student_id": f"MS-{uniq % 100000}",
        "department": "Information Technology",
        "is_active": True
    }, headers=admin_headers)
    assert create_res.status_code == 201
    student_id = create_res.json()["id"]

    # 2. Student logs in
    login_res = client.post("/api/auth/student-login", json={
        "email": student_email,
        "password": "initialPass123"
    })
    assert login_res.status_code == 200

    # 3. Admin suspends student
    suspend_res = client.patch(f"/api/admin/students/{student_id}", json={
        "is_active": False
    }, headers=admin_headers)
    assert suspend_res.status_code == 200

    # 4. Student blocked from login (403 Forbidden)
    blocked_login = client.post("/api/auth/student-login", json={
        "email": student_email,
        "password": "initialPass123"
    })
    assert blocked_login.status_code == 403

    # 5. Admin reactivates student
    reactivate_res = client.patch(f"/api/admin/students/{student_id}", json={
        "is_active": True
    }, headers=admin_headers)
    assert reactivate_res.status_code == 200

    # 6. Admin resets student password
    reset_res = client.post(f"/api/admin/students/{student_id}/reset-password", json={
        "new_password": "newSecurePass456"
    }, headers=admin_headers)
    assert reset_res.status_code == 200

    # 7. Student logs in with new password
    new_login = client.post("/api/auth/student-login", json={
        "email": student_email,
        "password": "newSecurePass456"
    })
    assert new_login.status_code == 200

    # 8. Admin deletes student
    del_res = client.delete(f"/api/admin/students/{student_id}", headers=admin_headers)
    assert del_res.status_code == 200

    # 9. Student cannot log in anymore (401 Unauthorized)
    deleted_login = client.post("/api/auth/student-login", json={
        "email": student_email,
        "password": "newSecurePass456"
    })
    assert deleted_login.status_code == 401

def test_scenario_1_normal_faq_grounding_and_citations():
    """Test 1: Normal FAQ matching approved records includes source citations with page numbers."""
    headers = get_student_headers()
    response = client.post("/api/chat", json={
        "message": "How do I apply for a Bonafide Certificate?"
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "bonafide" in data["response"].lower()
    assert len(data["sources"]) > 0
    assert any("Handbook" in s["document"] for s in data["sources"])
    assert data["answer_available"] is True

def test_scenario_2_missing_information_exact_fallback():
    """Test 2: Missing info returns exact required message and offers Contact Admin."""
    headers = get_student_headers()
    response = client.post("/api/chat", json={
        "message": "What is the quantum teleportation research grant for freshmen in 2045?"
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    # Verifies exact requested text is returned
    assert "couldn't find the exact information in the college documents" in data["response"].lower()
    assert "contact admin" in data["response"].lower()
    assert data["escalation_offered"] is True
    assert data["answer_available"] is False

def test_scenario_3_academic_calendar_lookup():
    """Test calendar lookup returns verified dates and never hallucinates."""
    headers = get_student_headers()
    response = client.post("/api/chat", json={
        "message": "When is the mid-semester examination timetable scheduled?"
    }, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "mid-semester" in data["response"].lower() or "october" in data["response"].lower()
    assert len(data["sources"]) > 0

def test_scenario_4_student_privacy_isolation():
    """Test 4: Student 1 CANNOT view Student 2's support ticket (403 Forbidden)."""
    db = SessionLocal()
    try:
        student2 = db.query(User).filter(User.email == "rahul.verma@campus.edu").first()
        s2_ticket = db.query(Ticket).filter(Ticket.user_id == student2.id).first()
        if not s2_ticket:
            s2_ticket = Ticket(
                ticket_number="CHD-TEST-PRIVACY",
                user_id=student2.id,
                subject="Student 2 Confidential Query",
                description="Testing privacy isolation.",
                category="General",
                status="Open"
            )
            db.add(s2_ticket)
            db.commit()
            db.refresh(s2_ticket)

        # Login as student1
        headers1 = get_student_headers()

        # Attempt to access s2's ticket
        unauth_res = client.get(f"/api/tickets/{s2_ticket.id}", headers=headers1)
        assert unauth_res.status_code == 403
        assert "forbidden" in unauth_res.json()["detail"].lower()
    finally:
        db.close()

def test_scenario_5_ticket_lifecycle():
    """Test 5: Create a ticket, retrieve it with auth, verify status is Open with CHD ticket number."""
    headers = get_student_headers()

    create_res = client.post("/api/tickets", json={
        "subject": "Automated Test Ticket For Verification",
        "description": "Testing ticket submission lifecycle.",
        "category": "Certificates",
        "priority": "High"
    }, headers=headers)

    assert create_res.status_code == 200
    ticket_data = create_res.json()
    ticket_id = ticket_data["id"]
    assert ticket_data["status"] == "Open"
    assert ticket_data["ticket_number"].startswith("CHD-")

    # Fetch it
    fetch_res = client.get(f"/api/tickets/{ticket_id}", headers=headers)
    assert fetch_res.status_code == 200
    assert fetch_res.json()["subject"] == "Automated Test Ticket For Verification"

def test_email_admin_workflow():
    """Test student emailing the admin when info is missing, and admin replying."""
    student_headers = get_student_headers()
    admin_headers = get_admin_headers()

    # 1. Student submits contact message
    msg_res = client.post("/api/contact/email-admin", json={
        "question": "Where can I apply for an on-campus parking permit?",
        "message": "I commute daily from South Campus and have an electric scooter.",
        "chat_context": "Student asked AI about parking; not found in handbook."
    }, headers=student_headers)

    assert msg_res.status_code == 200
    msg_data = msg_res.json()
    msg_id = msg_data["id"]
    assert msg_data["student_email"] == "priya.sharma@campus.edu"
    assert msg_data["status"] == "New"
    assert msg_data["email_delivery_status"] in ["Delivered", "Sent", "Simulated"]

    # 2. Admin views messages list
    list_res = client.get("/api/contact/messages", headers=admin_headers)
    assert list_res.status_code == 200
    all_msgs = list_res.json()
    assert any(m["id"] == msg_id for m in all_msgs)

    # 3. Admin replies to student message
    reply_res = client.post(f"/api/contact/messages/{msg_id}/reply", json={
        "reply": "Parking permits can be issued at Security Gate 2 with your vehicle registration document."
    }, headers=admin_headers)
    assert reply_res.status_code == 200
    updated_msg = reply_res.json()
    assert updated_msg["status"] == "Resolved"
    assert "Gate 2" in updated_msg["admin_reply"]

def test_admin_document_management_lifecycle():
    """Test admin uploading a PDF, viewing list, and deleting it."""
    admin_headers = get_admin_headers()

    # Upload test text document
    file_content = b"COLLEGE LEAVE POLICY 2026: Students must submit formal leave application 24 hours in advance to the Department Office."
    upload_res = client.post(
        "/api/knowledge/upload-document",
        files={"file": ("Leave_Policy_2026.txt", io.BytesIO(file_content), "text/plain")},
        data={"title": "Official College Leave Policy 2026", "category": "Academics", "description": "Student leave application rules"},
        headers=admin_headers
    )
    assert upload_res.status_code == 200
    doc_data = upload_res.json()
    doc_id = doc_data["id"]
    assert doc_data["status"] == "indexed"
    assert doc_data["chunk_count"] > 0

    # Delete document
    del_res = client.delete(f"/api/knowledge/documents/{doc_id}", headers=admin_headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

def test_admin_scanned_pdf_ocr_detection():
    """Test that an empty/scanned document marks status as ocr_needed rather than pretending to index."""
    admin_headers = get_admin_headers()

    # Upload empty content representing scanned image PDF without extractable text
    empty_content = b""
    upload_res = client.post(
        "/api/knowledge/upload-document",
        files={"file": ("Scanned_Rules.txt", io.BytesIO(empty_content), "text/plain")},
        data={"title": "Scanned Image Rules", "category": "General"},
        headers=admin_headers
    )
    assert upload_res.status_code == 200
    doc_data = upload_res.json()
    assert doc_data["ocr_needed"] is True
    assert doc_data["status"] == "ocr_needed"

    # Clean up test doc
    client.delete(f"/api/knowledge/documents/{doc_data['id']}", headers=admin_headers)

def test_evaluation_suite_endpoint():
    """Test the complete 5-scenario evaluation runner endpoint."""
    response = client.post("/api/evaluation/run-suite")
    assert response.status_code == 200
    data = response.json()
    assert data["total_tests"] == 5
    assert data["passed"] == 5
    assert data["overall_status"] == "ALL PASSED"
