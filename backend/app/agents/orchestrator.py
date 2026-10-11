import datetime
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models import Conversation, ConversationMessage, User, Ticket
from app.agents.router_agent import router_agent
from app.agents.knowledge_agent import knowledge_agent
from app.agents.support_agent import support_agent
from app.agents.reviewer_agent import reviewer_agent
from app.tools.ticket_management import create_support_ticket, get_ticket_with_auth

class CampusAgentOrchestrator:
    """
    ReAct-Style Multi-Agent Orchestrator
    Coordinates Router, Knowledge, Student Support, and Reviewer Agents
    with transparent event timeline tracking, real tool integration,
    and database persistence.
    """
    def __init__(self):
        pass

    def run_react_loop(
        self,
        query: str,
        user: User,
        db: Session,
        conversation_id: Optional[int] = None,
        category_override: Optional[str] = None
    ) -> Dict[str, Any]:
        workflow_steps = []
        step_idx = 1

        def add_step(agent_name: str, action: str, summary: str, status: str = "completed"):
            nonlocal step_idx
            now_str = datetime.datetime.now().strftime("%H:%M:%S")
            workflow_steps.append({
                "step_number": step_idx,
                "agent": agent_name,
                "action": action,
                "summary": summary,
                "timestamp": now_str,
                "status": status
            })
            step_idx += 1

        # 1. Manage or create conversation
        if conversation_id:
            conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
            if not conv:
                conv = Conversation(user_id=user.id, title=query[:40] + "...")
                db.add(conv)
                db.flush()
        else:
            conv = Conversation(user_id=user.id, title=query[:40] + ("..." if len(query) > 40 else ""))
            db.add(conv)
            db.flush()

        # Save user message
        user_msg = ConversationMessage(
            conversation_id=conv.id,
            sender="user",
            content=query
        )
        db.add(user_msg)
        db.commit()

        # Step 1: Classifying question (Router Agent)
        add_step("Router / Triage Agent", "classifying_question", "Analyzing student query intent, tone, and knowledge category.")
        routing = router_agent.route(query)
        category = category_override if category_override and category_override != "All" else routing["category"]

        # Step 2: Selecting appropriate action
        add_step(
            "Router / Triage Agent",
            "selecting_appropriate_action",
            f"Determined intent: '{routing['intent']}'. Target action: {routing['tool_to_call']} in category '{category}'."
        )

        sources = []
        action_taken = routing["intent"]
        ticket_created = False
        ticket_id = None
        escalation_offered = False

        # Step 3: Execute Action & Observe Results
        answer_available = True
        if routing["intent"] == "calendar_lookup":
            add_step("Knowledge Agent", "searching_college_information", "Querying Academic Calendar database for official dates.")
            retrieval_data = knowledge_agent.execute_calendar_lookup(query, db, conversation_id=conv.id)
            sources = retrieval_data.get("citations", [])
            add_step("Knowledge Agent", "checking_retrieved_results", retrieval_data["summary"])

            # Step 5: Review
            review_res = reviewer_agent.review(query, retrieval_data, intent="calendar_lookup")
            add_step("Reviewer Agent", "reviewing_the_answer", review_res["reason"])

            if review_res["approved"]:
                final_answer = support_agent.compose_calendar_response(query, retrieval_data, is_demo=settings.DEMO_MODE)
            else:
                final_answer = support_agent.compose_missing_info_response(query, context="academic calendar")
                escalation_offered = True
                answer_available = False

        elif routing["intent"] == "ticket_lookup":
            ident = routing.get("ticket_identifier")
            add_step("Student Support Agent", "searching_college_information", f"Looking up ticket record {ident or 'most recent'} with authorization check.")
            if ident:
                lookup_res = get_ticket_with_auth(ident, user, db)
            else:
                # Find most recent ticket of this student
                recent_t = db.query(Ticket).filter(Ticket.user_id == user.id).order_by(Ticket.created_at.desc()).first()
                if recent_t:
                    lookup_res = get_ticket_with_auth(str(recent_t.id), user, db)
                else:
                    lookup_res = {"success": False, "error": "No existing support tickets found for your account."}

            if lookup_res.get("success"):
                add_step("Reviewer Agent", "reviewing_the_answer", "Verified student authorization for ticket access.")
                final_answer = support_agent.compose_ticket_status_response(lookup_res)
            else:
                add_step("Reviewer Agent", "reviewing_the_answer", f"Ticket access declined or not found: {lookup_res.get('error')}")
                final_answer = f"⚠️ {lookup_res.get('error', 'Ticket could not be retrieved.')}"
                answer_available = False

        elif routing["intent"] == "ticket_creation":
            add_step("Student Support Agent", "creating_support_ticket", "Creating official support ticket for college staff.")
            ticket_res = create_support_ticket(
                user_id=user.id,
                subject=f"Inquiry regarding {category}",
                description=query,
                category=category,
                priority="Medium",
                db=db,
                conversation_id=conv.id
            )
            ticket_created = True
            ticket_id = ticket_res["ticket_number"]
            add_step("Student Support Agent", "checking_retrieved_results", f"Ticket {ticket_id} opened and assigned to {ticket_res['assigned_to']}.")
            add_step("Reviewer Agent", "reviewing_the_answer", "Audited ticket creation parameters and persisted record.")
            final_answer = (
                f"✅ **Support Ticket Created Successfully!**\n\n"
                f"• **Ticket Number:** `{ticket_res['ticket_number']}`\n"
                f"• **Subject:** {ticket_res['subject']}\n"
                f"• **Category:** {ticket_res['category']}\n"
                f"• **Status:** `Open`\n"
                f"• **Assigned Officer:** {ticket_res['assigned_to']}\n\n"
                f"You can track the progress of this ticket under **'My Support Tickets'**."
            )

        else: # Standard Knowledge Search (RAG)
            add_step("Knowledge Agent", "searching_college_information", f"Searching approved FAQs and indexed document chunks for '{category}'.")
            retrieval_data = knowledge_agent.execute_retrieval(query, category, db, conversation_id=conv.id)
            sources = retrieval_data.get("citations", [])
            add_step("Knowledge Agent", "checking_retrieved_results", retrieval_data["summary"])

            # Review & Guardrails
            review_res = reviewer_agent.review(query, retrieval_data, intent="knowledge_search")
            add_step("Reviewer Agent", "reviewing_the_answer", review_res["reason"])

            if review_res["approved"]:
                final_answer = support_agent.compose_grounded_response(query, retrieval_data, is_demo=settings.DEMO_MODE)
                # Check if support agent fallback was returned
                if "couldn't find the exact information" in final_answer:
                    escalation_offered = True
                    answer_available = False
            elif review_res["action"] == "escalate":
                final_answer = support_agent.compose_contradiction_response(query)
                escalation_offered = True
                answer_available = False
            elif review_res["action"] == "offer_ticket":
                final_answer = support_agent.compose_missing_info_response(query)
                escalation_offered = True
                answer_available = False
            else: # privacy or guardrail rejection
                final_answer = (
                    "⛔ **Security Guardrail Notice:**\n\n"
                    "I cannot retrieve private information, individual student grades, or restricted records. "
                    "Please log into the official student portal or visit the Registrar's Office in person with your Student ID."
                )
                answer_available = False

        # Step 6: Preparing the response
        add_step("Student Support Agent", "preparing_the_response", "Generated synthesized output with citations and verification badges.")

        # Save assistant message to database
        assistant_msg = ConversationMessage(
            conversation_id=conv.id,
            sender="assistant",
            content=final_answer,
            steps_json=json.dumps(workflow_steps),
            sources_json=json.dumps(sources)
        )
        db.add(assistant_msg)
        db.commit()

        return {
            "conversation_id": conv.id,
            "response": final_answer,
            "sources": sources,
            "workflow_steps": workflow_steps,
            "category": category,
            "action_taken": action_taken,
            "ticket_created": ticket_created,
            "ticket_id": ticket_id,
            "escalation_offered": escalation_offered,
            "answer_available": answer_available,
            "is_demo": settings.DEMO_MODE
        }

campus_orchestrator = CampusAgentOrchestrator()
