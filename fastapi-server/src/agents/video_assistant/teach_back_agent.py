import json
import logging
import uuid
from typing import List, Optional, Dict
from datetime import datetime

from src.utils.llm import get_llm_service
from src.prompts.video_assistant.teach_back_prompts import (
    TEACH_BACK_EXTRACT_CONCEPTS_PROMPT,
    TEACH_BACK_EVALUATION_PROMPT,
    TEACH_BACK_INITIAL_PROMPT,
    TEACH_BACK_INITIAL_CONCEPT_PROMPT,
    BLOOM_QUESTION_TEMPLATES,
    ADAPTIVE_FEEDBACK_PROMPTS,
    SCAFFOLDING_HINTS,
)
from src.models.video_assistant.schemas import (
    ConceptEvaluation,
)


logger = logging.getLogger(__name__)


class TeachBackAgent:
    def __init__(self):
        self.llm = get_llm_service()
        self.active_sessions: Dict[str, dict] = {}
        logger.info(
            "Enhanced Teach Back Agent initialized with session management and Bloom's taxonomy"
        )

    async def create_session(
        self,
        video_id: str,
        user_id: str,
        segments: List[dict],
        video_title: str = "",
        start_time: float = 0,
        end_time: Optional[float] = None,
    ) -> dict:
        session_id = str(uuid.uuid4())

        relevant_segments = self._filter_segments_by_time_range(
            segments, start_time, end_time
        )
        full_text = " ".join(seg.get("text", "") for seg in relevant_segments)

        time_range_str = self._format_time_range(start_time, end_time)

        try:
            prompt = TEACH_BACK_EXTRACT_CONCEPTS_PROMPT.format(
                video_title=video_title,
                time_range=time_range_str,
                end_time_range=self._format_time(end_time) if end_time else "end",
                full_text=full_text[:8000],
            )
            response = await self.llm.generate(
                prompt=prompt,
                system_prompt="You are an educational content analyst. Extract key concepts from transcripts.",
            )
            text = response.strip()

            if text.startswith("["):
                concepts = json.loads(text)
            elif text.startswith("{") and "concepts" in text:
                concepts = json.loads(text).get("concepts", [])
            else:
                concepts = [
                    line.strip().strip('"').strip("'")
                    for line in text.split("\n")
                    if line.strip() and not line.startswith("[")
                ]

            if not concepts or len(concepts) == 0:
                num_concepts = min(5, len(relevant_segments))
                concepts = [f"Concept {i + 1}" for i in range(num_concepts)]

            concepts = concepts[:8]
        except Exception as e:
            logger.error(f"Error extracting concepts: {e}")
            concepts = [
                f"Key Point {i + 1}" for i in range(min(5, len(relevant_segments)))
            ]

        session = {
            "session_id": session_id,
            "video_id": video_id,
            "user_id": user_id,
            "concepts": concepts,
            "current_concept_index": 0,
            "concept_mastery": {},
            "attempts": {},
            "conversation_history": [],
            "current_bloom_level": "understand",
            "section_start_time": start_time,
            "section_end_time": end_time,
            "started_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat(),
        }

        self.active_sessions[session_id] = session
        logger.info(
            f"Created session {session_id} with {len(concepts)} concepts for video {video_id}"
        )

        return session

    async def get_or_create_session(
        self,
        video_id: str,
        user_id: str,
        segments: List[dict],
        video_title: str = "",
        start_time: float = 0,
        end_time: Optional[float] = None,
    ) -> dict:
        for session_id, session in self.active_sessions.items():
            if session["video_id"] == video_id and session["user_id"] == user_id:
                try:
                    last_updated = datetime.fromisoformat(session["last_updated"])
                    age = (datetime.utcnow() - last_updated).total_seconds()
                except:
                    age = 9999

                if age < 7200:  
                    logger.info(f"Found existing session {session_id}")
                    return session

        return await self.create_session(
            video_id, user_id, segments, video_title, start_time, end_time
        )

    async def start_concept_learning(
        self, session: dict, concept_index: Optional[int] = None
    ) -> str:
        if concept_index is not None:
            session["current_concept_index"] = concept_index

        current_concept = session["concepts"][session["current_concept_index"]]

        total_concepts = len(session["concepts"])
        current_num = session["current_concept_index"] + 1

        prompt = TEACH_BACK_INITIAL_CONCEPT_PROMPT.format(
            num_concepts=total_concepts,
            current_num=current_num,
            total_concepts=total_concepts,
            concept_name=current_concept,
        )

        session["conversation_history"].append(
            {
                "role": "assistant",
                "type": "concept_introduction",
                "concept_index": session["current_concept_index"],
                "concept": current_concept,
                "bloom_level": session["current_bloom_level"],
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        session["last_updated"] = datetime.utcnow().isoformat()
        return prompt

    async def evaluate_explanation(
        self,
        user_explanation: str,
        session: dict,
        transcript_excerpt: str = "",
        video_title: str = "",
    ) -> dict:
        current_concept = session["concepts"][session["current_concept_index"]]

        concept = current_concept
        session["attempts"][concept] = session["attempts"].get(concept, 0) + 1
        conversation_context = (
            session["conversation_history"][-3:]
            if len(session["conversation_history"]) > 3
            else session["conversation_history"]
        )

        bloom_criteria = self._get_bloom_criteria(session["current_bloom_level"])

        if not transcript_excerpt:
            transcript_excerpt = transcript_excerpt[:2000]

        prompt = TEACH_BACK_EVALUATION_PROMPT.format(
            video_title=video_title,
            time_range=self._format_time(session["section_start_time"]),
            end_time_range=self._format_time(session["section_end_time"]),
            transcript_excerpt=transcript_excerpt,
            user_explanation=user_explanation,
            concept_name=current_concept,
            bloom_level=session["current_bloom_level"],
            application_criteria=bloom_criteria,
        )

        try:
            from pydantic import BaseModel

            class ConceptDetailedEvaluation(BaseModel):
                concept_name: str
                understanding_level: str
                recall_score: int
                explanation_score: int
                application_score: int
                overall_score: int
                identified_gaps: List[str]
                suggested_clarifications: List[str]
                strengths: List[str]
                follow_up_question: str
                encouragement: str

            result = await self.llm.generate_structured(
                prompt=prompt,
                output_schema=ConceptDetailedEvaluation,
                system_prompt="You are a Socratic tutor evaluating student understanding with Bloom's taxonomy.",
            )

            session["concept_mastery"][concept] = result.overall_score

            session["conversation_history"].append(
                {
                    "role": "assistant",
                    "type": "evaluation",
                    "concept_index": session["current_concept_index"],
                    "concept": current_concept,
                    "bloom_level": session["current_bloom_level"],
                    "user_explanation": user_explanation,
                    "evaluation": result.dict(),
                    "timestamp": datetime.utcnow().isoformat(),
                }
            )

            session["last_updated"] = datetime.utcnow().isoformat()

            should_advance = (
                result.overall_score >= 85 or session["attempts"][concept] >= 3
            )
            feedback = self._generate_adaptive_feedback(
                result, session, current_concept
            )

            follow_up = self._generate_follow_up_question(
                result,
                current_concept,
                session["current_bloom_level"],
                session["concepts"],
                session["current_concept_index"],
            )

            return {
                "evaluation": result.dict(),
                "feedback": feedback,
                "follow_up_question": follow_up,
                "should_advance": should_advance,
                "session_progress": {
                    "current_concept": current_concept,
                    "concept_index": session["current_concept_index"] + 1,
                    "total_concepts": len(session["concepts"]),
                    "mastered_concepts": sum(
                        1
                        for score in session["concept_mastery"].values()
                        if score >= 85
                    ),
                    "current_attempt": session["attempts"][concept],
                },
            }

        except Exception as e:
            logger.error(f"Error evaluating explanation: {e}")
            return {
                "evaluation": {
                    "concept_name": current_concept,
                    "understanding_level": "partial",
                    "recall_score": 50,
                    "explanation_score": 50,
                    "application_score": 50,
                    "overall_score": 50,
                    "identified_gaps": [],
                    "suggested_clarifications": ["Try explaining more specifically"],
                    "strengths": [],
                },
                "feedback": "I had trouble evaluating your explanation. Can you try rephrasing?",
                "follow_up_question": "What's the main idea of this concept?",
                "should_advance": False,
                "session_progress": {
                    "current_concept": current_concept,
                    "concept_index": session["current_concept_index"] + 1,
                    "total_concepts": len(session["concepts"]),
                    "mastered_concepts": 0,
                },
            }

    async def advance_to_next_concept(self, session: dict) -> Optional[str]:
        if session["current_concept_index"] < len(session["concepts"]) - 1:
            session["current_concept_index"] += 1
            session["current_bloom_level"] = "understand"
            session["last_updated"] = datetime.utcnow().isoformat()
            return await self.start_concept_learning(session)
        return None

    async def generate_bloom_question(
        self, session: dict, bloom_level: str, difficulty: str = "medium"
    ) -> str:
        """Generate a Bloom's taxonomy question for current concept"""
        current_concept = session["concepts"][session["current_concept_index"]]

        templates = BLOOM_QUESTION_TEMPLATES.get(
            bloom_level, BLOOM_QUESTION_TEMPLATES["understand"]
        )

        template = templates.get(difficulty, templates["medium"])

        question = template.format(concept=current_concept)

        session["current_bloom_level"] = bloom_level
        session["last_updated"] = datetime.utcnow().isoformat()

        return question

    async def get_session(self, session_id: str) -> Optional[dict]:
        return self.active_sessions.get(session_id)

    def _get_bloom_criteria(self, bloom_level: str) -> str:
        criteria_map = {
            "remember": "Can they identify examples or basic facts?",
            "understand": "Can they explain meaning or give simple examples?",
            "apply": "Can they use the concept in a new scenario?",
            "analyze": "Can they compare or break down components?",
            "evaluate": "Can they judge or assess using criteria?",
            "create": "Can they design or build something using the concept?",
        }
        return criteria_map.get(bloom_level, criteria_map["understand"])

    def _generate_adaptive_feedback(
        self, evaluation, session: dict, concept: str
    ) -> str:
        score = evaluation.overall_score

        if score >= 85:
            return ADAPTIVE_FEEDBACK_PROMPTS["complete_mastery"].format(
                concept=concept,
                correct_points=", ".join(evaluation.strengths),
                challenging_question=evaluation.follow_up_question,
                advanced_goal="apply it in new situations",
            )
        elif score >= 70:
            return ADAPTIVE_FEEDBACK_PROMPTS["high_mastery"].format(
                concept=concept,
                correct_points=", ".join(evaluation.strengths),
                clarification_points=", ".join(evaluation.suggested_clarifications),
                simplified_explanation=f"Focus on: {evaluation.strengths[0] if evaluation.strengths else 'the core idea'}",
                challenging_question=evaluation.follow_up_question,
                advanced_goal="demonstrate deeper understanding",
            )
        elif score >= 50:
            return ADAPTIVE_FEEDBACK_PROMPTS["medium_mastery"].format(
                concept=concept,
                correct_points=", ".join(evaluation.strengths),
                clarification_points=", ".join(evaluation.suggested_clarifications),
                simplified_explanation=f"Focus on: {evaluation.strengths[0] if evaluation.strengths else 'the core idea'}",
            )
        else:
            hint_type = self._select_hint_type(evaluation)
            hint = SCAFFOLDING_HINTS.get(
                hint_type, SCAFFOLDING_HINTS["definition"]
            ).format(concept=concept)

            return (
                ADAPTIVE_FEEDBACK_PROMPTS["low_mastery"].format(
                    concept=concept,
                    concept_breakdown=f"1. What it is\n2. How it works\n3. Why it matters",
                    part_1="definition",
                )
                + f"\n\n{hint}"
            )

    def _select_hint_type(self, evaluation) -> str:
        if not evaluation.identified_gaps:
            return "example"
        elif "definition" in " ".join(evaluation.identified_gaps).lower():
            return "definition"
        elif (
            "how" in " ".join(evaluation.identified_gaps).lower()
            or "why" in " ".join(evaluation.identified_gaps).lower()
        ):
            return "purpose"
        else:
            return "comparison"

    def _generate_follow_up_question(
        self,
        evaluation,
        concept: str,
        current_bloom: str,
        all_concepts: List[str],
        current_index: int,
    ) -> str:
        if evaluation.overall_score < 50:
            return f"What do you think {concept} means in simple terms?"

        if evaluation.overall_score >= 70:
            bloom_levels = [
                "remember",
                "understand",
                "apply",
                "analyze",
                "evaluate",
                "create",
            ]
            try:
                current_idx = bloom_levels.index(current_bloom)
                if current_idx < len(bloom_levels) - 1:
                    next_bloom = bloom_levels[current_idx + 1]
                    return f"Can you apply {concept} to a new example?"
            except ValueError:
                pass

        if current_index < len(all_concepts) - 1:
            next_concept = all_concepts[current_index + 1]
            return f"How do you think {concept} relates to {next_concept}?"

        return f"Can you think of a real-world example where {concept} is important?"

    def _filter_segments_by_time_range(
        self, segments: List[dict], start_time: float, end_time: Optional[float]
    ) -> List[dict]:
        if end_time is None:
            return [s for s in segments if s.get("start_time", 0) >= start_time]

        return [s for s in segments if start_time <= s.get("start_time", 0) <= end_time]

    def _format_time_range(self, start: float, end: Optional[float]) -> str:
        start_str = self._format_time(start)
        if end:
            end_str = self._format_time(end)
            return f"{start_str} - {end_str}"
        return f"{start_str} onwards"

    def _format_time(self, seconds: float) -> str:
        secs = int(seconds)
        if secs >= 3600:
            hours = secs // 3600
            minutes = (secs % 3600) // 60
            s = secs % 60
            return f"{hours}:{minutes:02d}:{s:02d}"
        minutes = secs // 60
        s = secs % 60
        return f"{minutes}:{s:02d}"

    def cleanup_old_sessions(self, max_age_seconds: int = 7200):
        current_time = datetime.utcnow()
        expired = []

        for session_id, session in self.active_sessions.items():
            try:
                last_updated = datetime.fromisoformat(session["last_updated"])
                age = (current_time - last_updated).total_seconds()
                if age > max_age_seconds:
                    expired.append(session_id)
            except:
                continue

        for session_id in expired:
            del self.active_sessions[session_id]

        if expired:
            logger.info(f"Cleaned up {len(expired)} expired sessions")


_teach_back_agent: Optional[TeachBackAgent] = None


def get_teach_back_agent() -> TeachBackAgent:
    global _teach_back_agent
    if _teach_back_agent is None:
        _teach_back_agent = TeachBackAgent()
    return _teach_back_agent
