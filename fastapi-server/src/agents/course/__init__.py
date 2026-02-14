"""
Course Agents Package

Exports all course-related agents.
"""
from .flashcard import FlashcardAgent, get_flashcard_agent
from .slides import SlideAgent, get_slide_agent
from .planner import PlannerAgent, get_planner_agent
from .content_writer import ContentWriterAgent, get_content_writer_agent
from .tester import TesterAgent, get_tester_agent
from .grader import GraderAgent, get_grader_agent
from .chat import ChatAgent, get_chat_agent
from .graph_expansion import GraphExpansionAgent, get_graph_expansion_agent
from .diagram_agent import DiagramAgent, get_diagram_agent

__all__ = [
    "FlashcardAgent",
    "get_flashcard_agent",
    "SlideAgent",
    "get_slide_agent",
    "PlannerAgent",
    "get_planner_agent",
    "ContentWriterAgent",
    "get_content_writer_agent",
    "TesterAgent",
    "get_tester_agent",
    "GraderAgent",
    "get_grader_agent",
    "ChatAgent",
    "get_chat_agent",
    "GraphExpansionAgent",
    "get_graph_expansion_agent",
    "DiagramAgent",
    "get_diagram_agent",
]

