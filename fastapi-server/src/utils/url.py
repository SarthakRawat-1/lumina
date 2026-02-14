from urllib.parse import urlparse

def normalize_url(url: str) -> str:
    if not url:
        return ""
    
    try:
        parsed = urlparse(url)
        normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".lower()
        return normalized.rstrip("/")
    except Exception:
        return url.lower()
