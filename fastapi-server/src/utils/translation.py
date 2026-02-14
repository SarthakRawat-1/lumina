import asyncio
import json
import urllib.request
import urllib.parse
import urllib.error
from typing import List, Optional
from src.config.settings import settings

class TranslationService:
    SUPPORTED_LANGUAGES = [
        {"code": "en", "name": "English", "native_name": "English"},
        {"code": "fr", "name": "French", "native_name": "Français"},
        {"code": "de", "name": "German", "native_name": "Deutsch"},
        {"code": "es", "name": "Spanish", "native_name": "Español"},
        {"code": "pt", "name": "Portuguese", "native_name": "Português"},
        {"code": "it", "name": "Italian", "native_name": "Italiano"},
        {"code": "hi", "name": "Hindi", "native_name": "हिन्दी"},
        {"code": "ta", "name": "Tamil", "native_name": "தமிழ்"},
        {"code": "te", "name": "Telugu", "native_name": "తెలుగు"},
        {"code": "bn", "name": "Bengali", "native_name": "বাংলা"},
        {"code": "mr", "name": "Marathi", "native_name": "मराठी"},
        {"code": "gu", "name": "Gujarati", "native_name": "ગુજરાતી"},
        {"code": "kn", "name": "Kannada", "native_name": "ಕನ್ನಡ"},
        {"code": "ml", "name": "Malayalam", "native_name": "മലയാളം"},
        {"code": "pa", "name": "Punjabi", "native_name": "ਪੰਜਾਬੀ"},
        {"code": "or", "name": "Odia", "native_name": "ଓଡ଼ିଆ"},
    ]
    
    TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2"
    
    MAX_CHUNK_SIZE = 4500
    
    def __init__(self):
        self.api_key = settings.google_cloud_api
        if not self.api_key:
            raise ValueError("GOOGLE_CLOUD_API environment variable is required")
    
    def get_supported_languages(self) -> List[dict]:
        return self.SUPPORTED_LANGUAGES
    
    def is_language_supported(self, language_code: str) -> bool:
        return any(lang["code"] == language_code for lang in self.SUPPORTED_LANGUAGES)
    
    def _make_request_sync(
        self,
        payload: dict,
        format_type: str = "text"
    ) -> dict:
        url = f"{self.TRANSLATE_URL}?key={self.api_key}"

        payload["format"] = format_type

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            print(f"Translation HTTP error: {e.code} - {e.reason}")
            return {}
        except urllib.error.URLError as e:
            print(f"Translation URL error: {e.reason}")
            return {}
        except Exception as e:
            print(f"Translation error: {e}")
            return {}
    
    def _translate_sync(
        self, 
        text: str, 
        target_lang: str, 
        source_lang: str = "en",
        format_type: str = "text"
    ) -> str:
        payload = {
            "q": text,
            "source": source_lang,
            "target": target_lang
        }
        
        data = self._make_request_sync(payload, format_type)
        translations = data.get("data", {}).get("translations", [])
        
        if translations:
            return translations[0].get("translatedText", text)
        return text
    
    def _translate_batch_sync(
        self, 
        texts: List[str], 
        target_lang: str, 
        source_lang: str = "en",
        format_type: str = "text"
    ) -> List[str]:
        payload = {
            "q": texts,
            "source": source_lang,
            "target": target_lang
        }
        
        data = self._make_request_sync(payload, format_type)
        translations = data.get("data", {}).get("translations", [])
        
        if translations:
            return [t.get("translatedText", texts[i]) for i, t in enumerate(translations)]
        return texts
    
    async def translate(
        self, 
        text: str, 
        target_lang: str, 
        source_lang: str = "en"
    ) -> str:
        if target_lang == "en" or target_lang == source_lang:
            return text

        if not text or not text.strip():
            return text

        if len(text) > self.MAX_CHUNK_SIZE:
            return await self.translate_chunked(text, target_lang, source_lang)

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, 
            self._translate_sync, 
            text, 
            target_lang, 
            source_lang,
            "text"
        )
    
    async def translate_batch(
        self, 
        texts: List[str], 
        target_lang: str, 
        source_lang: str = "en"
    ) -> List[str]:
        if target_lang == "en" or target_lang == source_lang:
            return texts

        non_empty_indices = [i for i, t in enumerate(texts) if t and t.strip()]
        non_empty_texts = [texts[i] for i in non_empty_indices]
        
        if not non_empty_texts:
            return texts
 
        loop = asyncio.get_event_loop()
        translated = await loop.run_in_executor(
            None,
            self._translate_batch_sync,
            non_empty_texts,
            target_lang,
            source_lang,
            "text"
        )

        result = texts.copy()
        for idx, translation in zip(non_empty_indices, translated):
            result[idx] = translation
        
        return result
    
    async def translate_chunked(
        self, 
        long_text: str, 
        target_lang: str, 
        source_lang: str = "en",
        chunk_size: int = None
    ) -> str:
        if target_lang == "en" or target_lang == source_lang:
            return long_text
        
        chunk_size = chunk_size or self.MAX_CHUNK_SIZE

        paragraphs = long_text.split("\n\n")
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            if len(current_chunk) + len(para) + 2 > chunk_size:
                if current_chunk:
                    chunks.append(current_chunk)

                if len(para) > chunk_size:
                    sentences = para.replace(". ", ".|").split("|")
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) + 1 > chunk_size:
                            if current_chunk:
                                chunks.append(current_chunk)
                            current_chunk = sentence
                        else:
                            current_chunk = current_chunk + " " + sentence if current_chunk else sentence
                else:
                    current_chunk = para
            else:
                current_chunk = current_chunk + "\n\n" + para if current_chunk else para
        
        if current_chunk:
            chunks.append(current_chunk)

        translated_chunks = await self.translate_batch(chunks, target_lang, source_lang)

        return "\n\n".join(translated_chunks)
    
    async def translate_html(
        self, 
        html_content: str, 
        target_lang: str, 
        source_lang: str = "en"
    ) -> str:
        if target_lang == "en" or target_lang == source_lang:
            return html_content
        
        if not html_content or not html_content.strip():
            return html_content

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._translate_sync,
            html_content,
            target_lang,
            source_lang,
            "html"
        )

_translation_service: Optional[TranslationService] = None


def get_translation_service() -> TranslationService:
    global _translation_service
    if _translation_service is None:
        _translation_service = TranslationService()
    return _translation_service
