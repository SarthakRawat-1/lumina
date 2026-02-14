from datetime import datetime
from typing import List, Dict, Any

from src.utils.llm import LLMService
from src.services.roadmap.roadmap_service import get_roadmap_service


class RoadmapChatService:
    def __init__(self):
        self.llm = LLMService(provider="groq", temperature=0.7)
        self.roadmap_service = get_roadmap_service()
    
    def _build_roadmap_context(self, roadmap: Dict[str, Any], user_progress: Dict[str, str] = None) -> str:
        nodes = roadmap.get("nodes", [])

        main_topics = [n for n in nodes if n.get("type") == "main"]
        subtopics = [n for n in nodes if n.get("type") == "subtopic"]

        context_parts = [
            f"## Roadmap: {roadmap.get('title', 'Learning Roadmap')}",
            f"**Topic**: {roadmap.get('topic', 'Unknown')}",
            f"**Description**: {roadmap.get('description', '')}",
            "",
            "### Main Topics in this Roadmap:",
        ]
        
        for i, topic in enumerate(main_topics, 1):
            label = topic.get("label", "Unknown")
            context_parts.append(f"{i}. {label}")

            children = [s for s in subtopics if s.get("parent_id") == topic.get("id")]
            for child in children:
                context_parts.append(f"   - {child.get('label', '')}")

        if user_progress:
            completed = [k for k, v in user_progress.items() if v == "completed"]
            in_progress = [k for k, v in user_progress.items() if v == "in_progress"]
            
            if completed or in_progress:
                context_parts.append("")
                context_parts.append("### User Progress:")
                if completed:
                    context_parts.append(f"- Completed: {len(completed)} topics")
                if in_progress:
                    context_parts.append(f"- In Progress: {len(in_progress)} topics")
        
        return "\n".join(context_parts)
    
    def _get_system_prompt(self, roadmap_context: str) -> str:
        return f"""You are an AI Tutor helping a user learn from their personalized learning roadmap.

{roadmap_context}

Instructions:
1. Answer questions specifically about the topics in this roadmap
2. Provide clear, concise explanations suitable for learners
3. When asked about a topic, explain what it is and why it's important in the learning journey
4. Suggest the order of learning when appropriate
5. Be encouraging and supportive
6. If asked about something not in the roadmap, politely mention it's outside the current scope but provide a brief answer if possible

Keep responses focused, helpful, and under 300 words unless a detailed explanation is specifically requested."""

    async def send_message(
        self,
        roadmap_id: str,
        message: str,
        chat_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        roadmap = await self.roadmap_service.get_roadmap(roadmap_id)

        roadmap_context = self._build_roadmap_context(roadmap)
        system_prompt = self._get_system_prompt(roadmap_context)

        conversation = ""
        if chat_history:
            for msg in chat_history[-6:]:  
                role = msg.get("role", "user")
                content = msg.get("content", "")
                conversation += f"{role.capitalize()}: {content}\n"
        
        conversation += f"User: {message}\n"
        conversation += "Assistant:"

        response = await self.llm.generate(
            prompt=conversation,
            system_prompt=system_prompt
        )
        
        return {
            "message": response.strip(),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_suggested_questions(self, roadmap: Dict[str, Any]) -> List[str]:
        nodes = roadmap.get("nodes", [])
        main_topics = [n for n in nodes if n.get("type") == "main"][:3]
        
        suggestions = []
        for topic in main_topics:
            label = topic.get("label", "")
            if label:
                suggestions.append(f"What is {label} and why should I learn it?")

        suggestions.extend([
            "What's the best order to learn these topics?",
            "How long will it take to complete this roadmap?",
        ])
        
        return suggestions[:4]  


_roadmap_chat_service = None


def get_roadmap_chat_service() -> RoadmapChatService:
    global _roadmap_chat_service
    if _roadmap_chat_service is None:
        _roadmap_chat_service = RoadmapChatService()
    return _roadmap_chat_service
