from typing import List, Union

from src.models.schemas import (
    MCQQuestion,
    OpenTextQuestion,
    MCQOption,
    QuestionType,
    AnswerResult
)
from src.agents.course.grader import get_grader_agent
from src.utils.translation import get_translation_service
from src.db.mongodb import MongoDB
from src.db.helpers import get_chapter_or_404, get_course_language, get_question_or_404


class QuizService:
    async def get_chapter_questions(
        self,
        chapter_id: str
    ) -> List[Union[MCQQuestion, OpenTextQuestion]]:
        questions_col = MongoDB.questions()

        chapter = await get_chapter_or_404(chapter_id)
        course_id = chapter.get("course_id", "")
        language = await get_course_language(course_id)
        translator = get_translation_service() if language != "en" else None

        cursor = questions_col.find({"chapter_id": chapter_id})
        
        question_list = []
        async for q in cursor:
            question_text = q.get("question_text", "")

            if translator:
                question_text = await translator.translate(question_text, language)
            
            if q.get("question_type") == "mcq":
                options = q.get("options", [])
                if translator:
                    for opt in options:
                        opt["text"] = await translator.translate(opt.get("text", ""), language)
                
                question_list.append(MCQQuestion(
                    id=str(q["_id"]),
                    chapter_id=q.get("chapter_id", ""),
                    question_type=QuestionType.MCQ,
                    question_text=question_text,
                    options=[MCQOption(**opt) for opt in options],
                    correct_answer=q.get("correct_answer", "a"),
                ))
            else:
                question_list.append(OpenTextQuestion(
                    id=str(q["_id"]),
                    chapter_id=q.get("chapter_id", ""),
                    question_type=QuestionType.OPEN_TEXT,
                    question_text=question_text,
                    expected_answer=q.get("expected_answer", ""),
                ))
        
        return question_list
    
    async def grade_answer(
        self,
        chapter_id: str,
        question_id: str,
        user_answer: str
    ) -> AnswerResult:
        chapter = await get_chapter_or_404(chapter_id)
        course_id = chapter.get("course_id", "")
        language = await get_course_language(course_id)
        translator = get_translation_service() if language != "en" else None

        question = await get_question_or_404(question_id, chapter_id)
        
        question_type = question.get("question_type")
        
        if question_type == "mcq":
            correct_answer = question.get("correct_answer", "")
            is_correct = user_answer.lower().strip() == correct_answer.lower().strip()
            explanation = question.get("explanation", "")
            
            if is_correct:
                feedback = explanation
            else:
                feedback = f"The correct answer was '{correct_answer}'. {explanation}"
            
            if translator:
                feedback = await translator.translate(feedback, language)
            
            return AnswerResult(
                is_correct=is_correct,
                score=100 if is_correct else 0,
                feedback=feedback,
                correct_answer=correct_answer
            )
        
        else:
            grader = get_grader_agent()
            
            result = await grader.grade_answer(
                question=question.get("question_text", ""),
                expected_answer=question.get("expected_answer", ""),
                grading_criteria=question.get("grading_criteria", ""),
                user_answer=user_answer
            )
            
            feedback = result.feedback
            if translator:
                feedback = await translator.translate(feedback, language)
            
            return AnswerResult(
                is_correct=result.is_correct,
                score=result.score,
                feedback=feedback,
            )


_quiz_service = None


def get_quiz_service() -> QuizService:
    global _quiz_service
    if _quiz_service is None:
        _quiz_service = QuizService()
    return _quiz_service
