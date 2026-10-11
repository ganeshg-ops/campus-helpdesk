import re
from typing import Dict, Any

class RouterAgent:
    """
    Agent 1: Router / Triage Agent
    Responsibilities:
    - Analyze user query intent and category
    - Determine workflow branch: knowledge search, calendar lookup, ticket query/creation, or escalation
    - Return structured routing decision
    """
    def __init__(self):
        self.name = "Router / Triage Agent"
        self.role = "Intent Classifier and Task Router"

    def route(self, query: str) -> Dict[str, Any]:
        text = query.lower().strip()

        # Check for calendar / date queries
        calendar_keywords = ["when is", "date of", "schedule", "timetable", "calendar", "deadline", "vacation", "holiday", "mid term", "end sem"]
        if any(kw in text for kw in calendar_keywords) and not ("how to" in text or "procedure" in text):
            return {
                "intent": "calendar_lookup",
                "category": "Academic Calendar & Timetable",
                "tool_to_call": "academic_calendar_lookup",
                "requires_rag": False,
                "reasoning_summary": "Inquiry detected regarding dates, deadlines, or academic calendar events."
            }

        # Check for explicit ticket status or ticket creation intent
        ticket_number_match = re.search(r"(?:chd|tt|t)-\d{4}-\d+", text)
        if ticket_number_match or "my ticket" in text or "ticket status" in text:
            return {
                "intent": "ticket_lookup",
                "category": "Support Tickets",
                "tool_to_call": "get_ticket_with_auth",
                "ticket_identifier": ticket_number_match.group(0).upper() if ticket_number_match else None,
                "requires_rag": False,
                "reasoning_summary": "Inquiry regarding existing support ticket status."
            }

        if any(kw in text for kw in ["create ticket", "raise ticket", "talk to human", "contact staff", "complain", "dispute fee"]):
            return {
                "intent": "ticket_creation",
                "category": "Staff Escalation",
                "tool_to_call": "create_support_ticket",
                "requires_rag": False,
                "reasoning_summary": "Explicit student request to open ticket or escalate to college staff."
            }

        # Category classification for knowledge base
        category = "General"
        if any(w in text for w in ["certificate", "bonafide", "transcript", "degree"]):
            category = "Certificates"
        elif any(w in text for w in ["attendance", "condonation", "medical", "absent"]):
            category = "Attendance"
        elif any(w in text for w in ["fee", "tuition", "payment", "fine", "installment"]):
            category = "Fees"
        elif any(w in text for w in ["hostel", "mess", "curfew", "room", "warden", "night-out"]):
            category = "Hostel"
        elif any(w in text for w in ["exam", "photocopy", "re-evaluation", "marksheet", "hall ticket"]):
            category = "Examinations"
        elif any(w in text for w in ["timing", "office", "counter", "hours", "open"]):
            category = "Office Timings"

        return {
            "intent": "knowledge_search",
            "category": category,
            "tool_to_call": "college_knowledge_search",
            "requires_rag": True,
            "reasoning_summary": f"Question routed to Knowledge Agent with category context '{category}'."
        }

router_agent = RouterAgent()
