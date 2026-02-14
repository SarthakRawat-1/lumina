from typing import Optional, List

from src.utils.llm import get_llm_service
from src.models.jobs.schemas import SearchQueryResult
from src.prompts.jobs.query_prompts import QUERY_SYSTEM_PROMPT, QUERY_USER_PROMPT


class QueryAgent:
    def __init__(self):
        self.llm = get_llm_service()
    
    async def generate_queries(
        self,
        roles: List[str],
        location: Optional[str] = None,
        remote_only: bool = False
    ) -> SearchQueryResult:
        if remote_only:
            location_str = "Remote / Work from home"
        elif location:
            location_str = location
        else:
            location_str = "Any location"
        
        prompt = QUERY_USER_PROMPT.format(
            roles=", ".join(roles[:8]),  
            location=location_str,
            remote_only="Yes" if remote_only else "No"
        )
        
        result = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=SearchQueryResult,
            system_prompt=QUERY_SYSTEM_PROMPT
        )
 
        if not result.queries:
            result.queries = self._generate_fallback_queries(roles, location, remote_only)
        
        return result
    
    def _generate_fallback_queries(
        self,
        roles: List[str],
        location: Optional[str],
        remote_only: bool
    ) -> List[str]:
        queries = []

        for role in roles[:5]:
            queries.append(f"{role} job apply")
            queries.append(f"{role} hiring")

            if location:
                if "india" in location.lower() or "indian" in location.lower():
                    queries.append(f"{role} jobs in india")
                    queries.append(f"{role} jobs india")
                    queries.append(f"{role} jobs mumbai")
                    queries.append(f"{role} jobs bangalore")
                    queries.append(f"{role} jobs hyderabad")
                    queries.append(f"{role} jobs pune")
                    queries.append(f"{role} jobs delhi")
                    queries.append(f"{role} jobs chennai")
                    queries.append(f"{role} jobs gurgaon")
                    queries.append(f"{role} jobs noida")
                else:
                    queries.append(f"{role} jobs {location}")

            if remote_only:
                queries.append(f"{role} remote jobs")
                queries.append(f"{role} work from home")
                queries.append(f"{role} work from home india")  # For India remote jobs

        return queries[:15]

_query_agent: Optional[QueryAgent] = None


def get_query_agent() -> QueryAgent:
    global _query_agent
    if _query_agent is None:
        _query_agent = QueryAgent()
    return _query_agent
