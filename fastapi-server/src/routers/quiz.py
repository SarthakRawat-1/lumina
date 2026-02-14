from fastapi import APIRouter

from src.models.schemas import AnswerSubmit, AnswerResult
from src.models.course.quiz_schemas import QuestionsResponse
from src.services.course.quiz_service import get_quiz_service

router = APIRouter()

@router.get("/chapters/{chapter_id}/questions", response_model=QuestionsResponse)
async def get_questions(chapter_id: str):
    quiz_service = get_quiz_service()
    questions = await quiz_service.get_chapter_questions(chapter_id)
    return QuestionsResponse(questions=questions, total=len(questions))


@router.post("/chapters/{chapter_id}/questions/{question_id}/answer", response_model=AnswerResult)
async def submit_answer(chapter_id: str, question_id: str, answer: AnswerSubmit):
    quiz_service = get_quiz_service()
    return await quiz_service.grade_answer(chapter_id, question_id, answer.answer)
