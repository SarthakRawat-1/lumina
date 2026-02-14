from typing import List, Optional

from src.utils.llm import get_llm_service
from src.prompts.roadmap.roadmap_prompts import ROADMAP_SYSTEM_PROMPT, NODE_DETAILS_SYSTEM_PROMPT, ROADMAP_USER_PROMPT_TEMPLATE, NODE_DETAILS_USER_PROMPT_TEMPLATE

class RoadmapAgent:
    def __init__(self):
        self.llm = get_llm_service(provider="groq")
        self._research_agent = None

    def _get_research_service(self):
        if self._research_agent is None:
            try:
                from src.utils.research import get_research_service
                self._research_agent = get_research_service()
            except ValueError:
                self._research_agent = None
        return self._research_agent

    async def generate_roadmap(
        self,
        topic: str,
        goal: str = None,
        skill_level: str = "beginner"
    ):
        research_context = ""
        research_agent = self._get_research_service()

        if research_agent:
            try:
                print(f"🔍 Researching: {topic}")
                research = await research_agent.research(topic, context="roadmap")
                research_context = f"""

RESEARCH FINDINGS:
{research.summary}

Key Skills/Topics Found:
{chr(10).join('- ' + fact for fact in research.key_facts[:5])}

Current Industry Trends:
{chr(10).join('- ' + trend for trend in research.current_trends[:3])}

Use this research to ensure the roadmap includes current, relevant topics."""
                print(f"Research complete - {len(research.resources)} resources found")
            except Exception as e:
                print(f"Research failed, continuing without: {str(e)}")

        goal_text = f"Goal: {goal}" if goal else ""
        
        node_ranges = {
            "beginner": "50-70",
            "intermediate": "70-90",
            "advanced": "80-100"
        }
        node_range = node_ranges.get(skill_level, "70-90")
        
        prompt = ROADMAP_USER_PROMPT_TEMPLATE.format(
            topic=topic,
            skill_level=skill_level,
            goal_text=goal_text,
            research_context=research_context,
            node_range=node_range
        )

        from src.models.roadmap.schemas import RoadmapStructure

        result = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=RoadmapStructure,
            system_prompt=ROADMAP_SYSTEM_PROMPT
        )

        return result

    async def generate_node_details(
        self,
        node_label: str,
        roadmap_context: str
    ):
        research_context = ""
        research_agent = self._get_research_service()

        if research_agent:
            try:
                print(f"🔍 Researching node details: {node_label}")
                query_context = f"{roadmap_context} {node_label}"
                research = await research_agent.research(query_context, context="node_details", max_results=5)
                
                research_context = f"""
RESEARCH FINDINGS (Use these verified links and facts):
{research.summary}

VERIFIED RESOURCES (Prioritize these links):
{chr(10).join(f"- [{res.title}]({res.url})" for res in research.resources[:5])}
"""
                print(f"Node research complete - {len(research.resources)} resources found")
            except Exception as e:
                print(f"Node research failed, continuing without: {str(e)}")

        prompt = NODE_DETAILS_USER_PROMPT_TEMPLATE.format(
            node_label=node_label,
            roadmap_context=roadmap_context,
            research_context=research_context
        )

        from src.models.roadmap.schemas import NodeDetails

        result = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=NodeDetails,
            system_prompt=NODE_DETAILS_SYSTEM_PROMPT
        )

        return result


_roadmap_agent = None


def get_roadmap_agent():
    global _roadmap_agent
    if _roadmap_agent is None:
        _roadmap_agent = RoadmapAgent()
    return _roadmap_agent

