import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.app.database import db
from backend.app.agents.tutor import TutorAgent

router = APIRouter(prefix="/api/tutor", tags=["tutor"])
tutor_agent = TutorAgent()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    file_id: str

@router.post("/chat")
async def chat_with_tutor(req: ChatRequest):
    """
    Takes student message, reads history, fetches the relevant document,
    passes it to the Tutor Agent using Google Antigravity SDK, and returns response.
    """
    doc = db.get_document(req.file_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Selected study material not found.")
        
    session_id = req.session_id
    if not session_id or session_id.strip() == "":
        session_id = str(uuid.uuid4())
        
    history = db.get_session_history(session_id)
    
    try:
        reply = await tutor_agent.answer_question(
            document_title=doc["filename"],
            document_text=doc["text"],
            history=history,
            question=req.message
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tutor Agent failed to respond: {str(e)}")
        
    # Save conversation turn
    db.save_chat_message(session_id, "user", req.message)
    db.save_chat_message(session_id, "assistant", reply)
    
    return {
        "reply": reply,
        "session_id": session_id
    }

@router.get("/history/{session_id}")
async def get_chat_history(session_id: str):
    """
    Retrieves the full chat history for a session.
    """
    return db.get_session_history(session_id)
