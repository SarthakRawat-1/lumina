import os
import tempfile
from mutagen.mp3 import MP3


def get_mp3_duration(audio_bytes: bytes) -> float:
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    
    try:
        audio = MP3(tmp_path)
        duration_seconds = audio.info.length
    finally:
        os.unlink(tmp_path)
    
    return duration_seconds
