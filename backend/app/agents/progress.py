import json
import logging
from backend.app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class ProgressAgent(BaseAgent):
    """
    Progress Agent: Evaluates a student's current learning progress, 
    calculates completion percentage, identifies revision needs, and generates advice.
    """
    def __init__(self):
        system_instructions = (
            "You are the Progress Agent. Your job is to analyze study progress and performance data, "
            "then generate a comprehensive progress report. "
            "You calculate progress completion percentage (based on completed topics vs total required), "
            "recommend topics for revision based on low quiz scores or pending status, and provide general study tips.\n"
            "You must output ONLY valid JSON. Do not include any introductory or concluding text. Do not wrap the JSON in markdown code blocks.\n"
            "Format the JSON as follows:\n"
            "{\n"
            "  \"completion_percentage\": 65.0,\n"
            "  \"revision_suggestions\": [\n"
            "    {\n"
            "      \"topic\": \"Topic name\",\n"
            "      \"reason\": \"Low quiz score (40%) or not yet studied\",\n"
            "      \"action\": \"Suggest a revision action (e.g. Re-read section X or retry the quiz)\"\n"
            "    }\n"
            "  ],\n"
            "  \"tips\": [\n"
            "    \"Study tip 1\",\n"
            "    \"Study tip 2\"\n"
            "  ]\n"
            "}"
        )
        super().__init__(system_instructions)

    async def analyze_progress(self, all_topics: list, completed_topics: list, quiz_scores: list) -> dict:
        """
        Processes completed topics and quiz results to generate revision pointers and tips.
        """
        prompt = (
            f"Please generate a progress report for the student with these details:\n"
            f"- Total Topic Syllabus: {', '.join(all_topics)}\n"
            f"- Completed Topics: {', '.join(completed_topics)}\n"
            f"- Quiz Scores history: {json.dumps(quiz_scores)}\n\n"
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
