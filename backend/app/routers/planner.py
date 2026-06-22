from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.app.agents.planner import StudyPlannerAgent
from typing import List, Optional

router = APIRouter(prefix="/api/planner", tags=["planner"])
planner_agent = StudyPlannerAgent()

class PlannerRequest(BaseModel):
    exam_date: str
    available_hours_per_day: float
    topics: List[str]
    preferences: Optional[str] = ""

@router.post("/generate")
async def generate_schedule(req: PlannerRequest):
    """
    Triggers the Study Planner Agent to design a personalized day-by-day study guide.
    """
    if not req.topics or len(req.topics) == 0:
        raise HTTPException(
            status_code=400, 
            detail="Topics list cannot be empty. Please specify the syllabus areas to study."
        )
        
    try:
        plan_data = await planner_agent.generate_plan(
            exam_date=req.exam_date,
            available_hours_per_day=req.available_hours_per_day,
            topics=req.topics,
            preferences=req.preferences
        )
        return plan_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Study Planner Agent failed: {str(e)}")
