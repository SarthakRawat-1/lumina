from typing import List, Optional, Dict
import chromadb
from chromadb.config import Settings as ChromaSettings
import chromadb.utils.embedding_functions as ef

from src.config.settings import settings


class JobVectorService:
    def __init__(self):
        self.embedding_fn = None
        if settings.google_cloud_api:
            self.embedding_fn = ef.GoogleGenerativeAiEmbeddingFunction(
                api_key=settings.google_cloud_api,
                model_name="gemini-embedding-001"
            )
        
        if settings.chroma_api_key and settings.chroma_tenant and settings.chroma_database:
            self.client = chromadb.HttpClient(
                host="api.trychroma.com",
                ssl=True,
                headers={
                    "x-chroma-token": settings.chroma_api_key,
                },
                tenant=settings.chroma_tenant,
                database=settings.chroma_database
            )
            print(f"Job Vector: Connected to Chroma Cloud")
        else:
            self.client = chromadb.Client(ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            ))
            print("Job Vector: Using local Chroma (in-memory)")
    
    async def index_jobs(
        self,
        search_id: str,
        jobs: List[Dict],
        recreate: bool = True
    ) -> int:
        collection_name = f"job_search_{search_id}"

        if recreate:
            try:
                self.client.delete_collection(name=collection_name)
            except:
                pass  

        collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"search_id": search_id},
            embedding_function=self.embedding_fn
        )

        documents = []
        metadatas = []
        ids = []
        
        for i, job in enumerate(jobs):
            job_id = job.get("job_id", f"job_{i}")
            title = job.get("title", "Unknown")
            company = job.get("company", "Unknown")
            location = job.get("location", "")
            location_type = job.get("location_type", "onsite")
            description = job.get("description", "")[:500]  
            match_score = job.get("match_score", 0)
            matching_skills = job.get("matching_skills", [])
            salary_min = job.get("salary_min")
            salary_max = job.get("salary_max")

            summary = f"{title} at {company} ({location}). "
            if location_type == "remote":
                summary += "Remote. "
            summary += f"Skills: {', '.join(matching_skills[:5])}. "
            if salary_min:
                summary += f"Salary: ${int(salary_min/1000)}k"
                if salary_max:
                    summary += f"-${int(salary_max/1000)}k"
                summary += ". "
            summary += description
            
            documents.append(summary)

            metadatas.append({
                "job_id": job_id,
                "title": title,
                "company": company,
                "location": location,
                "location_type": location_type,
                "match_score": float(match_score),
                "salary_min": int(salary_min) if salary_min else 0,
                "salary_max": int(salary_max) if salary_max else 0,
            })
            
            ids.append(job_id)

        if documents:
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            print(f"📊 Indexed {len(documents)} jobs to Chroma for search {search_id[:8]}...")
        
        return len(documents)
    
    async def search_jobs(
        self,
        search_id: str,
        query: str,
        n_results: int = 10,
        filter_remote: Optional[bool] = None
    ) -> List[str]:
        collection_name = f"job_search_{search_id}"
        
        try:
            collection = self.client.get_collection(name=collection_name, embedding_function=self.embedding_fn)
        except:
            print(f"Collection not found for search {search_id}")
            return []

        where_filter = None
        if filter_remote is not None:
            where_filter = {"location_type": "remote" if filter_remote else "onsite"}

        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where_filter
        )

        job_ids = []
        if results["ids"] and results["ids"][0]:
            job_ids = results["ids"][0]
        
        print(f"Chroma returned {len(job_ids)} relevant jobs for query: '{query[:50]}...'")
        return job_ids
    
    async def delete_search(self, search_id: str) -> bool:
        collection_name = f"job_search_{search_id}"
        try:
            self.client.delete_collection(name=collection_name)
            return True
        except:
            return False
    
    async def calculate_semantic_match(
        self,
        search_id: str,
        candidate_profile: str,
        job_ids: List[str]
    ) -> Dict[str, float]:
        collection_name = f"job_search_{search_id}"
        scores = {}
        
        try:
            collection = self.client.get_collection(name=collection_name, embedding_function=self.embedding_fn)
            
            results = collection.query(
                query_texts=[candidate_profile],
                n_results=min(len(job_ids), 100),
                include=["distances"]
            )
            
            if results["ids"] and results["distances"]:
                for i, job_id in enumerate(results["ids"][0]):
                    if job_id in job_ids:
                        distance = results["distances"][0][i]
                        similarity = 1 / (1 + distance)
                        scores[job_id] = round(similarity, 3)

            for job_id in job_ids:
                if job_id not in scores:
                    scores[job_id] = 0.5  
                    
        except Exception as e:
            print(f"Semantic match error: {e}")
            scores = {job_id: 0.5 for job_id in job_ids}
        
        return scores


_job_vector_service: Optional[JobVectorService] = None


def get_job_vector_service() -> JobVectorService:
    global _job_vector_service
    if _job_vector_service is None:
        _job_vector_service = JobVectorService()
    return _job_vector_service
