import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.routers import documents, study, quiz, planner, progress

app = FastAPI(
    title="AI Study Buddy API", 
    description="Multi-agent study helper powered by FastAPI and Google Antigravity SDK"
)

# CORS middleware for local frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include agent and utility API routers
app.include_router(documents.router)
app.include_router(study.router)
app.include_router(quiz.router)
app.include_router(planner.router)
app.include_router(progress.router)

# Serve the static SPA frontend from the 'frontend' directory at the root
frontend_dir = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
    "frontend"
)

# Auto-create frontend folder to avoid startup mount errors
os.makedirs(frontend_dir, exist_ok=True)

app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
