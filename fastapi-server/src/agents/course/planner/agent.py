from src.utils.llm import get_llm_service
from src.models.course import CoursePlan
from src.prompts.course import PLANNER_SYSTEM_PROMPT, PLANNER_USER_PROMPT


class PlannerAgent:
    def __init__(self):
        self.llm = get_llm_service()
    
    async def plan_course(
        self,
        topic: str,
        time_hours: int,
        difficulty: str,
        context: str = None
    ) -> CoursePlan:
        prompt = PLANNER_USER_PROMPT.format(
            topic=topic,
            time_hours=time_hours,
            difficulty=difficulty
        )

        if context:
            prompt += f"\n\nAdditional context from uploaded materials:\n{context}"

        plan = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=CoursePlan,
            system_prompt=PLANNER_SYSTEM_PROMPT
        )
        
        return plan


_planner_agent = None


def get_planner_agent() -> PlannerAgent:
    global _planner_agent
    if _planner_agent is None:
        _planner_agent = PlannerAgent()
    return _planner_agent
