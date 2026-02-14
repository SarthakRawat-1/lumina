from src.utils.llm import get_llm_service
from src.models.course import QuizQuestions
from src.prompts.course import TESTER_SYSTEM_PROMPT, TESTER_USER_PROMPT


class TesterAgent:  
    def __init__(self):
        self.llm = get_llm_service()
    
    async def generate_questions(
        self,
        title: str,
        summary: str,
        content: str,
        num_mcq: int = 3,
        num_open_text: int = 2
    ) -> QuizQuestions:
        max_content_length = 3000
        if len(content) > max_content_length:
            content = content[:max_content_length] + "..."

        prompt = TESTER_USER_PROMPT.format(
            title=title,
            summary=summary,
            content=content
        )

        if num_mcq != 3 or num_open_text != 2:
            prompt = prompt.replace(
                "- 3 multiple choice questions\n- 2 open-text questions",
                f"- {num_mcq} multiple choice questions\n- {num_open_text} open-text questions"
            )
        
        prompt += "\n\nNOTE: The content is in Markdown format. Analyze the text, headings, and concepts to generate relevant questions."

        questions = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=QuizQuestions,
            system_prompt=TESTER_SYSTEM_PROMPT
        )
        
        return questions


_tester_agent = None


def get_tester_agent() -> TesterAgent:
    global _tester_agent
    if _tester_agent is None:
        _tester_agent = TesterAgent()
    return _tester_agent
