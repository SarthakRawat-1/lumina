from src.utils.llm import get_llm_service
from src.models.course import GradingResult
from src.prompts.course import GRADER_SYSTEM_PROMPT, GRADER_USER_PROMPT


class GraderAgent:
    
    def __init__(self):
        self.llm = get_llm_service()
    
    async def grade_answer(
        self,
        question: str,
        expected_answer: str,
        grading_criteria: str,
        user_answer: str
    ) -> GradingResult:
        prompt = GRADER_USER_PROMPT.format(
            question=question,
            expected_answer=expected_answer,
            grading_criteria=grading_criteria,
            user_answer=user_answer
        )

        result = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=GradingResult,
            system_prompt=GRADER_SYSTEM_PROMPT
        )

        result.is_correct = result.score >= 70
        
        return result


_grader_agent = None


def get_grader_agent() -> GraderAgent:
    global _grader_agent
    if _grader_agent is None:
        _grader_agent = GraderAgent()
    return _grader_agent
