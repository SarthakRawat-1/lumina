import logging
import json
from typing import List, Optional, Dict, Any

from src.utils.llm import get_llm_service
from src.models.course.content_schemas import StructuredChapterContent, ContentSection
from src.prompts.course.content_writer_prompts import (
    CONTENT_WRITER_SYSTEM_PROMPT,
    CONTENT_WRITER_USER_PROMPT,
)

logger = logging.getLogger(__name__)


class ContentWriterAgent:
    
    def __init__(self):
        self.llm = get_llm_service()
    
    async def generate_content(
        self,
        title: str,
        summary: str,
        learning_objectives: List[str],
        difficulty: str,
        time_minutes: int,
        context: Optional[str] = None
    ) -> StructuredChapterContent:
        objectives_text = "\n".join(f"- {obj}" for obj in learning_objectives)

        context_section = ""
        if context:
            context_section = f"""
## Reference Material

Use the following research to ensure accuracy:

{context[:3000]}
"""

        prompt = CONTENT_WRITER_USER_PROMPT.format(
            title=title,
            summary=summary,
            objectives=objectives_text,
            difficulty=difficulty,
            time_minutes=time_minutes,
            context_section=context_section
        )

        try:
            response = await self.llm.generate_structured(
                prompt=prompt,
                output_schema=StructuredChapterContent,
                system_prompt=CONTENT_WRITER_SYSTEM_PROMPT
            )

            if not response.sections or len(response.sections) < 2:
                logger.warning(f"Too few sections for {title}, generating fallback")
                return self._generate_fallback(title, summary, learning_objectives)

            
            return response

        except Exception as e:
            logger.error(f"Content generation failed for {title}: {e}")
            return self._generate_fallback(title, summary, learning_objectives)


    
    def _generate_fallback(
        self,
        title: str,
        summary: str,
        learning_objectives: List[str]
    ) -> StructuredChapterContent:
        sections = [
            ContentSection(
                section_type="introduction",
                title="Introduction",
                paragraphs=[
                    summary,
                    f"This chapter covers the fundamentals of {title.lower()}."
                ],
                bullets=None,
                tip=None,
                image_index=None
            ),
        ]
        
        for i, obj in enumerate(learning_objectives[:3]):
            sections.append(ContentSection(
                section_type="concept",
                title=obj,
                paragraphs=[
                    f"This section explores {obj.lower()}.",
                    "Understanding this concept is essential for mastering the topic."
                ],
                bullets=None,
                tip=None,
                image_index=1 if i == 0 else None,
                diagram_index=1 if i == 0 else None
            ))
        
        sections.append(ContentSection(
            section_type="summary",
            title="Summary",
            paragraphs=[
                f"In this chapter, we explored {title.lower()}.",
                "Review the learning objectives above to ensure you've grasped all the key points."
            ],
            bullets=None,
            tip=None,
            image_index=None
        ))
        
        return StructuredChapterContent(
            sections=sections,
            key_takeaways=learning_objectives[:5],
            image_prompts=[f"Educational diagram explaining {title}"]
        )


_content_writer_agent: Optional[ContentWriterAgent] = None


def get_content_writer_agent() -> ContentWriterAgent:
    global _content_writer_agent
    if _content_writer_agent is None:
        _content_writer_agent = ContentWriterAgent()
    return _content_writer_agent
