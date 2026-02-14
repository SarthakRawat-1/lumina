import os
import logging
import hashlib
from typing import Optional
from google.cloud import texttospeech

logger = logging.getLogger(__name__)

LANGUAGE_VOICE_MAP = {
    "en": {"language_code": "en-US", "name": "en-US-Neural2-D"},
    "hi": {"language_code": "hi-IN", "name": "hi-IN-Neural2-D"},
    "es": {"language_code": "es-ES", "name": "es-ES-Neural2-F"},
    "fr": {"language_code": "fr-FR", "name": "fr-FR-Neural2-D"},
    "de": {"language_code": "de-DE", "name": "de-DE-Neural2-D"},
    "zh": {"language_code": "zh-CN", "name": "zh-CN-Neural2-D"},
    "ja": {"language_code": "ja-JP", "name": "ja-JP-Neural2-D"},
    "ko": {"language_code": "ko-KR", "name": "ko-KR-Neural2-C"},
    "pt": {"language_code": "pt-BR", "name": "pt-BR-Neural2-C"},
    "ru": {"language_code": "ru-RU", "name": "ru-RU-Neural2-D"},
    "ar": {"language_code": "ar-XA", "name": "ar-XA-Neural2-D"},
}

CHIRP3_HD_VOICE_MAP = {
    "English (US)": {"code": "en-US", "name": "en-US-Chirp3-HD-Charon"},
    "English (India)": {"code": "en-IN", "name": "en-IN-Chirp3-HD-Charon"},
    "French": {"code": "fr-FR", "name": "fr-FR-Chirp3-HD-Charon"},
    "German": {"code": "de-DE", "name": "de-DE-Chirp3-HD-Charon"},
    "Spanish": {"code": "es-ES", "name": "es-ES-Chirp3-HD-Charon"},
    "Portuguese": {"code": "pt-BR", "name": "pt-BR-Chirp3-HD-Charon"},
    "Italian": {"code": "it-IT", "name": "it-IT-Chirp3-HD-Charon"},
    "Hindi": {"code": "hi-IN", "name": "hi-IN-Chirp3-HD-Charon"},
    "Hinglish": {"code": "hi-IN", "name": "hi-IN-Chirp3-HD-Charon"},
    "Bengali": {"code": "bn-IN", "name": "bn-IN-Chirp3-HD-Charon"},
    "Gujarati": {"code": "gu-IN", "name": "gu-IN-Chirp3-HD-Charon"},
    "Tamil": {"code": "ta-IN", "name": "ta-IN-Chirp3-HD-Charon"},
    "Telugu": {"code": "te-IN", "name": "te-IN-Chirp3-HD-Charon"},
    "Marathi": {"code": "mr-IN", "name": "mr-IN-Chirp3-HD-Charon"},
    "Kannada": {"code": "kn-IN", "name": "kn-IN-Chirp3-HD-Charon"},
    "Malayalam": {"code": "ml-IN", "name": "ml-IN-Chirp3-HD-Charon"},
    "Punjabi": {"code": "pa-IN", "name": "pa-IN-Chirp3-HD-Charon"},
    "Urdu": {"code": "ur-IN", "name": "ur-IN-Chirp3-HD-Charon"},
}

