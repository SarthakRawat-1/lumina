import re
import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def extract_youtube_id(url: str) -> Optional[str]:
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})',
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url

    return None

async def fetch_youtube_title(video_id: str) -> Optional[str]:
    oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(oembed_url)
            if response.status_code == 200:
                data = response.json()
                title = data.get("title")
                logger.info(f"Fetched YouTube title: {title}")
                return title
            else:
                logger.warning(f"Failed to fetch YouTube title: HTTP {response.status_code}")
                return None
    except Exception as e:
        logger.error(f"Error fetching YouTube title: {e}")
        return None


class YouTubeTranscriptService:
    def __init__(self):
        """Initialize the YouTube transcript service"""
        logger.info("YouTube Transcript service initialized")
    
    async def get_transcript(
        self,
        youtube_url: str,
        language: str = "en"
    ) -> Optional[str]:
        from youtube_transcript_api import YouTubeTranscriptApi
        from youtube_transcript_api._errors import (
            TranscriptsDisabled,
            NoTranscriptFound,
            VideoUnavailable
        )
        
        video_id = extract_youtube_id(youtube_url)
        
        if not video_id:
            logger.error(f"Could not extract video ID from: {youtube_url}")
            return None
        
        try:
            ytt_api = YouTubeTranscriptApi()
            transcript_list = ytt_api.list(video_id)

            try:
                transcript = transcript_list.find_manually_created_transcript([language])
            except NoTranscriptFound:
                try:
                    transcript = transcript_list.find_generated_transcript([language])
                except NoTranscriptFound:
                    try:
                        transcript = transcript_list.find_generated_transcript(['en'])
                    except NoTranscriptFound:
                        available = list(transcript_list)
                        if available:
                            transcript = available[0]
                        else:
                            logger.error(f"No transcripts available for video: {video_id}")
                            return None
            
            transcript_data = transcript.fetch()
            full_text = " ".join([snippet.text for snippet in transcript_data])
            full_text = self._clean_transcript(full_text)
            
            logger.info(f"Fetched transcript: {len(full_text)} chars from {video_id}")
            return full_text
            
        except TranscriptsDisabled:
            logger.error(f"Transcripts disabled for video: {video_id}")
            return None
        except VideoUnavailable:
            logger.error(f"Video unavailable: {video_id}")
            return None
        except Exception as e:
            logger.error(f"Failed to get transcript: {e}")
            return None
    
    async def get_transcript_with_timestamps(
        self,
        youtube_url: str,
        language: str = "en"
    ) -> dict:
        from youtube_transcript_api import YouTubeTranscriptApi
        from youtube_transcript_api._errors import NoTranscriptFound
        
        video_id = extract_youtube_id(youtube_url)
        
        if not video_id:
            return {"full_text": "", "segments": []}
        
        try:
            ytt_api = YouTubeTranscriptApi()
            transcript_list = ytt_api.list(video_id)
            
            try:
                transcript = transcript_list.find_generated_transcript([language, 'en'])
            except NoTranscriptFound:
                available = list(transcript_list)
                if not available:
                    return {"full_text": "", "segments": []}
                transcript = available[0]
            
            transcript_data = transcript.fetch()
            
            segments = []
            full_text_parts = []
            
            for snippet in transcript_data:
                text = snippet.text
                start = snippet.start
                duration = snippet.duration
                
                full_text_parts.append(text)
                segments.append({
                    "text": text,
                    "start": start,
                    "end": start + duration
                })
            
            return {
                "full_text": self._clean_transcript(" ".join(full_text_parts)),
                "segments": segments
            }
            
        except Exception as e:
            logger.error(f"Failed to get transcript with timestamps: {e}")
            return {"full_text": "", "segments": []}
    
    def _clean_transcript(self, text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\[.*?\]', '', text)
        return text.strip()

_youtube_transcript_service = None

def get_youtube_transcript_service() -> YouTubeTranscriptService:
    global _youtube_transcript_service
    if _youtube_transcript_service is None:
        _youtube_transcript_service = YouTubeTranscriptService()
    return _youtube_transcript_service
