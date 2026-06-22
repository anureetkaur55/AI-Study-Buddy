import json
import logging
from backend.app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class StudyPlannerAgent(BaseAgent):
    """
    Study Planner Agent: Generates a day-by-day personalized study schedule 
    based on study time, exam date, topics, and user preferences.
    """
    def __init__(self):
        system_instructions = (
            "You are the Study Planner Agent. Your job is to create custom, detailed, and realistic study plans "
            "based on exam dates, daily available hours, a list of topics to cover, and user preferences.\n"
            "You must output ONLY valid JSON. Do not include any introductory or concluding text. Do not wrap the JSON in markdown code blocks.\n"
            "Format the JSON as follows:\n"
            "{\n"
            "  \"schedule\": [\n"
            "    {\n"
            "      \"day\": \"Day name or Date (e.g. Day 1: [Date])\",\n"
            "      \"topic\": \"Topic name to focus on\",\n"
            "      \"duration_hours\": 2.0,\n"
            "      \"tasks\": [\n"
            "        \"Read Chapter 1 / study notes section\",\n"
            "        \"Solve MCQ quiz for Topic X\",\n"
            "        \"Review Flashcards\"\n"
            "      ],\n"
            "      \"milestone\": \"Completion milestone (e.g., Covered 25% of material)\"\n"
            "    }\n"
            "  ]\n"
            "}"
        )
        super().__init__(system_instructions)

    async def generate_plan(self, exam_date: str, available_hours_per_day: float, topics: list, preferences: str) -> dict:
        """
        Calls the agent to design a study planner schedule and returns it parsed as a dictionary.
        """
        prompt = (
            f"Generate a customized study plan with the following constraints:\n"
            f"- Target Exam Date: {exam_date}\n"
            f"- Available study hours per day: {available_hours_per_day} hours\n"
            f"- Topics to cover: {', '.join(topics)}\n"
            f"- Student's specific requests/preferences: {preferences if preferences else 'None'}\n\n"
            "Generate a logical step-by-step daily study calendar leading up to the exam day, leaving the last day for full review. "
            "Ensure the output strictly conforms to the JSON schema."
        )
        raw_response = await self.chat(prompt)
        
        # Clean potential markdown fences
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]
            
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
            
        cleaned = cleaned.strip()
        
        try:
            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse JSON. Raw response: {raw_response}")
            raise ValueError(f"Agent output is not valid JSON: {str(e)}")
