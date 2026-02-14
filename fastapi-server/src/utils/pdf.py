import os
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

try:
    import fitz  
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

logger = logging.getLogger(__name__)

class PDFParser:
    def __init__(self):
        self.output_dir = Path("/tmp/flashcard_images")
        self.output_dir.mkdir(exist_ok=True)
    
    def extract_text_and_metadata(self, pdf_path: str) -> Dict[str, Any]:
        if HAS_PYMUPDF:
            return self._extract_with_pymupdf(pdf_path)
        elif HAS_PYPDF:
            return self._extract_with_pypdf(pdf_path)
        else:
            raise RuntimeError("No PDF library available. Install 'pymupdf' or 'pypdf'.")
    
    def _extract_with_pymupdf(self, pdf_path: str) -> Dict[str, Any]:
        doc = fitz.open(pdf_path)
        
        metadata = {
            "title": doc.metadata.get("title", "Unknown"),
            "author": doc.metadata.get("author", "Unknown"),
            "page_count": len(doc)
        }
        
        pages = []
        toc = doc.get_toc()
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            pages.append({
                "page_num": page_num + 1,
                "text": text,
                "char_count": len(text)
            })

        doc.close()

        return {
            "metadata": metadata,
            "pages": pages,
            "toc": toc,
            "total_text": " ".join([p["text"] for p in pages])
        }
    
    def _extract_with_pypdf(self, pdf_path: str) -> Dict[str, Any]:
        reader = PdfReader(pdf_path)
        
        meta = reader.metadata or {}
        metadata = {
            "title": meta.get("/Title", "Unknown") if meta else "Unknown",
            "author": meta.get("/Author", "Unknown") if meta else "Unknown",
            "page_count": len(reader.pages)
        }
        
        pages = []
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            pages.append({
                "page_num": page_num + 1,
                "text": text,
                "char_count": len(text)
            })
        
        toc = []

        return {
            "metadata": metadata,
            "pages": pages,
            "toc": toc,
            "total_text": " ".join([p["text"] for p in pages])
        }
    
    def identify_chapters(
        self, 
        pdf_data: Dict[str, Any], 
        chapter_mode: str, 
        slides_per_chapter: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        if chapter_mode == "manual" and slides_per_chapter:
            total_pages = pdf_data["metadata"]["page_count"]
            chapters = []

            for i in range(0, total_pages, slides_per_chapter):
                end_page = min(i + slides_per_chapter, total_pages)
                chapters.append({
                    "title": f"Chapter {len(chapters) + 1}",
                    "start_page": i + 1,
                    "end_page": end_page,
                    "pages": list(range(i, end_page)),
                    "text": " ".join([
                        pdf_data["pages"][p]["text"] 
                        for p in range(i, end_page) 
                        if p < len(pdf_data["pages"])
                    ])
                })

            return chapters

        elif chapter_mode == "auto":
            toc = pdf_data.get("toc", [])
            if not toc:
                return self.identify_chapters(pdf_data, "manual", 10)

            chapters = []
            for i, (level, title, page_num) in enumerate(toc):
                if level == 1:
                    start_page = page_num
                    end_page = pdf_data["metadata"]["page_count"]
                    for j in range(i + 1, len(toc)):
                        if toc[j][0] == 1:
                            end_page = toc[j][2] - 1
                            break

                    page_indices = list(range(start_page - 1, end_page))
                    chapters.append({
                        "title": title,
                        "start_page": start_page,
                        "end_page": end_page,
                        "pages": page_indices,
                        "text": " ".join([
                            pdf_data["pages"][p]["text"] 
                            for p in page_indices 
                            if p < len(pdf_data["pages"])
                        ])
                    })

            return chapters if chapters else self.identify_chapters(pdf_data, "manual", 10)

        else:
            return self.identify_chapters(pdf_data, "manual", 10)

class DocumentAIService:
    def __init__(self):
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = os.getenv("GCP_DOCUMENT_AI_LOCATION", "us")
        self.processor_id = os.getenv("GCP_DOCUMENT_AI_PROCESSOR_ID")
        self._doc_ai_client = None
    
    def _get_doc_ai_client(self):
        if self._doc_ai_client is None:
            if not self.project_id or not self.processor_id:
                logger.warning("Document AI not configured for OCR fallback")
                return None
            
            try:
                from google.cloud import documentai_v1 as documentai
                from google.api_core.client_options import ClientOptions
                
                opts = ClientOptions(
                    api_endpoint=f"{self.location}-documentai.googleapis.com"
                )
                self._doc_ai_client = documentai.DocumentProcessorServiceClient(
                    client_options=opts
                )
                self._processor_name = self._doc_ai_client.processor_path(
                    self.project_id, self.location, self.processor_id
                )
            except Exception as e:
                logger.error(f"Failed to init Document AI: {e}")
                return None
        
        return self._doc_ai_client
    
    def _extract_with_pymupdf(self, pdf_content: bytes) -> Optional[str]:
        if not HAS_PYMUPDF:
            return None
            
        try:
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            text_parts = []
            
            for page in doc:
                text = page.get_text()
                if text.strip():
                    text_parts.append(text)
            
            doc.close()
            
            full_text = "\n\n".join(text_parts)
            
            if len(full_text.strip()) > 50:
                logger.info(f"PyMuPDF extracted {len(full_text)} chars")
                return full_text
            
            return None
            
        except Exception as e:
            logger.error(f"PyMuPDF extraction failed: {e}")
            return None
    
    def _extract_with_document_ai(self, pdf_content: bytes) -> Optional[str]:
        client = self._get_doc_ai_client()
        if not client:
            return None
        
        try:
            from google.cloud import documentai_v1 as documentai
            
            raw_document = documentai.RawDocument(
                content=pdf_content,
                mime_type="application/pdf"
            )
            
            request = documentai.ProcessRequest(
                name=self._processor_name,
                raw_document=raw_document
            )
            
            result = client.process_document(request=request)
            text = result.document.text
            
            logger.info(f"Document AI OCR extracted {len(text)} chars")
            return text
            
        except Exception as e:
            logger.error(f"Document AI OCR failed: {e}")
            return None
    
    async def extract_text_from_pdf(self, pdf_content: bytes) -> Optional[str]:
        text = self._extract_with_pymupdf(pdf_content)
        
        if text:
            return text
        
        logger.info("No text found with PyMuPDF, trying Document AI OCR...")
        return self._extract_with_document_ai(pdf_content)
    
    async def extract_structured_content(self, pdf_content: bytes) -> dict:
        if not HAS_PYMUPDF:
            return {"text": "", "pages": [], "sections": []}
            
        try:
            doc = fitz.open(stream=pdf_content, filetype="pdf")
            
            pages = []
            full_text = ""
            
            for i, page in enumerate(doc):
                page_text = page.get_text()
                pages.append({
                    "page_number": i + 1,
                    "text": page_text.strip()
                })
                full_text += page_text + "\n\n"
            
            doc.close()
            
            sections = self._detect_sections(full_text)
            
            return {
                "text": full_text.strip(),
                "pages": pages,
                "sections": sections
            }
            
        except Exception as e:
            logger.error(f"Failed to extract structured content: {e}")
            return {"text": "", "pages": [], "sections": []}
    
    def _detect_sections(self, text: str) -> list:
        lines = text.split("\n")
        sections = []
        current_section = {"title": "Introduction", "content": ""}
        
        for line in lines:
            stripped = line.strip()
            if stripped and len(stripped) < 80 and not stripped.endswith("."):
                if current_section["content"]:
                    sections.append(current_section)
                current_section = {"title": stripped, "content": ""}
            else:
                current_section["content"] += line + "\n"
        
        if current_section["content"]:
            sections.append(current_section)
        
        return sections

_document_ai_service = None

def get_document_ai_service() -> DocumentAIService:
    global _document_ai_service
    if _document_ai_service is None:
        _document_ai_service = DocumentAIService()
    return _document_ai_service
