from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from pydantic import BaseModel
from livekit import api
from src.config.settings import settings
from src.services.interview.manager import get_interview_manager
from src.utils.livekit_recording import recording_service
from src.utils.pdf import get_document_ai_service
from src.models.interview.schemas import InterviewResumeParseResponse
import uuid
import json

router = APIRouter(prefix="/interview", tags=["Interview"])

class CreateInterviewRequest(BaseModel):
    user_id: str
    industry: str
    role: str
    resume_text: str = None

class CreateInterviewResponse(BaseModel):
    token: str
    interview_id: str
    ws_url: str

@router.get("/list")
async def list_interviews(user_id: str):
    manager = await get_interview_manager()
    interviews = await manager.get_user_interviews(user_id)
    return interviews

@router.post("/start", response_model=CreateInterviewResponse)
async def start_interview(req: CreateInterviewRequest):
    manager = await get_interview_manager()

    interview_id = await manager.create_interview(
        user_id=req.user_id,
        industry=req.industry,
        role=req.role,
        resume_text=req.resume_text
    )

    token = api.AccessToken(
        settings.livekit_api_key, 
        settings.livekit_api_secret
    )

    participant_identity = f"user_{req.user_id}"
    token.with_identity(participant_identity)
    token.with_name(f"Candidate ({req.role})")

    token.with_grants(api.VideoGrants(
        room_join=True,
        room=f"interview-{interview_id}",
        can_publish=True,
        can_subscribe=True,
    ))

    metadata = {
        "interview_id": interview_id,
        "industry": req.industry,
        "role": req.role,
        "resume_text": req.resume_text
    }
    token.with_metadata(json.dumps(metadata))
    
    jwt_token = token.to_jwt()

    return CreateInterviewResponse(
        token=jwt_token,
        interview_id=interview_id,
        ws_url=settings.livekit_url
    )

@router.get("/{interview_id}/report")
async def get_report(interview_id: str):
    manager = await get_interview_manager()
    interview = await manager.get_interview(interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    report = interview.get("report")
    evaluations = interview.get("evaluations", [])

    if not report and evaluations:
        from src.agents.interview.tools import _build_report_from_evaluations
        report = _build_report_from_evaluations(evaluations, "Interview ended (auto-generated)")
        await manager.complete_interview(interview_id, report)
    elif not report:
        report = {"overall_score": 0, "strengths": [], "weaknesses": [], "recommendations": []}

    return {
        "status": interview.get("status"),
        "report": report,
        "recording_url": interview.get("recording_url"),
        "evaluations": evaluations,
        "started_at": interview.get("started_at"),
        "ended_at": interview.get("ended_at")
    }

class EgressWebhook(BaseModel):
    egress_id: str
    status: str
    location: dict = None

@router.post("/upload-resume", response_model=InterviewResumeParseResponse)
async def upload_interview_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        content = await file.read()
        pdf_service = get_document_ai_service()
        extracted_text = await pdf_service.extract_text_from_pdf(content)
        
        if not extracted_text or len(extracted_text.strip()) == 0:
            return InterviewResumeParseResponse(
                success=False,
                message="Could not extract text from the PDF. The file may be scanned or corrupted."
            )

        return InterviewResumeParseResponse(
            success=True,
            extracted_text=extracted_text,
            message=f"Successfully extracted {len(extracted_text)} characters from resume"
        )

    except Exception as e:
        return InterviewResumeParseResponse(
            success=False,
            message=f"Failed to parse resume: {str(e)}"
        )


@router.post("/webhook/egress")
async def egress_webhook(event: EgressWebhook):
    if event.status == "EGRESS_COMPLETE" and event.location:
        pass
    return {"status": "ok"}
