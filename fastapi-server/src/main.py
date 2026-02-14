from dotenv import load_dotenv

load_dotenv()

from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from src.config.settings import settings
from src.db.mongodb import MongoDB
from src.routers import (
    courses,
    chapters,
    quiz,
    chat,
    roadmaps,
    videos,
    materials,
    video_assistant,
    jobs,
    interview,
)
from src.routers.course import flashcards_router, slides_router

UPLOADS_DIR = Path(__file__).parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await MongoDB.connect()
    print("Lumina AI Course Engine started")

    yield

    await MongoDB.close()
    print("Lumina AI Course Engine stopped")

app = FastAPI(
    title="Lumina AI Course Engine",
    description="AI-powered course generation for the Lumina education platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://lumina-frontend-c98f.vercel.app",  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(courses.router, prefix="/api", tags=["Courses"])
app.include_router(chapters.router, prefix="/api", tags=["Chapters"])
app.include_router(quiz.router, prefix="/api", tags=["Quiz"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(flashcards_router, prefix="/api", tags=["Flashcards"])
app.include_router(slides_router, prefix="/api", tags=["Slides"])
app.include_router(roadmaps.router, prefix="/api", tags=["Roadmaps"])
app.include_router(videos.router, prefix="/api", tags=["Videos"])
app.include_router(materials.router, prefix="/api", tags=["Materials"])
app.include_router(video_assistant.router, prefix="/api", tags=["Video Assistant"])
app.include_router(jobs.router, prefix="/api", tags=["Jobs"])
app.include_router(interview.router, prefix="/api", tags=["Interview"])

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "Lumina AI Course Engine is running",
        "version": "0.1.0",
    }


@app.get("/api/languages")
async def get_supported_languages():
    from src.utils.translation import TranslationService

    translator = TranslationService()
    return {"languages": translator.get_supported_languages()}
