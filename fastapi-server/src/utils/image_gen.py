import os
import asyncio
from typing import Optional

import vertexai
from vertexai.preview.vision_models import ImageGenerationModel

from src.config.settings import settings


class ImageGenService:
    def __init__(self):
        if settings.google_application_credentials and not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.google_application_credentials
        
        if settings.gcp_project_id:
            vertexai.init(project=settings.gcp_project_id, location="us-central1")
        
        self._model: Optional[ImageGenerationModel] = None
    
    def _get_model(self) -> ImageGenerationModel:
        if self._model is None:
            self._model = ImageGenerationModel.from_pretrained(settings.imagen_model)
        return self._model
    
    async def generate_image(self, prompt: str, style: str = "educational") -> bytes:
        model = self._get_model()
        
        style_suffixes = {
            "educational": "clean educational illustration, simple and clear, professional diagram style",
            "cinematic": "cinematic lighting, photorealistic, highly detailed, 4k",
            "minimal": "minimalist design, flat colors, simple shapes",
        }
        
        suffix = style_suffixes.get(style, style_suffixes["educational"])
        full_prompt = f"{prompt}, {suffix}"
        
        def _generate():
            images = model.generate_images(
                prompt=full_prompt,
                number_of_images=1,
                aspect_ratio="16:9"
            )
            return images[0]._image_bytes
        
        return await asyncio.to_thread(_generate)
    
    def is_available(self) -> bool:
        return bool(settings.gcp_project_id and settings.imagen_model)


_image_gen_service: Optional[ImageGenService] = None


def get_image_gen_service() -> ImageGenService:
    global _image_gen_service
    if _image_gen_service is None:
        _image_gen_service = ImageGenService()
    return _image_gen_service
