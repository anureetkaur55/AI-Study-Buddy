from backend.app.agents.base import BaseAgent
from typing import List, Dict

class TutorAgent(BaseAgent):
    """
    Tutor Agent: Answers questions using uploaded study materials as context 
    and explains concepts in simple, structured language.
    """
    def __init__(self):
        system_instructions = (
            "You are the Tutor Agent, an encouraging and highly clear academic tutor. "
            "Your purpose is to help students understand their study materials. "
            "Use simple analogies, structure explanations step-by-step, and clarify complex terms. "
            "If the student's question is not answered in the provided materials, use your broad academic knowledge, "
            "but clarify that the information was not in the original notes. Always maintain a warm, supportive tone."
        )
        super().__init__(system_instructions)

    async def answer_question(self, document_title: str, document_text: str, history: List[Dict[str, str]], question: str) -> str:
        """
        Formulates a prompt combining study materials, chat history, and the new student question,
        then calls the Google Antigravity Agent.
        """
        prompt_parts = []
        prompt_parts.append(f"Study Material Title: {document_title}")
        prompt_parts.append("=== STUDY MATERIAL CONTENT ===")
        prompt_parts.append(document_text[:60000])  # Safe limit for model token processing
        prompt_parts.append("==============================\n")
        
        if history:
            prompt_parts.append("Previous Conversation:")
            for msg in history:
                role = "Student" if msg["role"] == "user" else "Tutor"
                prompt_parts.append(f"{role}: {msg['content']}")
            prompt_parts.append("")

        prompt_parts.append(f"Student's Current Question: {question}")
        prompt_parts.append("Tutor:")
        
        prompt = "\n".join(prompt_parts)
        return await self.chat(prompt)
