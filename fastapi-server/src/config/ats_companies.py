TECH_COMPANIES = [
    ("greenhouse", "airbnb"),
    ("greenhouse", "stripe"),
    ("greenhouse", "twitch"),
    ("greenhouse", "lyft"),
    ("greenhouse", "netflix"),
    ("greenhouse", "coinbase"),
    ("greenhouse", "databricks"),
    ("greenhouse", "notion"),
    ("greenhouse", "plaid"),
    ("greenhouse", "airtable"),
    ("lever", "figma"),
    ("lever", "netlify"),
    ("lever", "vercel"),
    ("lever", "linear"),
]

FINANCE_COMPANIES = [
    ("greenhouse", "affirm"),
    ("greenhouse", "gemini"),
    ("greenhouse", "kkr"),
    ("greenhouse", "m1finance"),
    ("greenhouse", "nerdwallet"),
    ("greenhouse", "robinhood"),
    ("lever", "paytm"),
    ("lever", "dunandbradsreet"),
]

HEALTHCARE_COMPANIES = [
    ("greenhouse", "tempus"),
    ("greenhouse", "oscar"),
    ("greenhouse", "ro"),
    ("greenhouse", "zocdoc"),
    ("greenhouse", "coherehealth"),
    ("greenhouse", "modernhealth"),
]

RETAIL_COMPANIES = [
    ("greenhouse", "warbyparker"),
    ("greenhouse", "glossier"),
    ("greenhouse", "allbirds"),
    ("greenhouse", "casper"),
    ("greenhouse", "everlane"),
]

EDUCATION_COMPANIES = [
    ("greenhouse", "duolingo"),
    ("greenhouse", "coursera"),
    ("greenhouse", "chegg"),
    ("lever", "duke"),
]

REAL_ESTATE_COMPANIES = [
    ("greenhouse", "opendoor"),
    ("greenhouse", "compass"),
    ("lever", "winncompanies"),
]

MEDIA_COMPANIES = [
    ("greenhouse", "spotify"),
    ("greenhouse", "buzzfeed"),
    ("greenhouse", "vox"),
    ("greenhouse", "medium"),
]

ALL_ATS_COMPANIES = (
    TECH_COMPANIES +
    FINANCE_COMPANIES +
    HEALTHCARE_COMPANIES +
    RETAIL_COMPANIES +
    EDUCATION_COMPANIES +
    REAL_ESTATE_COMPANIES +
    MEDIA_COMPANIES
)


def get_ats_companies_for_industry(industry: str = None) -> list:
    if industry is None:
        return ALL_ATS_COMPANIES
    
    industry_map = {
        "tech": TECH_COMPANIES,
        "finance": FINANCE_COMPANIES,
        "healthcare": HEALTHCARE_COMPANIES,
        "retail": RETAIL_COMPANIES,
        "education": EDUCATION_COMPANIES,
        "real_estate": REAL_ESTATE_COMPANIES,
        "media": MEDIA_COMPANIES,
    }
    
    return industry_map.get(industry.lower(), ALL_ATS_COMPANIES)
