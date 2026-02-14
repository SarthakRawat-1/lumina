from typing import List, Optional
import chromadb
import chromadb.utils.embedding_functions as ef

from src.config.settings import settings


class VectorService:
    def __init__(self):
        if not (settings.chroma_api_key and settings.chroma_tenant and settings.chroma_database):
            raise ValueError(
                "Chroma Cloud credentials required. Set CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE"
            )
        
        self.client = chromadb.HttpClient(
            host="api.trychroma.com",
            ssl=True,
            headers={
                "x-chroma-token": settings.chroma_api_key,
            },
            tenant=settings.chroma_tenant,
            database=settings.chroma_database
        )
        print(f"Connected to Chroma Cloud (tenant: {settings.chroma_tenant[:8]}...)")

        self.embedding_fn = ef.GoogleGenerativeAiEmbeddingFunction(
            api_key=settings.google_cloud_api,
            model_name="gemini-embedding-001"
        )
        
        self.collection_name = settings.chroma_collection
        self._collection = None
    
    @property
    def collection(self):
        if self._collection is None:
            self._collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "Lumina course documents"},
                embedding_function=self.embedding_fn
            )
        return self._collection
    
    async def add_documents(
        self,
        documents: List[str],
        metadatas: List[dict] = None,
        ids: List[str] = None,
        course_id: str = None
    ) -> List[str]:
        if not documents:
            return []

        if ids is None:
            import uuid
            ids = [str(uuid.uuid4()) for _ in documents]

        if course_id and metadatas:
            metadatas = [{**m, "course_id": course_id} for m in metadatas]
        elif course_id:
            metadatas = [{"course_id": course_id} for _ in documents]
        
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        
        return ids
    
    async def query(
        self,
        query_text: str,
        n_results: int = 5,
        course_id: str = None
    ) -> List[dict]:
        where_filter = None
        if course_id:
            where_filter = {"course_id": course_id}
        
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where_filter
        )

        documents = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                documents.append({
                    "id": results["ids"][0][i] if results["ids"] else None,
                    "content": doc,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results.get("distances") else None
                })
        
        return documents
    
    async def delete_by_course(self, course_id: str) -> int:
        results = self.collection.get(
            where={"course_id": course_id}
        )
        
        if results["ids"]:
            self.collection.delete(ids=results["ids"])
            return len(results["ids"])
        
        return 0
    
    async def get_context_for_topic(
        self,
        topic: str,
        course_id: str = None,
        max_tokens: int = 2000
    ) -> str:
        results = await self.query(topic, n_results=5, course_id=course_id)
        
        context_parts = []
        current_length = 0
        
        for doc in results:
            content = doc["content"]
            tokens = len(content.split()) / 0.75
            
            if current_length + tokens > max_tokens:
                break
            
            context_parts.append(content)
            current_length += tokens
        
        return "\n\n---\n\n".join(context_parts)

    async def add_video_segments(
        self,
        video_id: str,
        segments: List[dict]
    ) -> int:
        if not segments:
            return 0

        video_collection = self.client.get_or_create_collection(
            name="video_segments",
            metadata={"description": "Video transcript segments for semantic search"},
            embedding_function=self.embedding_fn
        )
        
        documents = []
        metadatas = []
        ids = []
        
        for i, seg in enumerate(segments):
            text = seg.get("text", "")
            if not text.strip():
                continue
                
            documents.append(text)
            metadatas.append({
                "video_id": video_id,
                "start_time": seg.get("start_time", 0),
                "end_time": seg.get("end_time", 0),
                "index": seg.get("index", i)
            })
            ids.append(f"{video_id}_{i}")
        
        if documents:
            video_collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
        
        return len(documents)

    async def query_video_segments(
        self,
        video_id: str,
        query: str,
        n_results: int = 10
    ) -> List[dict]:
        try:
            video_collection = self.client.get_or_create_collection(name="video_segments", embedding_function=self.embedding_fn)
            
            results = video_collection.query(
                query_texts=[query],
                n_results=n_results,
                where={"video_id": video_id}
            )
            
            segments = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                    segments.append({
                        "text": doc,
                        "start_time": metadata.get("start_time", 0),
                        "end_time": metadata.get("end_time", 0),
                        "index": metadata.get("index", i),
                        "distance": results["distances"][0][i] if results.get("distances") else None
                    })
            
            return segments
        except Exception as e:
            print(f"[VectorService] Error querying video segments: {e}")
            return []

    async def delete_video_segments(self, video_id: str) -> int:
        try:
            video_collection = self.client.get_or_create_collection(name="video_segments", embedding_function=self.embedding_fn)

            results = video_collection.get(
                where={"video_id": video_id}
            )
            
            if results["ids"]:
                video_collection.delete(ids=results["ids"])
                return len(results["ids"])
            
            return 0
        except Exception as e:
            print(f"[VectorService] Error deleting video segments: {e}")
            return 0

_vector_service: Optional[VectorService] = None

def get_vector_service() -> VectorService:
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
    return _vector_service
