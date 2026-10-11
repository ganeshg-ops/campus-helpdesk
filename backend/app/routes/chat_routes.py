import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Conversation, ConversationMessage
from app.auth import get_current_user
from app.schemas import ChatRequest, ChatResponse, ConversationResponse, MessageResponse
from app.agents.orchestrator import campus_orchestrator

router = APIRouter(prefix="/api/chat", tags=["AI Chat Assistant"])

@router.post("", response_model=ChatResponse)
def chat_with_agent(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Core conversational endpoint triggering the multi-agent ReAct loop.
    Returns grounded answer, citations, and 6-stage workflow timeline.
    """
    result = campus_orchestrator.run_react_loop(
        query=req.message,
        user=current_user,
        db=db,
        conversation_id=req.conversation_id,
        category_override=req.category_filter
    )
    return result

@router.get("/conversations", response_model=List[ConversationResponse])
def get_user_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List conversations belonging to the authenticated user."""
    convs = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()
    return convs

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation_history(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch full message history for a conversation with steps and sources."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found or unauthorized.")

    # Parse JSON fields in messages
    formatted_messages = []
    for m in conv.messages:
        steps = json.loads(m.steps_json) if m.steps_json else None
        sources = json.loads(m.sources_json) if m.sources_json else None
        formatted_messages.append({
            "id": m.id,
            "sender": m.sender,
            "content": m.content,
            "steps": steps,
            "sources": sources,
            "created_at": m.created_at
        })

    return {
        "id": conv.id,
        "title": conv.title,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "messages": formatted_messages
    }

@router.delete("/conversations")
def clear_all_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete all conversations and messages belonging to the authenticated user."""
    convs = db.query(Conversation).filter(Conversation.user_id == current_user.id).all()
    count = len(convs)
    for conv in convs:
        db.delete(conv)
    db.commit()
    return {"success": True, "message": f"Successfully deleted {count} conversations."}

@router.delete("/conversations/{conversation_id}")
def clear_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation and clear its session memory."""
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    db.delete(conv)
    db.commit()
    return {"success": True, "message": "Conversation successfully cleared."}
