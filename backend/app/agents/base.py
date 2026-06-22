import os
from dotenv import load_dotenv
from google.antigravity import Agent, LocalAgentConfig

# Load environment variables
load_dotenv()

class BaseAgent:
    """
    Base class for orchestrating AI agents using Google's Antigravity SDK.
    """
    def __init__(self, system_instructions: str):
        self.system_instructions = system_instructions

    def get_config(self) -> LocalAgentConfig:
        """
        Builds the LocalAgentConfig. If Vertex AI credentials are present, 
        it uses Vertex configuration, otherwise falls back to standard Gemini configuration.
        """
        project = os.getenv("GCP_PROJECT")
        location = os.getenv("GCP_LOCATION", "us-central1")
        use_vertex = os.getenv("USE_VERTEX", "false").lower() == "true"

        if use_vertex and project:
            return LocalAgentConfig(
                system_instructions=self.system_instructions,
                vertex=True,
                project=project,
                location=location
            )
        else:
            # Standard setup, which uses GEMINI_API_KEY from environment variables
            return LocalAgentConfig(
                system_instructions=self.system_instructions
            )

    async def chat(self, prompt: str) -> str:
        """
        Initiates a single-turn session with the agent and returns the text response.
        """
        config = self.get_config()
        async with Agent(config) as agent:
            response = await agent.chat(prompt)
            return await response.text()
