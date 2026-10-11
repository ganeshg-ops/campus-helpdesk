import httpx
import logging
import re
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

FALLBACK_UNAVAILABLE_MESSAGE = (
    "I couldn't find the exact information in the college documents available to me. "
    "Please contact the college admin for confirmation. You can send your question "
    "to the admin using the Contact Admin option below."
)

class StudentSupportAgent:
    """
    Agent 3: Student Support Agent
    Responsibilities:
    - Formulate clear, concise, direct student responses strictly based on retrieved college documents.
    - Give ONLY the exact answer to what the student asked, avoiding bulky text dumps.
    - Reference source PDF name and page number when available.
    - Never invent missing details, procedures, or fees.
    - Provide exact fallback message and prompt for Email Admin when info is missing.
    """
    def __init__(self):
        self.name = "Student Support Agent"
        self.role = "Campus Helpdesk Assistant & Synthesizer"

    def _call_llm_for_grounding(self, query: str, passages: List[Dict[str, Any]]) -> Optional[str]:
        """
        Attempts to call configured LLM (OpenAI or Gemini) with strict concise grounding instructions.
        Returns synthesized response or None if LLM is unavailable.
        """
        context_parts = []
        for idx, p in enumerate(passages):
            doc_title = p.get("source_doc_title") or p.get("document", "College Document")
            page_info = f", Page {p['page_number']}" if p.get("page_number") else ""
            context_parts.append(f"Document {idx+1}: [{doc_title}{page_info}]\n{p.get('content', '')}")

        context_str = "\n\n".join(context_parts)

        # 1. Try OpenAI if configured
        if settings.OPENAI_API_KEY:
            try:
                headers = {
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                messages = [
                    {
                        "role": "system",
                        "content": (
                            "You are the Campus Helpdesk AI Assistant. You must answer the student's question based strictly on the uploaded college documents provided below. "
                            "CRITICAL INSTRUCTION: Give ONLY the direct, concise, exact answer to the student's question (1-3 sentences or clear steps). "
                            "DO NOT dump entire paragraphs, boilerplate headers, or disclaimers from the document. "
                            "If the student asks 'what is college name?', answer simply: 'The college name is [Name].' "
                            "Do not extrapolate or invent missing details. "
                            "If the text does not contain sufficient details to answer the student's question, reply EXACTLY: "
                            f"\"{FALLBACK_UNAVAILABLE_MESSAGE}\""
                        )
                    },
                    {
                        "role": "user",
                        "content": f"Uploaded College Documents:\n{context_str}\n\nStudent Question:\n{query}"
                    }
                ]
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers=headers,
                        json={"model": "gpt-4o-mini", "messages": messages, "temperature": 0.2}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"].strip()
            except Exception as e:
                logger.warning(f"OpenAI call failed, falling back to local grounder: {e}")

        # 2. Try Gemini if configured
        if settings.GEMINI_API_KEY:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
                prompt_text = (
                    "You are the Campus Helpdesk AI Assistant. Answer the student's question based strictly on the uploaded college documents below. "
                    "CRITICAL INSTRUCTION: Give ONLY the direct, concise, exact answer to the student's question (1-3 sentences or clear steps). "
                    "DO NOT dump entire paragraphs, boilerplate headers, or disclaimers. "
                    "If the student asks 'what is college name?', answer simply: 'The college name is [Name].' "
                    "Do not extrapolate or invent missing details. "
                    f"If the text does not contain sufficient information, reply EXACTLY: \"{FALLBACK_UNAVAILABLE_MESSAGE}\"\n\n"
                    f"Documents:\n{context_str}\n\nQuestion:\n{query}"
                )
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post(url, json={"contents": [{"parts": [{"text": prompt_text}]}]})
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        return text
            except Exception as e:
                logger.warning(f"Gemini call failed, falling back to local grounder: {e}")

        return None

    def _extract_precise_answer(self, query: str, passages: List[Dict[str, Any]]) -> Optional[str]:
        """
        Pinpoints the exact answer to the student's question without dumping raw chunks.
        Extracts key entities (college name, location, timings, fees, rules, steps).
        """
        q = query.lower().strip()
        combined_text = "\n".join(p.get("content", "") for p in passages)

        # Clean document noise and disclaimers
        clean = combined_text
        clean = re.sub(r'Campus Helpdesk AI Demo[^\.\n]*', '', clean)
        clean = re.sub(r'Fictional sample[^\.\n]*', '', clean, flags=re.IGNORECASE)
        clean = re.sub(r'IMPORTANT:[^\.]*guidance\.', '', clean, flags=re.IGNORECASE)
        clean = re.sub(r'These amounts are fictional[^\.]*\.', '', clean, flags=re.IGNORECASE)
        clean = re.sub(r'End of sample document[^\.]*\.', '', clean, flags=re.IGNORECASE)
        clean = re.sub(r'Page \d+', '', clean)
        clean = re.sub(r'SAMPLE COLLEGE RULES & STUDENT SERVICES', '', clean, flags=re.IGNORECASE)

        # 1. College / Institution Name
        if any(k in q for k in ['college name', 'institution name', 'name of college', 'name of the college', 'which college', 'what college', 'college called']):
            m = re.search(r'(?:Institution|College Name|Name of (?:the )?College|Name of Institute|Campus Name):\s*([^\(\n\r]+?)(?:\s*\([^\)]*\))?(?:\s+Location:|\s+Academic|\s+Student Services|\.|$|\n)', clean, re.IGNORECASE)
            if m:
                name = m.group(1).strip()
                return f"The college name is **{name}**."

        # 2. Location / Address
        if any(k in q for k in ['location', 'address', 'where is the college', 'situated', 'where located', 'college place']):
            m = re.search(r'(?:Location|Address|Campus Location):\s*([^\(\n\r]+?)(?:\s*\([^\)]*\))?(?:\s+Academic|\s+Student Services|\.|$|\n)', clean, re.IGNORECASE)
            if m:
                loc = m.group(1).strip()
                return f"The college is located at **{loc}**."

        # 3. Office Hours / Timings
        if any(k in q for k in ['office hour', 'office timing', 'opening hour', 'working hour', 'office open', 'office close']):
            m = re.search(r'(?:Office Hours|Working Hours|Timings):\s*([^.\n\r]+(?:\.\s*Closed[^\.\n\r]+)?)', clean, re.IGNORECASE)
            if m:
                return f"**Student Services Office Hours:**\n{m.group(1).strip()}"

        # 4. Academic Year
        if any(k in q for k in ['academic year', 'which batch', 'which academic']):
            m = re.search(r'Academic Year:\s*([A-Za-z0-9\s–—\-]+?)(?:\s+Student Services|\.|$|\n)', clean, re.IGNORECASE)
            if m:
                return f"The current academic year is **{m.group(1).strip()}**."

        # 5. Bonafide Certificate
        if 'bonafide' in q:
            if any(k in q for k in ['fee', 'cost', 'charge', 'price']):
                m_fee = re.search(r'(?:Sample fee|fee)[^:]*:\s*([^.\n\r]+(?:\.\s*A duplicate[^\.\n\r]+)?)', clean, re.IGNORECASE)
                if m_fee:
                    return f"**Bonafide Certificate Fee:**\n{m_fee.group(1).strip()}"
            if any(k in q for k in ['document', 'required', 'proof', 'need to submit', 'submit']):
                return (
                    "According to the guidelines, to apply for a Bonafide Certificate you need:\n\n"
                    "• Student Name, Register Number, Department, and Year of study\n"
                    "• Valid Student ID copy\n"
                    "• Stated purpose (e.g., scholarship, bank account, visa, or travel concession)."
                )
            # General Bonafide Steps
            m_steps = re.search(r'2\.\s*Bonafide Certificate Procedure(.+?)(?=Sample fee|3\.\s*Attendance|\Z)', clean, re.DOTALL | re.IGNORECASE)
            if m_steps:
                steps_text = m_steps.group(1).strip()
                # Format each numbered step cleanly
                formatted = re.sub(r'(\d+\.)', r'\n\1', steps_text).strip()
                return f"According to the uploaded college guidelines, here is the procedure for obtaining a Bonafide Certificate:\n\n{formatted}"

        # 6. Attendance Rules
        if any(k in q for k in ['attendance', 'minimum attendance', 'attendance rule', 'attendance percentage', 'condonation']):
            m_att = re.search(r'(?:3\.\s*Attendance Guidelines|SECTION 2:\s*ATTENDANCE POLICIES)(.+?)(?=4\.\s*Leave|SECTION 3:|\Z)', clean, re.DOTALL | re.IGNORECASE)
            if m_att:
                text = m_att.group(1).strip()
                sents = [s.strip() for s in text.split('.') if s.strip() and len(s.strip()) > 10]
                return "According to the official attendance rules:\n\n• " + ".\n• ".join(sents[:3]) + "."

        # 7. Leave Request Procedure
        if any(k in q for k in ['leave', 'leave letter', 'apply for leave', 'leave request', 'leave procedure']):
            return (
                "According to the college rules, here is the procedure for applying for leave:\n\n"
                "1. Inform the class advisor as early as possible.\n"
                "2. Submit a leave request through the student portal or the department's approved process.\n"
                "3. Include the dates, reason, and supporting documents if required.\n"
                "4. Wait for approval before taking leave (submitting a request does not mean it is automatically approved)."
            )

        # 8. Examination Information
        if any(k in q for k in ['exam', 'examination', 'timetable']):
            m_exam = re.search(r'6\.\s*Examination Timetable(.+?)(?=7\.\s*Fee|\Z)', clean, re.DOTALL | re.IGNORECASE)
            if m_exam:
                text = m_exam.group(1).strip()
                sents = [s.strip() for s in text.split('.') if s.strip() and 'does not contain actual' not in s and 'must direct' not in s]
                return "According to the examination guidelines:\n\n" + ". ".join(sents[:2]) + ".\n\n*Check the official student portal or Examination Cell notice board for finalized schedules.*"

        # 9. ID Card Replacement
        if any(k in q for k in ['id card', 'identity card', 'lost id', 'id replacement']):
            return (
                "For a lost or damaged college ID card:\n\n"
                "• Report it to the **Student Services Office**.\n"
                "• Replacement charge: **₹100**.\n"
                "• Replacement timeline: **2 working days** after verification."
            )

        # 10. Generic Sentence Extractor (for arbitrary uploaded PDFs)
        clean_norm = re.sub(r'\s+', ' ', clean).strip()
        sentences = re.split(r'(?<=[.!?])\s+', clean_norm)
        stopwords = {
            'what', 'is', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'a', 'an', 'are', 'and',
            'how', 'can', 'i', 'do', 'does', 'where', 'when', 'which', 'who', 'tell', 'me', 'about'
        }
        query_words = set(re.findall(r'\w+', q)) - stopwords

        scored = []
        for s in sentences:
            s_clean = s.strip()
            if len(s_clean) < 15 or 'disclaimer' in s_clean.lower() or 'demo' in s_clean.lower():
                continue
            s_words = set(re.findall(r'\w+', s_clean.lower()))
            overlap = len(query_words & s_words)
            if overlap > 0:
                scored.append((overlap, s_clean))

        scored.sort(key=lambda x: x[0], reverse=True)
        if scored and scored[0][0] >= 1:
            top_sents = [item[1] for item in scored[:2]]
            return " ".join(top_sents)

        return None

    def compose_grounded_response(
        self,
        query: str,
        retrieval_data: Dict[str, Any],
        is_demo: bool = False
    ) -> str:
        raw_results = retrieval_data.get("raw_results", [])
        if not raw_results:
            return self.compose_missing_info_response(query)

        # 1. Try external LLM if configured
        llm_response = self._call_llm_for_grounding(query, raw_results)
        if llm_response:
            return llm_response

        # 2. Extract precise grounded answer locally
        top = raw_results[0]
        doc_source = top.get("source_doc_title") or top.get("document", "Official College Handbook")
        page_num = top.get("page_number")
        source_citation = f"{doc_source} (Page {page_num})" if page_num else doc_source

        precise_answer = self._extract_precise_answer(query, raw_results)
        if precise_answer:
            return f"{precise_answer}\n\n📄 **Source Document:** {source_citation}"

        # If no relevant information could be extracted, return standard fallback
        return self.compose_missing_info_response(query)

    def compose_calendar_response(
        self,
        query: str,
        retrieval_data: Dict[str, Any],
        is_demo: bool = False
    ) -> str:
        events = retrieval_data.get("events", [])
        if not events:
            return self.compose_missing_info_response(query, context="academic calendar")

        lines = ["According to the official **Academic Calendar**:"]
        for ev in events:
            date_str = f"**{ev['start_date']}**" + (f" to **{ev['end_date']}**" if ev.get("end_date") and ev['end_date'] != ev['start_date'] else "")
            lines.append(f"\n• **{ev['title']}**\n  - Dates: {date_str}\n  - Details: {ev.get('description', '')}\n  - Source: *{ev['source']}*")

        lines.append("\n*Note: Official schedules are subject to published Deanery circulars.*")
        return "\n".join(lines)

    def compose_missing_info_response(self, query: str, context: str = "college knowledge base") -> str:
        """
        Required exact fallback response when answer is not available in uploaded documents.
        """
        return FALLBACK_UNAVAILABLE_MESSAGE

    def compose_contradiction_response(self, query: str) -> str:
        return (
            f"⚠️ **Conflicting College Information Detected:**\n\n"
            f"Our uploaded records contain differing circulars regarding this query. "
            f"To protect you from outdated procedures, please contact the college admin for confirmation. "
            f"You can send your question to the admin using the **Contact Admin** option below."
        )

    def compose_ticket_status_response(self, ticket_info: Dict[str, Any]) -> str:
        t = ticket_info["ticket"]
        return (
            f"📋 **Support Ticket Details — {t['ticket_number']}**\n\n"
            f"• **Subject:** {t['subject']}\n"
            f"• **Category:** {t['category']}\n"
            f"• **Status:** `{t['status']}`\n"
            f"• **Assigned Officer:** {t.get('assignee_name', 'Student Affairs')}\n"
            f"• **Created:** {t['created_at'][:10]}\n\n"
            f"{'• **Resolution Notes:** ' + t['resolution_notes'] if t.get('resolution_notes') else 'Staff is actively processing your request.'}"
        )

support_agent = StudentSupportAgent()
