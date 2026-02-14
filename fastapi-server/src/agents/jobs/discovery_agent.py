import asyncio
import hashlib
import httpx
from typing import Optional, List
from urllib.parse import quote_plus

from src.config.settings import settings
from src.config.ats_companies import get_ats_companies_for_industry
from src.models.jobs.schemas import DiscoveredJob, DiscoveryResult
from src.utils.job_date import is_job_recent


class DiscoveryAgent:
    def __init__(self):
        self.serpapi_key = getattr(settings, 'serpapi_key', '')
    
    async def discover_jobs(
        self,
        queries: List[str],
        location: Optional[str] = None,
        remote_only: bool = False,
        max_results_per_query: int = 10
    ) -> List[DiscoveryResult]:
        results = []

        if self.serpapi_key:
            print(f"DEBUG: Starting SerpAPI search for {len(queries)} queries...")
            for query in queries[:5]:
                try:
                    serp_result = await self._search_serpapi(query, location, max_results_per_query)
                    if serp_result and serp_result.jobs:
                        results.append(serp_result)
                except Exception as e:
                    print(f"ERROR: SerpAPI failed for query '{query}': {e}")

        try:
            print("DEBUG: Starting ATS feed search...")
            ats_result = await self._search_ats_feeds(
                query=queries[0] if queries else "",
                location=location,
                remote_only=remote_only
            )
            if ats_result and ats_result.jobs:
                results.append(ats_result)
        except Exception as e:
             print(f"ERROR: ATS search failed: {e}")

        if getattr(settings, "jobspy_enabled", False):
            try:
                print("DEBUG: Starting JobSpy search...")
                jobspy_result = await self._search_jobspy(
                    query=queries[0] if queries else "",
                    location=location,
                    remote_only=remote_only
                )
                if jobspy_result and jobspy_result.jobs:
                    results.append(jobspy_result)
            except Exception as e:
                print(f"ERROR: JobSpy search failed: {e}")

        return results
    
    def _extract_country_context(self, location: str) -> tuple[Optional[str], Optional[str]]:
        if not location:
            return None, None
            
        loc_lower = location.lower()

        mappings = {
            "india": ("in", "India"),
            "mumbai": ("in", "India"),
            "bangalore": ("in", "India"),
            "bengaluru": ("in", "India"),
            "delhi": ("in", "India"),
            "gurgaon": ("in", "India"),
            "noida": ("in", "India"),
            "hyderabad": ("in", "India"),
            "chennai": ("in", "India"),
            "pune": ("in", "India"),
            
            "usa": ("us", "USA"),
            "united states": ("us", "USA"),
            "san francisco": ("us", "USA"),
            "new york": ("us", "USA"),
            "london": ("uk", "UK"),
            "uk": ("uk", "UK"),
            "canada": ("ca", "Canada"),
            "toronto": ("ca", "Canada"),
            "germany": ("de", "Germany"),
            "berlin": ("de", "Germany"),
        }
        
        for key, val in mappings.items():
            if key in loc_lower:
                return val
                
        return None, None

    
    async def _search_serpapi(
        self,
        query: str,
        location: Optional[str],
        max_results: int
    ) -> DiscoveryResult:
        jobs = []



        try:
            params = {
                "engine": "google_jobs",
                "q": query,
                "api_key": self.serpapi_key,
                "num": max_results
            }

            if location:
                params["location"] = location
               
                gl, _ = self._extract_country_context(location)
                if gl:
                    params["gl"] = gl

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get("https://serpapi.com/search", params=params)

                if response.status_code == 200:
                    data = response.json()

                    for job_data in data.get("jobs_results", [])[:max_results]:
                        posted_at = job_data.get("detected_extensions", {}).get("posted_at")

                        if not is_job_recent(posted_at, max_days=30):
                            continue

                        job = DiscoveredJob(
                            title=job_data.get("title", ""),
                            company=job_data.get("company_name", ""),
                            location=job_data.get("location", ""),
                            description=job_data.get("description", ""),
                            apply_url=self._extract_apply_url(job_data),
                            salary_range=job_data.get("detected_extensions", {}).get("salary"),
                            posted_date=posted_at,
                            source="serpapi"
                        )
                        if job.apply_url:
                            jobs.append(job)

        except Exception as e:
            print(f"SerpAPI error: {e}")

        return DiscoveryResult(jobs=jobs, source="serpapi", query_used=query)
    
    def _extract_apply_url(self, job_data: dict) -> str:
        apply_options = job_data.get("apply_options", [])
        if apply_options:
            for opt in apply_options:
                if opt.get("link"):
                    return opt["link"]

        related = job_data.get("related_links", [])
        if related:
            return related[0].get("link", "")

        return job_data.get("job_id", "")
    
    async def _search_ats_feeds(
        self,
        query: str,
        location: Optional[str] = None,
        remote_only: bool = False
    ) -> DiscoveryResult:
        jobs = []

        def _location_matches(preferred: str, actual: str) -> bool:
            preferred_l = (preferred or "").lower().strip()
            actual_l = (actual or "").lower().strip()
            if not preferred_l or not actual_l:
                return False
            if "india" in preferred_l:
                indian_markers = [
                    "india",
                    "mumbai",
                    "bombay",
                    "delhi",
                    "new delhi",
                    "bengaluru",
                    "bangalore",
                    "hyderabad",
                    "chennai",
                    "pune",
                    "kolkata",
                    "calcutta",
                    "ahmedabad",
                    "gurgaon",
                    "gurugram",
                    "noida",
                ]
                return any(m in actual_l for m in indian_markers)
            return preferred_l in actual_l

        def _job_passes_location_filters(job_location: str) -> bool:
            if remote_only:
                loc_l = (job_location or "").lower()
                return "remote" in loc_l or "work from home" in loc_l or "wfh" in loc_l
            if location:
                return _location_matches(location, job_location)
            return True

        
        companies = get_ats_companies_for_industry(None)[:10]  # Limit to 10 for speed

        for ats_type, company in companies:
            try:
                if ats_type == "greenhouse":
                    url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs"
                else:  
                    url = f"https://api.lever.co/v0/postings/{company}"

                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.get(url)

                    if response.status_code == 200:
                        data = response.json()

                        if ats_type == "greenhouse":
                            for job_data in data.get("jobs", [])[:5]:
                                posted_at = job_data.get("updated_at") or job_data.get("created_at")  # Use available date field
                                if not is_job_recent(posted_at, max_days=60):
                                    continue

                                job = DiscoveredJob(
                                    title=job_data.get("title", ""),
                                    company=company.title(),
                                    location=job_data.get("location", {}).get("name", ""),
                                    description=job_data.get("content", ""),
                                    apply_url=job_data.get("absolute_url", ""),
                                    posted_date=posted_at,
                                    source=f"greenhouse_{company}"
                                )
                                if _job_passes_location_filters(job.location):
                                    jobs.append(job)
                        else:  
                            items = data if isinstance(data, list) else []
                            for job_data in items[:5]:
                               
                                posted_at = job_data.get("publishedAt") or job_data.get("createdAt")

                                if posted_at and not is_job_recent(posted_at, max_days=60):
                                    continue

                                job = DiscoveredJob(
                                    title=job_data.get("text", ""),
                                    company=company.title(),
                                    location=job_data.get("categories", {}).get("location", ""),
                                    description=job_data.get("descriptionPlain", ""),
                                    apply_url=job_data.get("applyUrl", ""),
                                    posted_date=posted_at,
                                    source=f"lever_{company}"
                                )
                                if _job_passes_location_filters(job.location):
                                    jobs.append(job)

            except Exception as e:
                print(f"ATS feed error for {company}: {e}")

        return DiscoveryResult(jobs=jobs, source="ats_feeds", query_used=query)

    async def _search_jobspy(
        self,
        query: str,
        location: Optional[str] = None,
        remote_only: bool = False
    ) -> DiscoveryResult:
        jobs: List[DiscoveredJob] = []

        def _parse_list(value: str) -> List[str]:
            items = [v.strip() for v in (value or "").split(",")]
            return [v for v in items if v]



        try:
            try:
                from jobspy import scrape_jobs
            except Exception as e:
                print(f"JobSpy is enabled but python-jobspy is not available: {e}")
                return DiscoveryResult(jobs=[], source="jobspy", query_used=query)

            site_name = _parse_list(getattr(settings, "jobspy_sites", ""))
            proxies = _parse_list(getattr(settings, "jobspy_proxies", ""))
            results_wanted = int(getattr(settings, "jobspy_results_wanted", 20) or 20)
            hours_old = int(getattr(settings, "jobspy_hours_old", 168) or 168)

            requested_sites = [s for s in site_name if s]
            if not requested_sites:
                requested_sites = ["linkedin", "indeed", "naukri"]

            
            _, country_name = self._extract_country_context(location or "")
            country_indeed = country_name or getattr(settings, "jobspy_country_indeed", "India")

            def _run_scrape():
                return scrape_jobs(
                    site_name=requested_sites,
                    search_term=query,
                    location=location or "",
                    results_wanted=results_wanted,
                    hours_old=hours_old,
                    country_indeed=country_indeed,
                    is_remote=remote_only,
                    proxies=proxies or None,
                    verbose=0,
                )

            df = await asyncio.to_thread(_run_scrape)

            if df is None:
                return DiscoveryResult(jobs=[], source="jobspy", query_used=query)

            df = df.fillna("")

            records = []
            try:
                records = df.to_dict(orient="records")
            except Exception:
                records = []

            for row in records:
                title = (row.get("title") or row.get("TITLE") or "")
                company = (row.get("company") or row.get("COMPANY") or "")

                job_url = (
                    row.get("job_url")
                    or row.get("JOB_URL")
                    or row.get("url")
                    or row.get("apply_url")
                    or ""
                )

                description = (
                    row.get("description")
                    or row.get("DESCRIPTION")
                    or row.get("snippet")
                    or ""
                )

                site = (row.get("site") or row.get("SITE") or "jobspy")
                has_desc = bool(description.strip()) if isinstance(description, str) else bool(description)
                print(f"[JobSpy Debug] Site: {site}, Title: {title[:40]}, Has Description: {has_desc}, Desc Length: {len(str(description))}")
                if site == "naukri" and not has_desc:
                    print(f"[JobSpy Naukri Fields] {list(row.keys())}")

                loc = (
                    row.get("location")
                    or row.get("LOCATION")
                    or ""
                )

                if not loc:
                    city = row.get("city") or row.get("CITY") or ""
                    state = row.get("state") or row.get("STATE") or ""
                    loc = ", ".join([x for x in [city, state] if x])

                if not title or not company or not job_url:
                    continue

                if not title or not company or not job_url:
                    continue
                
                posted_date_val = row.get("date_posted") or row.get("DATE_POSTED") or ""
                posted_date_str = str(posted_date_val) if posted_date_val else ""

                jobs.append(
                    DiscoveredJob(
                        title=title,
                        company=company,
                        location=loc,
                        description=description,
                        apply_url=job_url,
                        posted_date=posted_date_str,
                        source=f"jobspy_{site}"
                    )
                )

        except Exception as e:
            print(f"JobSpy error: {e}")

        return DiscoveryResult(jobs=jobs, source="jobspy", query_used=query)


_discovery_agent: Optional[DiscoveryAgent] = None


def get_discovery_agent() -> DiscoveryAgent:
    global _discovery_agent
    if _discovery_agent is None:
        _discovery_agent = DiscoveryAgent()
    return _discovery_agent
