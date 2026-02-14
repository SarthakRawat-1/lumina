"""
Course-related prompts

Exports all course agent prompts.
"""
from .flashcard_prompts import (
    MCQ_SYSTEM_PROMPT,
    LEARNING_CARD_SYSTEM_PROMPT,
    MCQ_USER_PROMPT,
    LEARNING_CARD_USER_PROMPT,
)
from .slide_prompts import HTML_SYSTEM_PROMPT, SLIDE_USER_PROMPT
from .planner_prompts import PLANNER_SYSTEM_PROMPT, PLANNER_USER_PROMPT
from .explainer_prompts import EXPLAINER_SYSTEM_PROMPT, EXPLAINER_USER_PROMPT
from .content_writer_prompts import CONTENT_WRITER_SYSTEM_PROMPT, CONTENT_WRITER_USER_PROMPT
from .tester_prompts import TESTER_SYSTEM_PROMPT, TESTER_USER_PROMPT
from .grader_prompts import GRADER_SYSTEM_PROMPT, GRADER_USER_PROMPT
from .chat_prompts import CHAT_SYSTEM_PROMPT
from .graph_expansion_prompts import GRAPH_EXPANSION_SYSTEM_PROMPT, GRAPH_EXPANSION_USER_PROMPT
from .diagram_prompts import DIAGRAM_SYSTEM_PROMPT, DIAGRAM_USER_PROMPT

__all__ = [
    # Flashcard prompts
    "MCQ_SYSTEM_PROMPT",
    "LEARNING_CARD_SYSTEM_PROMPT",
    "MCQ_USER_PROMPT",
    "LEARNING_CARD_USER_PROMPT",
    # Slide prompts
    "HTML_SYSTEM_PROMPT",
    "SLIDE_USER_PROMPT",
    # Planner prompts
    "PLANNER_SYSTEM_PROMPT",
    "PLANNER_USER_PROMPT",
    # Explainer prompts (legacy)
    "EXPLAINER_SYSTEM_PROMPT",
    "EXPLAINER_USER_PROMPT",
    # Content Writer prompts
    "CONTENT_WRITER_SYSTEM_PROMPT",
    "CONTENT_WRITER_USER_PROMPT",
    # Tester prompts
    "TESTER_SYSTEM_PROMPT",
    "TESTER_USER_PROMPT",
    # Grader prompts
    "GRADER_SYSTEM_PROMPT",
    "GRADER_USER_PROMPT",
    # Chat prompts
    "CHAT_SYSTEM_PROMPT",
    # Graph expansion prompts
    "GRAPH_EXPANSION_SYSTEM_PROMPT",
    "GRAPH_EXPANSION_USER_PROMPT",
    # Diagram prompts
    "DIAGRAM_SYSTEM_PROMPT",
    "DIAGRAM_USER_PROMPT",
]

