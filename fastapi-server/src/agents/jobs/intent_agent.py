from typing import Optional, List

from src.utils.llm import get_llm_service
from src.models.jobs.schemas import RoleExpansionResult
from src.prompts.jobs.intent_prompts import (
    INTENT_SYSTEM_PROMPT,
    INTENT_USER_PROMPT_RESUME,
    INTENT_USER_PROMPT_MANUAL,
)


class IntentAgent:
    def __init__(self):
        self.llm = get_llm_service()
    
    async def expand_roles_from_resume(
        self,
        skills: List[str],
        experience_years: int,
        domains: List[str],
        education: List[dict]
    ) -> RoleExpansionResult:
        edu_str = ", ".join([
            f"{e.get('degree', 'Degree')} from {e.get('institution', 'Institution')}"
            for e in education[:3]  
        ]) if education else "Not specified"
        
        prompt = INTENT_USER_PROMPT_RESUME.format(
            skills=", ".join(skills[:15]),  
            experience_years=experience_years,
            domains=", ".join(domains[:5]),
            education=edu_str
        )
        
        result = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=RoleExpansionResult,
            system_prompt=INTENT_SYSTEM_PROMPT
        )
        
        return result
    
    async def expand_roles_from_manual(
        self,
        target_role: str,
        skills: List[str],
        experience_years: int,
        preferred_industries: List[str]
    ) -> RoleExpansionResult:
        prompt = INTENT_USER_PROMPT_MANUAL.format(
            target_role=target_role,
            skills=", ".join(skills[:15]),
            experience_years=experience_years,
            industries=", ".join(preferred_industries[:5]) if preferred_industries else "Any"
        )
        
        result = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=RoleExpansionResult,
            system_prompt=INTENT_SYSTEM_PROMPT
        )

        if target_role and target_role not in result.primary_roles:
            result.primary_roles.insert(0, target_role)
        
        return result


_intent_agent: Optional[IntentAgent] = None


def get_intent_agent() -> IntentAgent:
    global _intent_agent
    if _intent_agent is None:
        _intent_agent = IntentAgent()
    return _intent_agent
