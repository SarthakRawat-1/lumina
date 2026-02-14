from typing import Optional, List
from tavily import TavilyClient

from src.config.settings import settings
from src.models.research_schemas import ResearchResource, ResearchResult


class ResearchService:
    def __init__(self):
        if not settings.tavily_api_key:
            raise ValueError("TAVILY_API_KEY environment variable is required")
        self.client = TavilyClient(api_key=settings.tavily_api_key)
    
    async def research(
        self,
        topic: str,
        context: str = "general",
        max_results: int = 5
    ) -> ResearchResult:
        queries = self._build_queries(topic, context)
        
        all_results = []
        resources = []
        
        for query in queries:
            try:
                response = self.client.search(
                    query=query,
                    search_depth="advanced",
                    max_results=max_results,
                    include_answer=True
                )
                
                all_results.append(response)
                
                for result in response.get("results", []):
                    resources.append(ResearchResource(
                        title=result.get("title", ""),
                        url=result.get("url", ""),
                        snippet=result.get("content", "")[:300]
                    ))
            except Exception as e:
                print(f"⚠️ Research query failed: {query} - {str(e)}")
                continue
        
        raw_content = self._build_raw_content(all_results)
        
        key_facts = self._extract_facts(all_results)
        current_trends = self._extract_trends(all_results, context)
        
        summary = self._build_summary(all_results)
        
        return ResearchResult(
            topic=topic,
            summary=summary,
            key_facts=key_facts,
            resources=resources[:10],  
            current_trends=current_trends,
            raw_content=raw_content
        )
    
    def _build_queries(self, topic: str, context: str) -> List[str]:
        base_queries = [f"{topic}"]
        
        if context == "roadmap":
            return [
                f"{topic} learning roadmap 2024",
                f"{topic} skills requirements career",
                f"best resources learn {topic}",
            ]
        elif context == "course":
            return [
                f"{topic} tutorial guide",
                f"{topic} best practices 2024",
                f"{topic} examples documentation",
            ]
        elif context == "video":
            return [
                f"{topic} explained facts",
                f"{topic} history timeline",
                f"{topic} current trends 2024",
            ]
        elif context == "node_details":
            return [
                f"best free tutorials docs for {topic}",
            ]
        else:
            return [
                f"{topic}",
                f"{topic} guide tutorial",
            ]
    
    def _build_raw_content(self, results: List[dict]) -> str:
        content_parts = []
        
        for response in results:
            if response.get("answer"):
                content_parts.append(f"Summary: {response['answer']}")
            
            for result in response.get("results", [])[:3]:
                content_parts.append(
                    f"Source: {result.get('title', 'Unknown')}\n{result.get('content', '')[:500]}"
                )
        
        return "\n\n---\n\n".join(content_parts)[:8000]  
    
    def _extract_facts(self, results: List[dict]) -> List[str]:
        facts = []
        
        for response in results:
            if response.get("answer"):
                answer = response["answer"]
                sentences = answer.split(". ")[:3]
                facts.extend([s.strip() + "." for s in sentences if s.strip()])
        
        return facts[:10]  
    
    def _extract_trends(self, results: List[dict], context: str) -> List[str]:
        trends = []
        
        trend_keywords = ["trending", "popular", "latest", "new", "2024", "modern", "current"]
        
        for response in results:
            for result in response.get("results", []):
                content = result.get("content", "").lower()
                for keyword in trend_keywords:
                    if keyword in content:
                        sentences = result.get("content", "").split(". ")
                        for sentence in sentences:
                            if keyword.lower() in sentence.lower() and len(sentence) < 200:
                                trends.append(sentence.strip())
                                break
        
        return list(set(trends))[:5]  
    
    def _build_summary(self, results: List[dict]) -> str:
        summaries = []
        
        for response in results:
            if response.get("answer"):
                summaries.append(response["answer"])
        
        if summaries:
            return summaries[0][:500]  
        return ""

_research_service_instance: Optional[ResearchService] = None


def get_research_service() -> ResearchService:
    global _research_service_instance
    if _research_service_instance is None:
        _research_service_instance = ResearchService()
    return _research_service_instance

