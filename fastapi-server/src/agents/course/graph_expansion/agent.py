from typing import List

from src.utils.llm import get_llm_service
from src.models.course import GraphExpansionPlan
from src.prompts.course import GRAPH_EXPANSION_SYSTEM_PROMPT, GRAPH_EXPANSION_USER_PROMPT


class GraphExpansionAgent:
    def __init__(self):
        self.llm = get_llm_service()
    
    async def analyze_material(
        self,
        material_content: str,
        course_title: str,
        existing_nodes: List[dict],
        existing_edges: List[dict],
    ) -> GraphExpansionPlan:
        nodes_text = "\n".join([
            f"- {node['id']}: {node['title']} - {node.get('summary', '')[:100]}"
            for node in existing_nodes
        ])

        edges_text = "\n".join([
            f"- {edge['source']} → {edge['target']}"
            for edge in existing_edges
        ])
        
        truncated_content = material_content[:8000]
        if len(material_content) > 8000:
            truncated_content += "\n\n[Content truncated for analysis...]"

        prompt = GRAPH_EXPANSION_USER_PROMPT.format(
            course_title=course_title,
            existing_nodes=nodes_text or "No existing nodes",
            existing_edges=edges_text or "No existing edges",
            material_content=truncated_content
        )

        plan = await self.llm.generate_structured(
            prompt=prompt,
            output_schema=GraphExpansionPlan,
            system_prompt=GRAPH_EXPANSION_SYSTEM_PROMPT
        )
        
        return plan


_graph_expansion_agent = None


def get_graph_expansion_agent() -> GraphExpansionAgent:
    global _graph_expansion_agent
    if _graph_expansion_agent is None:
        _graph_expansion_agent = GraphExpansionAgent()
    return _graph_expansion_agent
