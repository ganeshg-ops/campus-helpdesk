import os
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import (
    User, FAQ, Document, DocumentChunk, AcademicCalendarEvent,
    Ticket, TicketStatusHistory, Conversation, ConversationMessage
)
from app.auth import hash_password

SAMPLE_FAQS = [
    {
        "question": "How do I apply for a Bonafide Certificate?",
        "answer": "To obtain a Bonafide Certificate, submit an application via the Student Portal under 'Services > Certificate Request' or visit the Academic Section (Admin Block, Room 102). Processing takes 2-3 working days. For passport or visa applications, attach a copy of your admission ID.",
        "category": "Certificates",
        "source_document": "Official Student Handbook 2025-2026 (Section 4.1)",
        "is_approved": True,
        "is_demo": True
    },
    {
        "question": "What is the procedure to get official Academic Transcripts?",
        "answer": "Apply through the Controller of Examinations (COE) portal with your registration number and semester marksheets. The fee is $15 per set. Transcripts are issued within 7-10 working days after fee verification.",
        "category": "Certificates",
        "source_document": "Examination Regulation Manual 2025-2026",
        "is_approved": True,
        "is_demo": True
    },
    {
        "question": "What is the minimum attendance required to appear for semester examinations?",
        "answer": "A minimum of 75% overall attendance is mandatory in each registered course to be eligible for end-semester examinations. Students with attendance between 65% and 74% due to medical emergencies may apply for condonation with approved hospital certificates. Below 65% results in course repetition.",
        "category": "Attendance",
        "source_document": "Academic Regulations & Attendance Bylaws (Clause 7.2)",
        "is_approved": True,
        "is_demo": True
    },
    {
        "question": "How can I submit a medical certificate for attendance condonation?",
        "answer": "Medical certificates from an authorized physician must be submitted to your Department Head and the Health Center within 5 working days of resuming classes. Late submissions beyond 5 days are not accepted.",
        "category": "Attendance",
        "source_document": "Academic Regulations & Attendance Bylaws (Clause 7.5)",
        "is_approved": True,
        "is_demo": True
    },
    {
        "question": "What are the college administrative and fee counter timings?",
        "answer": "The Main Administrative Office operates Monday through Friday from 9:00 AM to 5:00 PM (Lunch break: 1:00 PM - 2:00 PM). The Student Fee & Accounts Counter operates from 9:30 AM to 3:30 PM on weekdays. The office is closed on second Saturdays, Sundays, and public holidays.",
        "category": "Office Timings",
        "source_document": "Campus Administrative Directory 2026",
        "is_approved": True,
        "is_demo": True
    },
    {
        "question": "What are the hostel curfew rules and night-out permissions?",
        "answer": "The campus hostel in-time curfew is strictly 8:30 PM for all residential hostels. Night-out leave or weekend home visits require a digital gate-pass applied 24 hours prior on the Hostel ERP and approved by the Chief Warden with parental consent SMS.",
        "category": "Hostel",
        "source_document": "Hostel Resident Code of Conduct (Rule 12)",
        "is_approved": True,
        "is_demo": True
    },
    {
        "question": "What are the accepted payment methods and deadlines for semester tuition fees?",
        "answer": "Semester fees must be paid online through the official ERP portal via Net Banking, Debit/Credit Card, or UPI. For Fall Semester, the deadline without late fine is August 15, 2026. A late fee of $25 per week applies up to August 30. Cash payments are not accepted at the accounts counter.",
        "category": "Fees",
        "source_document": "Fee Structure & Payment Schedule Circular 2026",
        "is_approved": True,
        "is_demo": True
    },
    {
        "question": "When will the End-Semester Examination timetable be published?",
        "answer": "The draft examination timetable is published on the University Portal 3 weeks prior to exam commencement. The finalized timetable is published 10 days before exams by the Controller of Examinations. Hall tickets become downloadable 5 days prior if all dues are cleared.",
        "category": "Examinations",
        "source_document": "COE Examination Schedule Notification 2026",
        "is_approved": True,
        "is_demo": True
    },
    {
        "question": "How do I apply for exam re-evaluation or answer script photocopy?",
        "answer": "Students may apply for photocopy and re-evaluation within 10 calendar days of grade announcement via the COE portal. Re-evaluation fee is $30 per course. Revised marks, if altered by more than 5%, will be updated in the official marksheet.",
        "category": "Examinations",
        "source_document": "COE Evaluation Guidelines (Section 9)",
        "is_approved": True,
        "is_demo": True
    },
    {
        "question": "How can I obtain a subsidized student bus pass?",
        "answer": "Submit a completed Transit Concession Form along with your College ID card and two passport photos to the Student Welfare Office (Room 204). Authorized passes are stamped on the 1st and 3rd Tuesday of every month.",
        "category": "General",
        "source_document": "Student Welfare Services Handbook 2026",
        "is_approved": True,
        "is_demo": True
    }
]

