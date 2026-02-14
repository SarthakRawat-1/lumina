import re
import hashlib
from typing import Optional


def infer_location_type(text: str) -> str:
    text_lower = text.lower()
    
    if "remote" in text_lower or "work from home" in text_lower or "wfh" in text_lower:
        return "remote"
    elif "hybrid" in text_lower or "flexible" in text_lower:
        return "hybrid"
    else:
        return "onsite"

def extract_years_required(text: str) -> Optional[int]:
    if not text:
        return None
    
    text_lower = text.lower()
    years_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', text_lower)
    
    if years_matches:
        return max(int(y) for y in years_matches)
    
    return None

def create_job_hash_key(url: str, title: str) -> str:
    key_string = f"{url}|{title.lower().strip()}"
    return hashlib.sha256(key_string.encode()).hexdigest()[:16]
