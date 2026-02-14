import os
import logging
from typing import List, Optional

from src.utils.llm import get_llm_service
from src.models.course import SlideContent, SlideGenerationOutput
from src.prompts.course import HTML_SYSTEM_PROMPT, SLIDE_USER_PROMPT


logger = logging.getLogger(__name__)


class SlideAgent:
    def __init__(self):
        self.llm = get_llm_service()
        self.revealjs_docs = self._load_revealjs_docs()
    
    def _load_revealjs_docs(self) -> str:
        docs = []
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            docs_dir = os.path.join(current_dir, "revealjs_docs")
            
            if os.path.exists(docs_dir):
                for filename in sorted(os.listdir(docs_dir)):
                    if filename.endswith((".txt", ".md")):
                        with open(os.path.join(docs_dir, filename), "r", encoding="utf-8") as f:
                            docs.append(f.read())
            else:
                logger.info(f"No revealjs_docs directory found at {docs_dir}")
                
        except Exception as e:
            logger.error(f"Failed to load revealjs docs: {e}")
            
        return "\n\n".join(docs)
    
    async def generate_slides(
        self,
        title: str,
        summary: str,
        learning_objectives: List[str],
        difficulty: str = "intermediate",
        num_slides: int = 15,
        context: Optional[str] = None
    ) -> SlideContent:
        objectives_text = "\n".join(f"- {obj}" for obj in learning_objectives)
        context_section = f"Additional Context: {context[:3000]}" if context else ""
        
        prompt = SLIDE_USER_PROMPT.format(
            title=title,
            summary=summary,
            objectives_text=objectives_text,
            difficulty=difficulty,
            num_slides=num_slides,
            context_section=context_section
        )


        try:
            response = await self.llm.generate_structured(
                prompt=prompt,
                output_schema=SlideGenerationOutput,
                system_prompt=HTML_SYSTEM_PROMPT
            )

            slides_html = response.slides_html
            slide_count = slides_html.count("<section")
            
            return SlideContent(
                slides_html=slides_html,
                slide_count=slide_count,
                key_concepts=response.key_concepts
            )
            
        except Exception as e:
            logger.error(f"Error generating slides: {e}")
            raise


_slide_agent = None


def get_slide_agent() -> SlideAgent:
    global _slide_agent
    if _slide_agent is None:
        _slide_agent = SlideAgent()
    return _slide_agent
