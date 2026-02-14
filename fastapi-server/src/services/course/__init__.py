"""
Course Services Package

Exports flashcard and slide services.
"""
from .flashcard_service import generate_chapter_flashcards, generate_course_flashcards
from .slide_service import generate_chapter_slides, generate_course_slides

__all__ = [
    "generate_chapter_flashcards",
    "generate_course_flashcards",
    "generate_chapter_slides",
    "generate_course_slides",
]