class TTSService:
    def __init__(self):
        self.client = None
        self._init_error = None
        try:
            self.client = texttospeech.TextToSpeechClient()
            logger.info("TTS service initialized successfully")
        except Exception as e:
            self._init_error = str(e)
            logger.warning(f"TTS service not available: {e}")
    
    def is_available(self) -> bool:
        return self.client is not None
    
    def get_init_error(self) -> Optional[str]:
        return self._init_error
    
    def _get_voice_config(self, language: str) -> dict:
        return LANGUAGE_VOICE_MAP.get(language, LANGUAGE_VOICE_MAP["en"])
    
    async def synthesize_chapter(
        self,
        content: str,
        language: str = "en",
        speaking_rate: float = 1.0
    ) -> Optional[bytes]:
        if not self.client:
            logger.error("TTS client not initialized")
            return None
        
        try:
            max_chars = 5000
            if len(content) > max_chars:
                content = content[:max_chars] + "..."
            
            voice_config = self._get_voice_config(language)
            
            synthesis_input = texttospeech.SynthesisInput(text=content)
            
            voice = texttospeech.VoiceSelectionParams(
                language_code=voice_config["language_code"],
                name=voice_config["name"],
            )
            
            audio_config = texttospeech.AudioConfig(
                audio_encoding=texttospeech.AudioEncoding.MP3,
                speaking_rate=speaking_rate,
            )
            
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config,
            )
            
            logger.info(f"Synthesized {len(content)} chars to {len(response.audio_content)} bytes audio")
            return response.audio_content
            
        except Exception as e:
            logger.error(f"Failed to synthesize speech: {e}")
            return None
    
    async def synthesize_long_content(
        self,
        content: str,
        language: str = "en",
        speaking_rate: float = 1.0
    ) -> Optional[bytes]:
        if not self.client:
            return None
        
        chunks = self._split_content(content, max_bytes=4500)
        
        audio_parts = []
        for i, chunk in enumerate(chunks):
            logger.info(f"Synthesizing chunk {i+1}/{len(chunks)}")
            audio = await self.synthesize_chapter(chunk, language, speaking_rate)
            if audio:
                audio_parts.append(audio)
        
        if not audio_parts:
            return None
        
        return b"".join(audio_parts)

    async def stream_long_content(
        self,
        content: str,
        language: str = "en",
        speaking_rate: float = 1.0
    ):
        """Async generator that yields audio chunks as they're synthesized."""
        if not self.client:
            return
        
        chunks = self._split_content(content, max_bytes=4500)
        
        for i, chunk in enumerate(chunks):
            logger.info(f"Streaming chunk {i+1}/{len(chunks)}")
            audio = await self.synthesize_chapter(chunk, language, speaking_rate)
            if audio:
                yield audio
    
    def _split_content(self, content: str, max_bytes: int = 4500) -> list:
        # Split by sentences to handle long paragraphs
        import re
        sentences = re.split(r'(?<=[.!?])\s+', content)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            test_chunk = current_chunk + " " + sentence if current_chunk else sentence
            if len(test_chunk.encode('utf-8')) <= max_bytes:
                current_chunk = test_chunk
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                # If single sentence exceeds limit, split by words
                if len(sentence.encode('utf-8')) > max_bytes:
                    words = sentence.split()
                    current_chunk = ""
                    for word in words:
                        test = current_chunk + " " + word if current_chunk else word
                        if len(test.encode('utf-8')) <= max_bytes:
                            current_chunk = test
                        else:
                            if current_chunk:
                                chunks.append(current_chunk.strip())
                            current_chunk = word
                else:
                    current_chunk = sentence
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks if chunks else [content[:max_bytes]]
    
    def get_content_hash(self, content: str, language: str) -> str:
        return hashlib.md5(f"{language}:{content[:1000]}".encode()).hexdigest()

    async def synthesize_for_video(
        self,
        text: str,
        language: str = "English (US)"
    ) -> tuple[bytes, float]:
        if not self.client:
            raise ValueError("TTS client not initialized")
        
        import asyncio
        from src.utils.audio import get_mp3_duration
        
        voice_config = CHIRP3_HD_VOICE_MAP.get(language, CHIRP3_HD_VOICE_MAP["English (US)"])
        
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        voice = texttospeech.VoiceSelectionParams(
            language_code=voice_config["code"],
            name=voice_config["name"],
        )
        
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        def _synthesize():
            response = self.client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config,
            )
            return response.audio_content
        
        audio_bytes = await asyncio.to_thread(_synthesize)
        duration_seconds = await asyncio.to_thread(get_mp3_duration, audio_bytes)
        
        logger.info(f"Chirp3-HD: Synthesized {len(text)} chars -> {len(audio_bytes)} bytes, {duration_seconds:.2f}s")
        return audio_bytes, duration_seconds

_tts_service = None


def get_tts_service() -> TTSService:
    global _tts_service
    if _tts_service is None:
        _tts_service = TTSService()
    return _tts_service
