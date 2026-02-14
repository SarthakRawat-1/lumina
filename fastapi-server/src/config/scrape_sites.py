from typing import Optional
from urllib.parse import quote_plus


def get_indeed_config(query: str, location: Optional[str] = None) -> dict:
    query_encoded = quote_plus(query)
    location_encoded = quote_plus(location) if location else ""
    
    return {
        "name": "indeed",
        "url": f"https://www.indeed.com/jobs?q={query_encoded}&l={location_encoded}",
        "schema": {
            "type": "object",
            "properties": {
                "jobs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "company": {"type": "string"},
                            "location": {"type": "string"},
                            "apply_url": {"type": "string"},
                            "snippet": {"type": "string"},
                            "salary": {"type": "string"}
                        }
                    }
                }
            }
        }
    }


def get_linkedin_config(query: str, location: Optional[str] = None) -> dict:
    query_encoded = quote_plus(query)
    location_encoded = quote_plus(location) if location else ""

    base_url = "https://www.linkedin.com/jobs/search"
    url = f"{base_url}?keywords={query_encoded}"
    if location_encoded:
        url += f"&location={location_encoded}"
    
    return {
        "name": "linkedin",
        "url": url,
        "schema": {
            "type": "object",
            "properties": {
                "jobs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "company": {"type": "string"},
                            "location": {"type": "string"},
                            "apply_url": {"type": "string"},
                            "description": {"type": "string"},
                            "posted_date": {"type": "string"}
                        }
                    }
                }
            }
        }
    }


def get_glassdoor_config(query: str, location: Optional[str] = None) -> dict:
    query_encoded = quote_plus(query)
    location_encoded = quote_plus(location) if location else ""
    
    # Glassdoor URL pattern
    base_url = "https://www.glassdoor.com/Job/jobs.htm"
    url = f"{base_url}?sc.keyword={query_encoded}"
    if location_encoded:
        url += f"&locT=C&locId=0&locKeyword={location_encoded}"
    
    return {
        "name": "glassdoor",
        "url": url,
        "schema": {
            "type": "object",
            "properties": {
                "jobs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "company": {"type": "string"},
                            "location": {"type": "string"},
                            "apply_url": {"type": "string"},
                            "salary_estimate": {"type": "string"},
                            "rating": {"type": "string"},
                            "description": {"type": "string"}
                        }
                    }
                }
            }
        }
    }


def get_naukri_config(query: str, location: Optional[str] = None) -> dict:
    query_encoded = quote_plus(query)
    location_encoded = quote_plus(location) if location else ""

    return {
        "name": "naukri",
        "url": f"https://www.naukri.com/jobsearch?keyword={query_encoded}&location={location_encoded}",
        "schema": {
            "type": "object",
            "properties": {
                "jobs": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "company": {"type": "string"},
                            "location": {"type": "string"},
                            "apply_url": {"type": "string"},
                            "description": {"type": "string"},
                            "salary": {"type": "string"},
                            "experience": {"type": "string"}
                        }
                    }
                }
            }
        }
    }


def get_all_scrape_sites(query: str, location: Optional[str] = None) -> list:
    sites = [
        get_indeed_config(query, location),
        get_linkedin_config(query, location),
        get_glassdoor_config(query, location),
    ]

    if location and ("india" in location.lower() or any(city in location.lower() for city in ["mumbai", "delhi", "bangalore", "chennai", "hyderabad", "pune", "kolkata"])):
        sites.append(get_naukri_config(query, location))

    return sites

SCRAPE_SITE_PRIORITY = ["linkedin", "indeed", "glassdoor", "naukri"]
