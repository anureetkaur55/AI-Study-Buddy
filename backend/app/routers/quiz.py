from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.database import db
from backend.app.agents.quiz import QuizAgent

router = APIRouter(prefix="/api/quiz", tags=["quiz"])
quiz_agent = QuizAgent()

class QuizRequest(BaseModel):
    file_id: str
    quiz_type: str  # mcq, short_answer, flashcard
    num_questions: int = 5

@router.post("/generate")
async def generate_quiz(req: QuizRequest):
    """
    Triggers the Quiz Agent to read notes and generate questions of a specified type.
    """
    if req.quiz_type not in ["mcq", "short_answer", "flashcard"]:
        raise HTTPException(
            status_code=400, 
            detail="Invalid quiz type. Must be 'mcq', 'short_answer', or 'flashcard'."
        )
        
    doc = db.get_document(req.file_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Selected study material not found.")
        
    try:
        quiz_data = await quiz_agent.generate_quiz(
            document_text=doc["text"],
            quiz_type=req.quiz_type,
            num_questions=req.num_questions
        )
        return quiz_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz Agent failed to generate quiz: {str(e)}")
