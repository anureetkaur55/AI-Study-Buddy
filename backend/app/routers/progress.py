from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.database import db
from backend.app.agents.progress import ProgressAgent
from typing import List, Dict, Any

router = APIRouter(prefix="/api/progress", tags=["progress"])
progress_agent = ProgressAgent()

class ProgressRequest(BaseModel):
    all_topics: List[str]
    completed_topics: List[str]
    quiz_scores: List[Dict[str, Any]]

@router.get("/status")
async def get_progress_status():
    """
    Retrieves the last saved progress state (completed topics and quiz performance logs).
    """
    return db.get_progress()

@router.post("/analyze")
async def analyze_progress_status(req: ProgressRequest):
    """
    Triggers the Progress Agent to review completion levels and performance,
    generating a progress report, revision recommendations, and tips. Saves status.
    """
    try:
        report = await progress_agent.analyze_progress(
            all_topics=req.all_topics,
            completed_topics=req.completed_topics,
            quiz_scores=req.quiz_scores
        )
        # Save current checklist and quiz logs to database
        db.save_progress(
            completed_topics=req.completed_topics,
            quiz_scores=req.quiz_scores
        )
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Progress Agent failed: {str(e)}")
