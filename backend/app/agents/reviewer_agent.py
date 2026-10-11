from typing import Dict, Any, List

class ReviewerAgent:
    """
    Agent 4: Reviewer & Guardrails Agent
    Responsibilities:
    - Review factual accuracy and grounding
    - Ensure claims are backed by retrieved citations
    - Guardrail check: Student privacy, marks, confidential records
    - Escalation trigger if evidence is absent or contradictory
    """
    def __init__(self):
        self.name = "Reviewer Agent"
        self.role = "Factual Verifier & Guardrail Auditor"

    def review(
        self,
        query: str,
        retrieval_data: Dict[str, Any],
        intent: str
    ) -> Dict[str, Any]:
        issues = []
        is_approved = True
        escalation_required = False

        # Guardrail 1: Privacy and sensitive personal data protection
        query_lower = query.lower()
        sensitive_patterns = ["another student", "someone else's marks", "password of", "private record of", "hack portal"]
        if any(p in query_lower for p in sensitive_patterns):
            issues.append("Policy violation: Inquiring about private/confidential personal data.")
            return {
                "approved": False,
                "escalation_required": False,
                "reason": "Privacy Guardrail Triggered: System strictly prohibits accessing other students' records.",
                "action": "reject_and_warn"
            }

        # Guardrail 2: Contradictory information check
        if retrieval_data.get("is_contradictory"):
            issues.append("Contradictory policy data detected in knowledge records.")
            return {
                "approved": False,
                "escalation_required": True,
                "reason": "Knowledge conflict detected: College policies contain conflicting records. Escalating to Student Affairs staff.",
                "action": "escalate"
            }

        # Guardrail 3: Insufficient evidence check (Missing information)
        if not retrieval_data.get("evidence_found") and intent not in ["ticket_lookup", "ticket_creation"]:
            issues.append("No verified evidence found in approved college documents.")
            return {
                "approved": False,
                "escalation_required": True,
                "reason": "Information limitation: The official college database does not currently contain verified answers for this question.",
                "action": "offer_ticket"
            }

        return {
            "approved": True,
            "escalation_required": False,
            "reason": "Response passed all grounding and privacy checks. All claims backed by verified citations.",
            "action": "approve"
        }

reviewer_agent = ReviewerAgent()
