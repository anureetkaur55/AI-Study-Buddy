# AI Study Buddy - Multi-Agent Academic Hub

AI Study Buddy is a production-ready web application powered by **FastAPI** on the backend and **Google's Antigravity Python SDK** for multi-agent orchestration. It provides students with a unified portal to upload notes and collaborate with specialized AI agents to optimize their learning lifecycle.

---

## 🏗️ System Architecture

The application implements a decoupled, event-driven multi-agent system:

```
                  +----------------------------------+
                  |           Frontend SPA           |
                  |     (HTML5, Vanilla CSS, JS)     |
                  +----------------------------------+
                                   |
                           (HTTP REST API)
                                   v
                  +----------------------------------+
                  |         FastAPI Backend          |
                  |  - Serves static front-end assets|
                  |  - Manages uploads & persistence |
                  +----------------------------------+
                        |                      |
                 (Local JSON DB)       (Orchestration Loop)
                        v                      v
                  [database.json]     +--------------------+
                                      | Google Antigravity |
                                      |     Python SDK     |
                                      +--------------------+
                                               |
         +------------------+------------------+------------------+
         |                  |                  |                  |
         v                  v                  v                  v
+------------------+ +--------------+ +------------------+ +---------------+
|   Tutor Agent    | |  Quiz Agent  | |  Planner Agent   | |Progress Agent |
| Answers Qs from  | |Generates MCQs| |Designs roadmap   | |Tracks scores, |
| notes, simple lang| |& flashcards | |study calendars   | |suggests review|
+------------------+ +--------------+ +------------------+ +---------------+
```

### 1. Tutor Agent
- **Personality**: Step-by-step explainer, warm, encouraging.
- **Task**: Reads uploaded document text and conversation history to answer student questions.

### 2. Quiz Agent
- **Personality**: Academically rigorous.
- **Task**: Generates interactive multiple-choice questions (MCQs), flashcards, and short-answer prompts as parser-friendly JSON.

### 3. Study Planner Agent
- **Personality**: Time-management optimizer.
- **Task**: Maps syllabus topics into daily calendar study slots leading up to the target exam date.

### 4. Progress Agent
- **Personality**: Syllabus assessor.
- **Task**: Evaluates topic checkboxes and quiz history to output percent metrics and target revision warnings.

---

## 🛠️ Project Structure

```
AI Study Buddy/
├── backend/
│   ├── app/
│   │   ├── agents/            # Google Antigravity Agent configurations
│   │   │   ├── base.py        # Abstract Base Agent wrapper
│   │   │   ├── planner.py     # Study Planner Agent
│   │   │   ├── progress.py    # Progress Agent
│   │   │   ├── quiz.py        # Quiz Agent
│   │   │   └── tutor.py       # Tutor Agent
│   │   ├── routers/           # FastAPI API endpoints
│   │   │   ├── documents.py   # Uploads handler
│   │   │   ├── planner.py     # Calendar APIs
│   │   │   ├── progress.py    # Analytics APIs
│   │   │   ├── quiz.py        # Test generator APIs
│   │   │   └── study.py       # Chat helper APIs
│   │   ├── utils/
│   │   │   └── pdf_extractor.py # PDF/TXT page parser
│   │   ├── config.py          # Environment settings
│   │   ├── database.py        # JSON file DB service
│   │   └── main.py            # FastAPI main router & Static files mount
│   ├── uploads/               # Temporary folder for uploads
│   ├── database.json          # File database
│   ├── requirements.txt       # Dependencies
│   └── run.py                 # Startup script
├── frontend/
│   ├── index.html             # Main Single Page App
│   ├── style.css              # Glassmorphic Dark-Mode CSS
│   └── app.js                 # App state & fetch bindings
├── README.md                  # Setup Guide
└── .env.example               # Environment template
```

---

## 🚀 Setup & Execution Guide

### Prerequisites
- **Python**: Version `3.10` or higher.
- **API Access**: A standard Google Gemini API key (from Google AI Studio) OR Google Cloud Platform credentials (if configuring Vertex AI).

### 1. Environment Configurations
Create a `.env` file in the project root directory and add your credentials:
```env
# Standard Gemini API Key
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Optional: Google Cloud Vertex AI configurations
# USE_VERTEX="true"
# GCP_PROJECT="your-gcp-project"
# GCP_LOCATION="us-central1"
```

### 2. Dependency Setup
We recommend setting up a Python virtual environment:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt
```

### 3. Running the Server
Launch the backend application:
```bash
python backend/run.py
```
This runs the application on **`http://127.0.0.1:8000`** with hot-reloading enabled.

### 4. Navigating the App
Open your web browser and navigate to:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

1. **Dashboard**: Drag and drop a PDF or text file notes. Choose a file to mark it active.
2. **Tutor Agent**: Chat with your active study guide. Ask it to explain concepts.
3. **Quiz Agent**: Generate MCQs, test questions, or flip flashcards.
4. **Planner Agent**: Enter your syllabus topics and exam date to design a calendar schedule.
5. **Progress Agent**: Mark off completed topics from your planner and fetch analytics and revision suggestions!
