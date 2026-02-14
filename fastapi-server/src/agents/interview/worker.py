import logging
import json
import os
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentSession, Agent, room_io
from livekit.plugins import (
    google,
    groq,
    silero,
    noise_cancellation,
    # simli
    bey
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from src.agents.interview.tools import record_evaluation, end_interview, set_interview_id, get_interview_id
from src.services.interview.manager import get_interview_manager
from src.prompts.interview.prompts import get_system_prompt
from src.config.settings import settings
from src.db.mongodb import MongoDB

logger = logging.getLogger(__name__)

logging.getLogger("pymongo").setLevel(logging.WARNING)
logging.getLogger("pymongo.topology").setLevel(logging.WARNING)
logging.getLogger("pymongo.connection").setLevel(logging.WARNING)

env_path = Path(__file__).parent.parent.parent.parent / ".env"
load_dotenv(env_path)

if settings.google_application_credentials:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials

class Assistant(Agent):
    def __init__(self, system_prompt: str) -> None:
        super().__init__(
            instructions=system_prompt,
            tools=[record_evaluation, end_interview]
        )

async def entrypoint(ctx: agents.JobContext):
    logger.info(f"Starting worker for job {ctx.job.id}")

    await MongoDB.connect()

    await ctx.connect()

    industry = "General"
    role = "Candidate"
    resume_text = None
    interview_id = None

    participant = await ctx.wait_for_participant()
    try:
        if participant.metadata:
            metadata = json.loads(participant.metadata)
            industry = metadata.get("industry", industry)
            role = metadata.get("role", role)
            resume_text = metadata.get("resume_text")
            interview_id = metadata.get("interview_id")
            logger.info(f"Got metadata from participant: interview_id={interview_id}, role={role}")
    except Exception as e:
        logger.error(f"Failed to parse participant metadata: {e}")

    if interview_id:
        set_interview_id(interview_id)
    else:
        logger.warning("No interview_id found in participant metadata!")

    system_prompt = get_system_prompt(industry, role, resume_text)

    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            voice="Puck",
            temperature=0.8,
            instructions=system_prompt,
            api_key=settings.google_cloud_api,
        ),
    )

    avatar = bey.AvatarSession(
        api_key=settings.beyond_presence_api_key,
        avatar_id=settings.beyond_presence_face_id
    )
    await avatar.start(session, room=ctx.room)

    await session.start(
        room=ctx.room,
        agent=Assistant(system_prompt),
        room_options=room_io.RoomOptions(
            video_input=True, 
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
            ),
        ),
    )

    await session.generate_reply(
        instructions=f"Greet the candidate for the {role} interview."
    )

    @ctx.room.on("participant_disconnected")
    async def on_participant_left(participant):
        from src.agents.interview.tools import _interview_ending
        if _interview_ending:
            return  

        logger.info(f"Participant {participant.identity} disconnected — saving interview results")
        try:
            interview_id = get_interview_id()
            if interview_id:
                manager = await get_interview_manager()
                interview = await manager.get_interview(interview_id)

                if interview and interview.get("status") != "completed":
                    evaluations = interview.get("evaluations", [])
                    from src.agents.interview.tools import _build_report_from_evaluations
                    report = _build_report_from_evaluations(evaluations, "Interview ended by candidate")
                    await manager.complete_interview(interview_id, report)
                    logger.info(f"Interview {interview_id} saved after participant disconnect")
        except Exception as e:
            logger.error(f"Error saving interview on disconnect: {e}")

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
