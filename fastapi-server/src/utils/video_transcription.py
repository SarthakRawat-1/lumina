import os
import logging
import tempfile
import subprocess
from typing import Optional
from google.cloud import speech

logger = logging.getLogger(__name__)


class VideoTranscriptionService:
    def __init__(self):
        try:
            self.client = speech.SpeechClient()
            logger.info("Speech-to-Text service initialized")
        except Exception as e:
            logger.warning(f"Speech-to-Text not configured: {e}")
            self.client = None

        self.ffmpeg_available = self._check_ffmpeg()
        if not self.ffmpeg_available:
            logger.warning("FFmpeg not found. Video transcription will not work.")
    
    def _check_ffmpeg(self) -> bool:
        try:
            subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True,
                check=True
            )
            return True
        except (subprocess.SubprocessError, FileNotFoundError):
            return False
    
    def _extract_audio(self, video_content: bytes) -> Optional[bytes]:
        if not self.ffmpeg_available:
            logger.error("FFmpeg not available")
            return None
        
        try:
            with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as video_file:
                video_file.write(video_content)
                video_path = video_file.name
            
            audio_path = video_path.replace(".mp4", ".wav")

            result = subprocess.run(
                [
                    "ffmpeg", "-y",
                    "-i", video_path,
                    "-vn",
                    "-acodec", "pcm_s16le",
                    "-ar", "16000",
                    "-ac", "1",  
                    audio_path
                ],
                capture_output=True,
                timeout=300  
            )
            
            if result.returncode != 0:
                logger.error(f"FFmpeg failed: {result.stderr.decode()}")
                return None

            with open(audio_path, "rb") as audio_file:
                audio_content = audio_file.read()

            os.unlink(video_path)
            os.unlink(audio_path)
            
            logger.info(f"Extracted audio: {len(audio_content)} bytes")
            return audio_content
            
        except Exception as e:
            logger.error(f"Failed to extract audio: {e}")
            return None
    
    async def transcribe_video(self, video_content: bytes) -> Optional[str]:
        if not self.client:
            logger.error("Speech-to-Text client not initialized")
            return None

        audio_content = self._extract_audio(video_content)
        if not audio_content:
            return None
        
        try:
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code="en-US",
                enable_automatic_punctuation=True,
            )
            
            audio = speech.RecognitionAudio(content=audio_content)

            if len(audio_content) > 1_000_000: 
                logger.info("Using long-running recognition for large audio...")
                operation = self.client.long_running_recognize(
                    config=config,
                    audio=audio
                )
                response = operation.result(timeout=600)
            else:
                response = self.client.recognize(config=config, audio=audio)

            transcription_parts = []
            for result in response.results:
                if result.alternatives:
                    transcription_parts.append(result.alternatives[0].transcript)
            
            full_transcript = " ".join(transcription_parts)
            logger.info(f"Transcribed {len(full_transcript)} characters from video")
            
            return full_transcript
            
        except Exception as e:
            logger.error(f"Failed to transcribe audio: {e}")
            return None
    
    async def transcribe_video_with_timestamps(self, video_content: bytes) -> dict:
        if not self.client:
            return {"full_text": "", "segments": []}
        
        audio_content = self._extract_audio(video_content)
        if not audio_content:
            return {"full_text": "", "segments": []}
        
        try:
            config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code="en-US",
                enable_automatic_punctuation=True,
                enable_word_time_offsets=True,
            )
            
            audio = speech.RecognitionAudio(content=audio_content)
            
            if len(audio_content) > 1_000_000:
                operation = self.client.long_running_recognize(config=config, audio=audio)
                response = operation.result(timeout=600)
            else:
                response = self.client.recognize(config=config, audio=audio)
            
            segments = []
            full_text_parts = []
            
            for result in response.results:
                if result.alternatives:
                    alternative = result.alternatives[0]
                    full_text_parts.append(alternative.transcript)
                    
                    words = []
                    for word_info in alternative.words:
                        words.append({
                            "word": word_info.word,
                            "start": word_info.start_time.total_seconds(),
                            "end": word_info.end_time.total_seconds()
                        })
                    
                    segments.append({
                        "text": alternative.transcript,
                        "words": words
                    })
            
            return {
                "full_text": " ".join(full_text_parts),
                "segments": segments
            }
            
        except Exception as e:
            logger.error(f"Failed to transcribe with timestamps: {e}")
            return {"full_text": "", "segments": []}

_video_transcription_service = None


def get_video_intelligence_service() -> VideoTranscriptionService:
    global _video_transcription_service
    if _video_transcription_service is None:
        _video_transcription_service = VideoTranscriptionService()
    return _video_transcription_service