SAMPLE_CALENDAR = [
    {
        "title": "Semester Registration & Fee Payment Without Fine",
        "category": "Fee Deadline",
        "start_date": "2026-08-01",
        "end_date": "2026-08-15",
        "description": "Last date to complete online semester course registration and tuition fee payment without late fine.",
        "source": "Official Academic Calendar 2025-2026",
        "is_verified": True
    },
    {
        "title": "Commencement of Fall Semester Classes",
        "category": "Academic",
        "start_date": "2026-08-18",
        "end_date": "2026-08-18",
        "description": "Orientation and regular lecture classes begin for all returning and freshman undergraduate students.",
        "source": "Official Academic Calendar 2025-2026",
        "is_verified": True
    },
    {
        "title": "Mid-Semester Examinations (Assessment I)",
        "category": "Examination",
        "start_date": "2026-10-12",
        "end_date": "2026-10-19",
        "description": "Centralized mid-term examinations for all engineering and science departments.",
        "source": "Controller of Examinations Notification 2026/04",
        "is_verified": True
    },
    {
        "title": "Last Working Day & Attendance Freeze",
        "category": "Academic",
        "start_date": "2026-11-28",
        "end_date": "2026-11-28",
        "description": "Last day of classes. Faculty will freeze and upload final semester attendance percentages to portal.",
        "source": "Official Academic Calendar 2025-2026",
        "is_verified": True
    },
    {
        "title": "End-Semester Practical & Lab Examinations",
        "category": "Examination",
        "start_date": "2026-12-02",
        "end_date": "2026-12-08",
        "description": "Laboratory vivas and practical assessments evaluated by internal and external examiners.",
        "source": "Controller of Examinations Notification 2026/04",
        "is_verified": True
    },
    {
        "title": "End-Semester Theory Examinations",
        "category": "Examination",
        "start_date": "2026-12-10",
        "end_date": "2026-12-24",
        "description": "Final written examinations. Session morning: 9:30 AM - 12:30 PM, afternoon: 2:00 PM - 5:00 PM.",
        "source": "Controller of Examinations Notification 2026/04",
        "is_verified": True
    },
    {
        "title": "Winter Vacation & Semester Break",
        "category": "Holiday",
        "start_date": "2026-12-25",
        "end_date": "2027-01-10",
        "description": "Campus winter break for undergraduate and postgraduate students.",
        "source": "Official Academic Calendar 2025-2026",
        "is_verified": True
    }
]

