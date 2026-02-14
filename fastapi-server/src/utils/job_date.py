import re
from typing import Optional

def parse_posted_date(posted_str: Optional[str]) -> Optional[int]:
    if not posted_str:
        return None
    
    posted_str = posted_str.lower().strip()
    
    if "just" in posted_str or "today" in posted_str:
        return 0
    
    if "yesterday" in posted_str:
        return 1
    
    match = re.search(r'(\d+)\s*(day|week|month|hour)', posted_str)
    if not match:
        return None
    
    num = int(match.group(1))
    unit = match.group(2)
    
    if unit == "hour":
        return 0
    elif unit == "day":
        return num
    elif unit == "week":
        return num * 7
    elif unit == "month":
        return num * 30
    
    return None

def is_job_recent(posted_str: Optional[str], max_days: int = 30) -> bool:
    days_ago = parse_posted_date(posted_str)
    
    if days_ago is None:
        return True
    
    return days_ago <= max_days
