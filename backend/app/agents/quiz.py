import json
import logging
from backend.app.agents.base import BaseAgent

logger = logging.getLogger(__name__)

class QuizAgent(BaseAgent):
    """
    Quiz Agent: Generates multiple-choice questions (MCQs), short-answer questions, 
    and flashcards from provided study materials. Returns structured JSON data.
    """
    def __init__(self):
        system_instructions = (
            "You are the Quiz Agent. Your job is to read the provided study materials and generate high-quality, "
            "academically challenging quizzes. You can generate MCQs, short-answer questions, or flashcards.\n"
            "You must output ONLY valid JSON. Do not include any introductory or concluding text. Do not wrap the JSON in markdown code blocks.\n"
            "Format the JSON depending on the requested type:\n"
            "\n"
            "1. MCQ schema:\n"
            "{\n"
            "  \"quiz_type\": \"mcq\",\n"
            "  \"items\": [\n"
            "    {\n"
            "      \"question\": \"Question text here\",\n"
            "      \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
            "      \"answer\": \"The correct option text exactly\",\n"
            "      \"explanation\": \"Explanation of why this option is correct\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "\n"
            "2. Short-Answer schema:\n"
            "{\n"
            "  \"quiz_type\": \"short_answer\",\n"
            "  \"items\": [\n"
            "    {\n"
            "      \"question\": \"Question text here\",\n"
            "      \"answer\": \"The standard model answer\",\n"
            "      \"explanation\": \"Explanation of key concepts that should be included in the student's response\"\n"
            "    }\n"
            "  ]\n"
            "}\n"
            "\n"
            "3. Flashcard schema:\n"
            "{\n"
            "  \"quiz_type\": \"flashcard\",\n"
            "  \"items\": [\n"
            "    {\n"
            "      \"front\": \"Term or question on the front side\",\n"
            "      \"back\": \"Definition or answer on the back side\"\n"
            "    }\n"
            "  ]\n"
            "}"
        )
        super().__init__(system_instructions)

    async def generate_quiz(self, document_text: str, quiz_type: str, num_questions: int) -> dict:
        """
        Calls the agent to generate questions and parses the output into a dictionary.
        """
        prompt = (
            f"Read the following study material:\n\n{document_text[:50000]}\n\n"
            f"Task: Generate exactly {num_questions} items of type '{quiz_type}'.\n"
            "Respond strictly in JSON format. Ensure all strings are correctly quoted and escaped."
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