def seed_database(db: Session):
    # Ensure Manoj Kumar requested by admin is always provisioned, active, and has password 'manoj123'
    manoj = db.query(User).filter(User.email == "manoj@campus.edu").first()
    if not manoj:
        manoj = User(
            email="manoj@campus.edu",
            full_name="Manoj Kumar",
            role="student",
            student_id="CS-2024-055",
            department="Computer Science & Engineering",
            phone="+91 98765 43210",
            password_hash=hash_password("manoj123"),
            is_active=True
        )
        db.add(manoj)
        db.commit()
    else:
        manoj.password_hash = hash_password("manoj123")
        manoj.is_active = True
        db.commit()

    # Check if database already seeded with base data
    if db.query(User).filter(User.email == "priya.sharma@campus.edu").first():
        return

    print("Seeding database with default users, FAQs, calendar records, and tickets...")

    # 1. Create Users
    users_data = [
        {
            "email": "manoj@campus.edu",
            "full_name": "Manoj Kumar",
            "role": "student",
            "student_id": "CS-2024-055",
            "department": "Computer Science & Engineering",
            "password_hash": hash_password("manoj123")
        },
        {
            "email": "priya.sharma@campus.edu",
            "full_name": "Priya Sharma",
            "role": "student",
            "student_id": "CS-2024-042",
            "department": "Computer Science & Engineering",
            "password_hash": hash_password("campus123")
        },
        {
            "email": "rahul.verma@campus.edu",
            "full_name": "Rahul Verma",
            "role": "student",
            "student_id": "ME-2024-115",
            "department": "Mechanical Engineering",
            "password_hash": hash_password("campus123")
        },
        {
            "email": "david.miller@campus.edu",
            "full_name": "Prof. David Miller",
            "role": "staff",
            "student_id": None,
            "department": "Student Affairs Office",
            "password_hash": hash_password("campus123")
        },
        {
            "email": "admin@campus.edu",
            "full_name": "Dean of Student Services (Admin)",
            "role": "admin",
            "student_id": None,
            "department": "Deanery & Helpdesk Administration",
            "password_hash": hash_password("campus123")
        }
    ]

    created_users = {}
    for u in users_data:
        user_obj = User(**u)
        db.add(user_obj)
        db.flush()
        created_users[u["email"]] = user_obj

    # 2. Add FAQs
    for f in SAMPLE_FAQS:
        faq_obj = FAQ(**f)
        db.add(faq_obj)

    # 3. Add Academic Calendar
    for c in SAMPLE_CALENDAR:
        cal_obj = AcademicCalendarEvent(**c)
        db.add(cal_obj)

    # 4. Add Initial Documents
    doc1 = Document(
        filename="Student_Handbook_2025_2026.pdf",
        title="Official Campus Student Services & Conduct Handbook",
        description="Official handbook covering bonafide certificate procedures, attendance condonation, and fee deadlines.",
        category="Academics",
        file_path="uploads/Student_Handbook_2025_2026.pdf",
        file_size=2048500,
        page_count=14,
        ocr_needed=False,
        is_approved=True,
        status="indexed",
        chunk_count=8
    )
    doc2 = Document(
        filename="Hostel_Rules_Regulations_2026.txt",
        title="Hostel Resident Code of Conduct & Timings",
        description="Curfew timings, gate passes, night-out leave procedures, and mess timings.",
        category="Hostel",
        file_path="uploads/Hostel_Rules_Regulations_2026.txt",
        file_size=41200,
        page_count=4,
        ocr_needed=False,
        is_approved=True,
        status="indexed",
        chunk_count=4
    )
    db.add(doc1)
    db.add(doc2)
    db.flush()

    # Add chunks for RAG demo indexing with real page numbers
    chunks = [
        (doc1.id, 0, 2, "SECTION 1: CERTIFICATE ISSUANCE PROCEDURES. Bonafide certificates, transfer certificates, and degree verifications are issued by Room 102 Academic Block. Applications require 48 hours for verification. For overseas education or embassy visas, provide admission offer letters."),
        (doc1.id, 1, 4, "SECTION 2: ATTENDANCE POLICIES. Clause 7.1 requires 75% attendance in theory and laboratory classes. Between 65-74%, the Academic Dean may condone absences supported by approved medical records submitted within 5 days."),
        (doc1.id, 2, 7, "SECTION 3: FEE PAYMENT SCHEDULE. Tuition and semester amenity fees are payable strictly online before the 15th of the semester start month. Late fees apply after the deadline at $25/week. Installment concessions require written guardian endorsement to the Finance Dean."),
        (doc2.id, 0, 1, "HOSTEL RESIDENCY GUIDELINES: Gates close promptly at 8:30 PM. Late entries beyond 8:30 PM require prior written permit from the Deputy Warden. Unauthorized absence overnight leads to disciplinary inquiry."),
        (doc2.id, 1, 3, "HOSTEL MESS & AMENITIES: Dining hall operates Breakfast (7:00-8:45 AM), Lunch (12:00-2:00 PM), Snacks (4:30-5:30 PM), Dinner (7:30-9:30 PM). Food delivery is permitted until 8:15 PM at the main security kiosk.")
    ]
    for doc_id, c_idx, p_num, content in chunks:
        chunk_obj = DocumentChunk(
            document_id=doc_id,
            chunk_index=c_idx,
            page_number=p_num,
            content=content,
            metadata_json=json.dumps({"source": "Student Handbook / Hostel Regulations", "verified": True, "page": p_num})
        )
        db.add(chunk_obj)

    # 5. Add Seed Tickets for Student 1 (Priya Sharma)
    priya = created_users["priya.sharma@campus.edu"]
    staff_user = created_users["david.miller@campus.edu"]

    ticket1 = Ticket(
        ticket_number="CHD-2026-00101",
        user_id=priya.id,
        subject="Request for Urgent Bonafide Certificate for Visa Interview",
        description="I have a US visa interview scheduled for next Thursday and require an urgent Bonafide Certificate stating my current semester enrollment and expected graduation date.",
        category="Certificates",
        priority="High",
        status="In Progress",
        assigned_to_user_id=staff_user.id,
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(ticket1)
    db.flush()

    hist1 = TicketStatusHistory(
        ticket_id=ticket1.id,
        changed_by_user_id=staff_user.id,
        old_status="Open",
        new_status="In Progress",
        comment="Application received and forwarded to Academic Records Section for expedited signoff.",
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db.add(hist1)

    ticket2 = Ticket(
        ticket_number="CHD-2026-00088",
        user_id=priya.id,
        subject="Clarification on Mid-Term Lab Exam Clash with Sports Meet",
        description="I am representing the university in the inter-collegiate badminton tournament on Oct 14th which clashes with my CS302 Database Lab exam.",
        category="Examinations",
        priority="Medium",
        status="Resolved",
        assigned_to_user_id=staff_user.id,
        resolution_notes="Authorized re-test scheduled with Lab In-Charge on Oct 20th. Approved by Sports Director.",
        created_at=datetime.utcnow() - timedelta(days=6)
    )
    db.add(ticket2)
    db.flush()

    hist2 = TicketStatusHistory(
        ticket_id=ticket2.id,
        changed_by_user_id=staff_user.id,
        old_status="In Progress",
        new_status="Resolved",
        comment="Special re-test session scheduled and intimated to student.",
        created_at=datetime.utcnow() - timedelta(days=4)
    )
    db.add(hist2)

    # Add Ticket for Student 2 (Rahul Verma) to demonstrate isolation!
    rahul = created_users["rahul.verma@campus.edu"]
    ticket3 = Ticket(
        ticket_number="CHD-2026-00095",
        user_id=rahul.id,
        subject="Hostel Room Change Request Due to Plumbing Maintenance",
        description="Persistent water leakage in Block B Room 304. Requesting temporary allotment to Room 308.",
        category="Hostel",
        priority="High",
        status="Open",
        assigned_to_user_id=staff_user.id,
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db.add(ticket3)

    # Seed initial Student Messages for Contact Admin section
    from app.models import StudentMessage
    seed_msg = StudentMessage(
        student_id=priya.id,
        student_name=priya.full_name,
        student_email=priya.email,
        question="What is the procedure for obtaining permission for special sports leave?",
        message="I need official leave approval from the Deanery for the National Inter-University Games next week.",
        chat_context="User asked AI about leave letters; AI indicated Deanery endorsement is required.",
        ticket_id=ticket2.id,
        status="New",
        email_delivery_status="Delivered",
        created_at=datetime.utcnow() - timedelta(hours=4)
    )
    db.add(seed_msg)

    # Add a sample initial conversation for Priya
    conv = Conversation(
        user_id=priya.id,
        title="Attendance Condonation Procedure Inquiry"
    )
    db.add(conv)
    db.flush()

    m1 = ConversationMessage(
        conversation_id=conv.id,
        sender="user",
        content="What is the minimum attendance required and how do I apply for condonation if I was hospitalized?",
        created_at=datetime.utcnow() - timedelta(hours=3)
    )
    m2 = ConversationMessage(
        conversation_id=conv.id,
        sender="assistant",
        content="A minimum of 75% attendance is required. Students between 65% and 74% due to medical conditions can apply for condonation by submitting verified hospital medical certificates to the Department Head and Health Center within 5 days of resuming classes.",
        steps_json=json.dumps([
            {"step_number": 1, "agent": "Router / Triage Agent", "action": "classify_intent", "summary": "Identified inquiry regarding Attendance policy and medical condonation.", "timestamp": "10:00:01", "status": "completed"},
            {"step_number": 2, "agent": "Knowledge Agent", "action": "knowledge_search", "summary": "Retrieved Academic Regulations Clause 7.2 and 7.5.", "timestamp": "10:00:02", "status": "completed"},
            {"step_number": 3, "agent": "Reviewer Agent", "action": "verify_grounding", "summary": "Confirmed 75% threshold and 5-day window from official documents.", "timestamp": "10:00:03", "status": "completed"},
            {"step_number": 4, "agent": "Student Support Agent", "action": "respond", "summary": "Formulated policy explanation with citations.", "timestamp": "10:00:04", "status": "completed"}
        ]),
        sources_json=json.dumps([
            {"title": "Academic Regulations & Attendance Bylaws", "category": "Attendance", "document": "Official Student Handbook 2025-2026", "excerpt": "Minimum 75% attendance required; 65-74% eligible for condonation with medical proof within 5 days.", "is_verified": True}
        ]),
        created_at=datetime.utcnow() - timedelta(hours=3)
    )
    db.add(m1)
    db.add(m2)

    db.commit()
    print("Database seeding completed successfully.")
