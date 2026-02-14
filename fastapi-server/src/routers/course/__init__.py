"""
Course Routers Package

Exports flashcard and slide routers.
"""
from .flashcards import router as flashcards_router
from .slides import router as slides_router

__all__ = ["flashcards_router", "slides_router"]
