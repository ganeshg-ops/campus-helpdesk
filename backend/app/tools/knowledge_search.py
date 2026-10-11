import time
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.rag.vector_store import retriever
from app.models import ToolExecutionLog

def search_college_knowledge(
    query: str,
    db: Session,
    category: Optional[str] = None,
    conversation_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Tool 1: Real College Knowledge Search.
    Retrieves approved FAQs and indexed document passages with citations.
    """
    start_time = time.time()
    query_str = (query or "").strip()

    if not query_str:
        return {
            "success": False,
            "error": "Query cannot be empty",
            "results": [],
            "count": 0
        }

    results = retriever.search(query=query_str, db=db, category=category, top_k=4)
    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    # Log tool execution to database
    try:
        log_entry = ToolExecutionLog(
            conversation_id=conversation_id,
            tool_name="college_knowledge_search",
            input_data=json.dumps({"query": query_str, "category": category}),
            output_data=json.dumps({"result_count": len(results), "top_titles": [r["title"] for r in results]}),
            status="success" if results else "empty",
            execution_time_ms=elapsed_ms
        )
        db.add(log_entry)
        db.commit()
    except Exception:
        db.rollback()

    return {
        "success": True,
        "query": query_str,
        "count": len(results),
        "execution_time_ms": elapsed_ms,
        "results": results
    }
