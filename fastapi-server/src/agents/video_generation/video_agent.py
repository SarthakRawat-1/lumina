import json
import uuid
import os
import asyncio
from typing import Optional, List

import vertexai
from vertexai.generative_models import GenerativeModel
from google.cloud import storage

from src.config.settings import settings
from src.models.video_generation.schemas import (
    SceneScript,
    GeneratedScript,
    VideoScene,
    VideoBlueprint,
)
from src.prompts.video_generation.script_prompts import (
    get_script_prompt,
    get_language_instruction,
    SCENE_COUNTS,
)
from src.utils.tts import get_tts_service
from src.utils.image_gen import get_image_gen_service


class VideoAgent:
    def __init__(self):
        if settings.google_application_credentials and not os.environ.get(
            "GOOGLE_APPLICATION_CREDENTIALS"
        ):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = (
                settings.google_application_credentials
            )

        if settings.gcp_project_id:
            vertexai.init(project=settings.gcp_project_id, location="us-central1")

        self.tts_service = get_tts_service()
        self.image_service = get_image_gen_service()
        self.storage_client = storage.Client() if settings.gcp_bucket_name else None
        self.gemini_model = GenerativeModel(settings.gemini_model)
        self._research_agent = None

    def _get_research_service(self):
        if self._research_agent is None:
            try:
                from src.utils.research import get_research_service

                self._research_agent = get_research_service()
            except ValueError:
                self._research_agent = None
        return self._research_agent


    async def _generate_scene(
        self,
        scene_script: "SceneScript",
        index: int,
        video_id: str,
        language: str,
    ) -> VideoScene:
        print(f"Processing scene {index + 1}...")

        if not (self.storage_client and settings.gcp_bucket_name):
            raise ValueError(
                "GCS bucket is required for video generation. "
                "Please set GCP_BUCKET_NAME in environment."
            )

        audio_task = self.tts_service.synthesize_for_video(text=scene_script.text, language=language)
        image_task = self.image_service.generate_image(prompt=scene_script.visual_prompt, style="cinematic")

        audio_bytes, duration_seconds = await audio_task
        image_bytes = await image_task

        audio_upload_task = self._upload_to_gcs(
            audio_bytes, f"{video_id}/audio_{index}.mp3", "audio/mpeg"
        )
        image_upload_task = self._upload_to_gcs(
            image_bytes, f"{video_id}/image_{index}.png", "image/png"
        )

        audio_url, image_url = await asyncio.gather(
            audio_upload_task, image_upload_task
        )
        duration_frames = int(duration_seconds * 30)

        return VideoScene(
            index=index,
            caption=scene_script.text,
            image_url=image_url,
            audio_url=audio_url,
            duration_frames=duration_frames,
        )

    async def generate_video(
        self, topic: str, language: str = "English (US)", duration_mode: str = "short"
    ) -> VideoBlueprint:
        video_id = str(uuid.uuid4())
        print(f"Starting video generation: {video_id}")
        print(f"Topic: {topic}")
        print(f"Language: {language}")
        print(f"Duration: {duration_mode}")
        print("Generating script with Gemini...")
        script = await self._generate_script(topic, language, duration_mode)
        print(f"Generated {len(script.scenes)} scenes")
        print(f"Generating {len(script.scenes)} scenes (Batched)")

        results = []
        BATCH_SIZE = 5

        for i in range(0, len(script.scenes), BATCH_SIZE):
            batch_scenes = script.scenes[i : i + BATCH_SIZE]
            print(f"   Processing batch {i//BATCH_SIZE + 1} (Scenes {i+1}-{i+len(batch_scenes)})...")

            batch_tasks = [
                self._generate_scene(
                    scene_script=scene,
                    index=i + j,
                    video_id=video_id,
                    language=language,
                )
                for j, scene in enumerate(batch_scenes)
            ]

            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
            results.extend(batch_results)

        scenes: List[VideoScene] = []
        errors = []

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                error_msg = f"Scene {i + 1} failed: {str(result)}"
                print(error_msg)
                errors.append(error_msg)
            else:
                scenes.append(result)

        scenes.sort(key=lambda s: s.index)

        if errors:
            error_summary = "\n".join(errors)
            raise RuntimeError(
                f"Video generation partially failed. {len(errors)}/{len(script.scenes)} scenes failed.\n"
                f"Errors:\n{error_summary}"
            )

        print(f"Successfully generated {len(scenes)}/{len(script.scenes)} scenes")

        total_frames = sum(s.duration_frames for s in scenes)
        total_seconds = total_frames / 30

        from src.prompts.video_generation.script_prompts import TARGET_DURATIONS

        target_seconds = TARGET_DURATIONS.get(duration_mode, 60)

        deviation = total_seconds - target_seconds
        deviation_percent = (abs(deviation) / target_seconds) * 100

        print(f"Video generation complete!")
        print(f"Target: {target_seconds}s (duration_mode: {duration_mode})")
        print(f"Actual: {total_seconds:.1f}s")
        print(f"Deviation: {deviation:+.1f}s ({deviation_percent:.1f}%)")
        print(
            f"Scenes: {len(scenes)} (avg {total_seconds / len(scenes):.1f}s per scene)"
        )

        if abs(deviation_percent) > 15:
            print(
                f"Warning: Duration deviation is {deviation_percent:.1f}% (target: ±10%)"
            )
            if deviation > 0:
                print(f"Consider: Reducing scene count or shorter narration")
            else:
                print(f"Consider: Increasing scene count or longer narration")

        return VideoBlueprint(
            video_id=video_id,
            topic=topic,
            language=language,
            duration_mode=duration_mode,
            fps=30,
            total_duration_frames=total_frames,
            scenes=scenes,
        )

    async def _generate_script(
        self, topic: str, language: str, duration_mode: str
    ) -> GeneratedScript:
        TARGET_DURATIONS = {
            "short": 60,
            "medium": 120,
            "long": 180,
        }

        target_scenes = SCENE_COUNTS.get(duration_mode, 10)
        target_total_seconds = TARGET_DURATIONS.get(duration_mode, 60)

        target_duration_per_scene = target_total_seconds / target_scenes

        print(
            f"Target: {duration_mode} = {target_total_seconds}s ({target_scenes} scenes × {target_duration_per_scene:.1f}s each)"
        )

        research_context = ""
        research_agent = self._get_research_service()

        if research_agent:
            try:
                print(f"🔍 Researching facts: {topic}")
                research = await research_agent.research(topic, context="video")
                research_context = f"""

VERIFIED RESEARCH FACTS (use these in your script):
{chr(10).join("- " + fact for fact in research.key_facts[:5])}

Ensure your narration includes accurate, verified information from the research above."""
                print(f"Research complete - {len(research.key_facts)} facts found")
            except Exception as e:
                print(f"Research failed, continuing without: {str(e)}")

        lang_instruction = get_language_instruction(language)

        prompt = get_script_prompt(
            topic=topic,
            language=language,
            duration_mode=duration_mode,
            target_scenes=target_scenes,
            target_duration_per_scene=target_duration_per_scene,
            research_context=research_context,
            lang_instruction=lang_instruction,
        )

        response = self.gemini_model.generate_content(prompt)

        clean_text = response.text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        data = json.loads(clean_text)
        return GeneratedScript(**data)


    async def _upload_to_gcs(
        self, data: bytes, blob_name: str, content_type: str
    ) -> str:
        bucket = self.storage_client.bucket(settings.gcp_bucket_name)
        blob = bucket.blob(blob_name)

        def _upload():
            blob.upload_from_string(data, content_type=content_type)
            return blob.public_url

        return await asyncio.to_thread(_upload)


_video_agent_instance: Optional[VideoAgent] = None


def get_video_agent() -> VideoAgent:
    global _video_agent_instance
    if _video_agent_instance is None:
        _video_agent_instance = VideoAgent()
    return _video_agent_instance
