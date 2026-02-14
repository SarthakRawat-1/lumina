from typing import Optional, List

from src.models.jobs.schemas import DiscoveredJob, NormalizedJob, NormalizationResult
from src.utils.url import normalize_url
from src.utils.salary import parse_salary_range
from src.utils.job_text import infer_location_type, create_job_hash_key

class NormalizationAgent:
    def __init__(self):
        pass
    
    async def normalize_and_deduplicate(
        self,
        jobs: List[DiscoveredJob]
    ) -> NormalizationResult:
        from src.utils.job_date import is_job_recent

        total_before = len(jobs)
        seen = {}

        for job in jobs:
            if job.posted_date and not is_job_recent(job.posted_date, max_days=14):
                continue

            key = self._create_job_key(job)

            if key in seen:
                existing = seen[key]
                existing.sources_found.append(job.source)

                if not existing.description and job.description:
                    existing.description = job.description
                if not existing.salary_min and job.salary_range:
                    self._parse_salary(job.salary_range, existing)
            else:
                normalized = self._normalize_job(job)
                seen[key] = normalized

        normalized_jobs = list(seen.values())
        duplicates_removed = total_before - len(normalized_jobs)

        return NormalizationResult(
            jobs=normalized_jobs,
            duplicates_removed=duplicates_removed,
            total_before=total_before,
            total_after=len(normalized_jobs)
        )
    
    def _create_job_key(self, job: DiscoveredJob) -> str:
        normalized_url = normalize_url(job.apply_url)
        return create_job_hash_key(normalized_url, job.title)
    

    
    def _normalize_job(self, job: DiscoveredJob) -> NormalizedJob:
        job_id = self._create_job_key(job)

        title = self._validate_job_title(job.title.strip())

        company = self._validate_company_name(job.company.strip())

        location = self._validate_location(job.location.strip())

        combined_text = f"{location} {title} {job.description}"
        location_type = infer_location_type(combined_text)

        salary_min, salary_max = None, None
        if job.salary_range:
            salary_min, salary_max = parse_salary_range(job.salary_range)
        if not salary_min and job.description:
            salary_min, salary_max = parse_salary_range(job.description)

        return NormalizedJob(
            job_id=job_id,
            title=title,
            company=company,
            location=location,
            location_type=location_type,
            description=job.description if job.description else "",
            apply_url=job.apply_url,
            salary_min=salary_min,
            salary_max=salary_max,
            posted_date=job.posted_date,
            sources_found=[job.source]
        )

    def _validate_job_title(self, title: str) -> str:
        if not title or len(title.strip()) < 2:
            return "Unspecified Position"

        title = title.replace("Apply Now", "").replace("Apply Here", "").strip()
        title = title.replace("[", "").replace("]", "").strip()
        title = title.replace("(", "").replace(")", "").strip()

        import re
        title = re.sub(r'\$\d+k?', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\$\d+,?\d*', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\d+k?-?\d*k?', '', title, flags=re.IGNORECASE)

        return title.strip()

    def _validate_company_name(self, company: str) -> str:
        if not company or len(company.strip()) < 1:
            return "Unknown Company"

        company = company.replace("Company", "").replace("Corp", "").strip()
        company = company.replace("Inc", "").replace("Ltd", "").strip()
        company = company.replace("LLC", "").strip()

        company = company.rstrip(".:,;-").strip()

        return company.strip()

    def _validate_location(self, location: str) -> str:
        if not location or len(location.strip()) < 2:
            return "Remote"

        location = location.replace("Location:", "").strip()
        location = location.replace("Work From Home", "").strip()
        location = location.replace("WFH", "").strip()

        location = location.replace("United States", "USA").replace("United Kingdom", "UK").strip()

        return location.strip()
    
    def _parse_salary(self, salary_range: str, job: NormalizedJob):
        min_sal, max_sal = parse_salary_range(salary_range)
        if min_sal:
            job.salary_min = min_sal
        if max_sal:
            job.salary_max = max_sal


_normalization_agent: Optional[NormalizationAgent] = None


def get_normalization_agent() -> NormalizationAgent:
    global _normalization_agent
    if _normalization_agent is None:
        _normalization_agent = NormalizationAgent()
    return _normalization_agent
