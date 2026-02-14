from fastapi import APIRouter, HTTPException, UploadFile, File, status

from src.models.jobs.schemas import (
    ManualJobInput,
    JobSearchRequest,
    ResumeParseResponse,
    JobResultsResponse,
    ScoredJobResponse,
    ChatRefinementRequest,
    ChatRefinementResponse,
)
from src.services.jobs.job_discovery_service import get_job_discovery_service
from src.services.jobs.job_chat_service import get_job_chat_service

router = APIRouter()

@router.post("/jobs/upload-resume", response_model=ResumeParseResponse)
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        content = await file.read()
        
        service = get_job_discovery_service()
        result = await service.parse_resume(content)
        
        profile_dict = {
            "skills": result.skills,
            "experience_years": result.experience_years,
            "domains": result.domains,
            "education": result.education,
            "projects": result.projects,
        }
        
        return ResumeParseResponse(
            success=True,
            profile=profile_dict,
            skills_count=len(result.skills),
            experience_years=result.experience_years,
            message=f"Extracted {len(result.skills)} skills from resume"
        )
        
    except Exception as e:
        return ResumeParseResponse(
            success=False,
            message=f"Failed to parse resume: {str(e)}"
        )


@router.post("/jobs/search", response_model=JobResultsResponse)
async def search_jobs(request: JobSearchRequest):
    if not request.profile and not request.manual_input:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'profile' (from resume upload) or 'manual_input' is required"
        )
    
    try:
        service = get_job_discovery_service()
        return await service.search_jobs(
            profile=request.profile,
            manual_input=request.manual_input,
            location=request.location,
            remote_only=request.remote_only,
            hybrid_ok=request.hybrid_ok
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Job search failed: {str(e)}"
        )


@router.post("/jobs/chat", response_model=ChatRefinementResponse)
async def refine_search(request: ChatRefinementRequest):
    try:
        service = get_job_chat_service()
        result = await service.send_message(
            search_id=request.search_id,
            message=request.message,
            chat_history=[]
        )
        
        return ChatRefinementResponse(
            response_message=result["message"],
            applied_filter="",  
            jobs_after_filter=0  
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat failed: {str(e)}"
        )

@router.get("/jobs/history")
async def list_searches(limit: int = 20):
    service = get_job_discovery_service()
    return await service.list_searches(limit=limit)


@router.get("/jobs/history/{search_id}", response_model=JobResultsResponse)
async def get_search_results(search_id: str, skip: int = 0, limit: int = 20):
    service = get_job_discovery_service()
    return await service.get_search_results(search_id, skip=skip, limit=limit)


@router.get("/jobs/insights/{search_id}")
async def get_insights(search_id: str):
    service = get_job_discovery_service()
    return await service.get_insights(search_id)


@router.get("/jobs/{job_id}")
async def get_job_details(job_id: str):
    service = get_job_discovery_service()
    return await service.get_job_details(job_id)


@router.get("/jobs/{job_id}/enrich")
async def enrich_job(job_id: str):
    try:
        service = get_job_discovery_service()
        return await service.enrich_job(job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {str(e)}")
