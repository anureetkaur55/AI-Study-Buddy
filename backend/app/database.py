import os
import json
from typing import Dict, List, Any, Optional

DATABASE_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database.json")

class Database:
    def __init__(self, file_path: str = DATABASE_FILE):
        self.file_path = file_path
        self.data = {
            "documents": {},  # file_id -> {filename, text, upload_time}
            "sessions": {},   # session_id -> [messages]
            "progress": {
                "completed_topics": [],
                "quiz_scores": []
            }
        }
        self.load()

    def load(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except Exception:
                # If reading fails, save default structure
                self.save()
        else:
            self.save()

    def save(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
        with open(self.file_path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2)

    # Document management
    def save_document(self, file_id: str, filename: str, text: str, upload_time: str):
        self.data["documents"][file_id] = {
            "filename": filename,
            "text": text,
            "upload_time": upload_time
        }
        self.save()

    def get_documents(self) -> Dict[str, Any]:
        return self.data.get("documents", {})

    def get_document(self, file_id: str) -> Optional[Dict[str, Any]]:
        return self.data.get("documents", {}).get(file_id)

    def delete_document(self, file_id: str):
        if "documents" in self.data and file_id in self.data["documents"]:
            del self.data["documents"][file_id]
            self.save()

    # Session / Chat management
    def save_chat_message(self, session_id: str, role: str, content: str):
        if "sessions" not in self.data:
            self.data["sessions"] = {}
        if session_id not in self.data["sessions"]:
            self.data["sessions"][session_id] = []
        self.data["sessions"][session_id].append({"role": role, "content": content})
        self.save()

    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        return self.data.get("sessions", {}).get(session_id, [])

    # Progress management
    def save_progress(self, completed_topics: List[str], quiz_scores: List[Dict[str, Any]]):
        self.data["progress"] = {
            "completed_topics": completed_topics,
            "quiz_scores": quiz_scores
        }
        self.save()

    def get_progress(self) -> Dict[str, Any]:
        return self.data.get("progress", {"completed_topics": [], "quiz_scores": []})

# Global singleton database instance
db = Database()
