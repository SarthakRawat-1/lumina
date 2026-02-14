from livekit.agents import function_tool, RunContext, get_job_context
from src.services.interview.manager import get_interview_manager
from datetime import datetime
import logging
import json
import asyncio


def _build_report_from_evaluations(evaluations: list, final_decision: str = "Interview ended") -> dict:
    scores = [e.get("score", 0) for e in evaluations if isinstance(e.get("score"), (int, float))]
    overall_score = round(sum(scores) / len(scores)) if scores else 0

    strengths = []
    weaknesses = []
    for e in evaluations:
        score = e.get("score", 0)
        category = e.get("category", "Unknown")
        notes = e.get("notes", "")
        entry = f"{category}: {notes}" if notes else category
        if score >= 7:
            strengths.append(entry)
        elif score <= 4:
            weaknesses.append(entry)

    recommendations = []
    for e in evaluations:
        if e.get("score", 0) <= 4:
            recommendations.append(f"Improve on {e.get('category', 'this area')} — {e.get('notes', 'review fundamentals')}")
    if not recommendations and weaknesses:
        recommendations.append("Review weak areas identified above and practice with mock interviews.")
    if not recommendations:
        recommendations.append("Continue building on your strengths and prepare for advanced-level questions.")

    return {
        "overall_score": overall_score,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "recommendations": recommendations,
        "final_decision": final_decision,
        "total_evaluations": len(evaluations),
        "generated_at": datetime.utcnow().isoformat(),
    }

logger = logging.getLogger(__name__)

_interview_ending = False
_current_interview_id = None

def set_interview_id(interview_id: str):
    global _current_interview_id
    _current_interview_id = interview_id
    logger.info(f"Interview ID set: {interview_id}")

def get_interview_id() -> str | None:
    return _current_interview_id

@function_tool()
async def record_evaluation(context: RunContext, category: str, score: int, notes: str) -> str:
    try:
        logger.info(f"Recording evaluation: {category} - {score}/10")
        
        job_ctx = get_job_context()
        room = job_ctx.room
        interview_id = get_interview_id()
        
        if interview_id:
            manager = await get_interview_manager()
            await manager.add_evaluation(interview_id, category, score, notes)
            logger.info(f"Evaluation saved to DB for interview {interview_id}")
        else:
            logger.warning("No interview_id available — evaluation not persisted")

        try:
            participants = list(room.remote_participants.values())
            if participants:
                participant_identity = participants[0].identity
                await room.local_participant.perform_rpc(
                    destination_identity=participant_identity,
                    method="client.showNotification",
                    payload=json.dumps({
                        "type": "evaluation_recorded",
                        "category": category
                    })
                )
        except Exception as rpc_err:
            logger.warning(f"RPC notification failed (non-critical): {rpc_err}")

        return f"Evaluation recorded for {category}. Score: {score}. Notes saved."

    except Exception as e:
        logger.error(f"Error recording evaluation: {e}")
        return f"Failed to record evaluation: {str(e)}"

@function_tool()
async def end_interview(context: RunContext, final_decision: str) -> str:
    global _interview_ending

    if _interview_ending:
        return "Interview is already ending. No further action needed."

    _interview_ending = True

    try:
        logger.info(f"Ending interview with decision: {final_decision}")
        
        job_ctx = get_job_context()
        room = job_ctx.room
        interview_id = get_interview_id()

        if interview_id:
            manager = await get_interview_manager()
            interview = await manager.get_interview(interview_id)

            evaluations = interview.get("evaluations", []) if interview else []
            report = _build_report_from_evaluations(evaluations, final_decision)

            await manager.complete_interview(interview_id, report)
            logger.info(f"Interview {interview_id} completed with score {report['overall_score']}")
        
        try:
            participants = list(room.remote_participants.values())
            if participants:
                await room.local_participant.perform_rpc(
                    destination_identity=participants[0].identity,
                    method="client.showNotification",
                    payload=json.dumps({
                        "type": "interview_ended",
                        "decision": final_decision,
                        "interview_id": interview_id,
                    })
                )
        except Exception as rpc_err:
            logger.warning(f"RPC notification failed (client may have left): {rpc_err}")
        
        await asyncio.sleep(1.0)
        await room.disconnect()

        return "Interview session ended successfully."
        
    except Exception as e:
        logger.error(f"Error ending interview: {e}")
        _interview_ending = False  
        return f"Failed to end interview: {str(e)}"
