import logging
from datetime import datetime
from typing import Optional, Tuple

from bson import ObjectId

from src.db.mongodb import MongoDB, QUESTIONS_COLLECTION
from src.utils.pdf import get_document_ai_service
from src.utils.video_transcription import get_video_intelligence_service
from src.agents.course.graph_expansion import get_graph_expansion_agent
from src.agents.course.content_writer import get_content_writer_agent
from src.agents.course.diagram_agent import get_diagram_agent
from src.agents.course.tester import get_tester_agent
from src.models.course import MaterialUploadResponse, GraphExpansionPlan

logger = logging.getLogger(__name__)


class MaterialService:
    async def extract_content_from_file(
        self,
        filename: str,
        content: bytes
    ) -> Tuple[Optional[str], Optional[str]]:
        filename = filename.lower()
        
        if filename.endswith(".pdf"):
            doc_service = get_document_ai_service()
            extracted_text = await doc_service.extract_text_from_pdf(content)
            
            if not extracted_text:
                return None, "Failed to extract text from PDF. Ensure the file is valid."
            return extracted_text, None
            
        elif filename.endswith((".mp4", ".mov", ".avi", ".webm")):
            video_service = get_video_intelligence_service()
            extracted_text = await video_service.transcribe_video(content)
            
            if not extracted_text:
                return None, "Failed to transcribe video. Ensure the file contains speech."
            return extracted_text, None
        else:
            return None, "Unsupported file type. Use PDF or video (MP4, MOV, AVI, WEBM)."
    
    async def get_expansion_plan(
        self,
        course_id: str,
        extracted_text: str
    ) -> Tuple[Optional[GraphExpansionPlan], Optional[dict]]:
        courses = MongoDB.courses()
        
        try:
            course = await courses.find_one({"_id": ObjectId(course_id)})
        except Exception:
            return None, None
        
        if not course:
            return None, None
        
        expansion_agent = get_graph_expansion_agent()
        
        expansion_plan = await expansion_agent.analyze_material(
            material_content=extracted_text,
            course_title=course.get("title", ""),
            existing_nodes=course.get("nodes", []),
            existing_edges=course.get("edges", [])
        )
        
        return expansion_plan, course
    
    async def apply_expansion(
        self,
        course_id: str,
        expansion_plan: GraphExpansionPlan,
        course: dict,
        extracted_text: str
    ) -> MaterialUploadResponse:
        courses = MongoDB.courses()
        chapters_col = MongoDB.chapters()
        
        existing_nodes = course.get("nodes", [])
        existing_edges = course.get("edges", [])

        new_nodes = []
        course_language = course.get("language", "en")
        translator = None
        if course_language and course_language != "en":
            from src.utils.translation import get_translation_service
            translator = get_translation_service()
        
        for topic in expansion_plan.new_topics:
            status = "locked" if topic.connects_to else "unlocked"
            
            node_title = topic.title
            node_summary = topic.summary
            if translator:
                node_title = await translator.translate(topic.title, course_language)
                node_summary = await translator.translate(topic.summary, course_language)

            new_nodes.append({
                "id": topic.id,
                "title": node_title,
                "summary": node_summary,
                "learning_objectives": topic.learning_objectives,
                "time_minutes": topic.time_minutes,
                "status": status
            })
        
        new_edges = []
        for edge in expansion_plan.new_edges:
            new_edges.append({
                "source": edge.source,
                "target": edge.target
            })

        for topic in expansion_plan.new_topics:
            for source_id in topic.connects_to:
                edge_exists = any(
                    e["source"] == source_id and e["target"] == topic.id
                    for e in new_edges
                )
                if not edge_exists:
                    new_edges.append({
                        "source": source_id,
                        "target": topic.id
                    })

        updated_nodes = existing_nodes + new_nodes
        updated_edges = existing_edges + new_edges
        
        await courses.update_one(
            {"_id": ObjectId(course_id)},
            {
                "$set": {
                    "nodes": updated_nodes,
                    "edges": updated_edges,
                    "chapter_count": len(updated_nodes),
                    "updated_at": datetime.utcnow()
                }
            }
        )
 
        content_writer = get_content_writer_agent()
        course_language = course.get("language", "en")

        for i, topic in enumerate(expansion_plan.new_topics):
            content_result = await content_writer.generate_content(
                title=topic.title,
                summary=topic.summary,
                learning_objectives=topic.learning_objectives,
                difficulty=course.get("difficulty", "intermediate"),
                time_minutes=topic.time_minutes,
                context=extracted_text[:2000]
            )

            sections = [section.model_dump() for section in content_result.sections]
            key_takeaways = content_result.key_takeaways
            
            # Translate content if course language is not English
            if course_language and course_language != "en":
                from src.utils.translation import get_translation_service
                translator = get_translation_service()
                
                for section in sections:
                    if section.get("title"):
                        section["title"] = await translator.translate(section["title"], course_language)
                    if section.get("paragraphs"):
                        section["paragraphs"] = await translator.translate_batch(section["paragraphs"], course_language)
                    if section.get("bullets"):
                        section["bullets"] = await translator.translate_batch(section["bullets"], course_language)
                    if section.get("tip"):
                        section["tip"] = await translator.translate(section["tip"], course_language)
                
                key_takeaways = await translator.translate_batch(key_takeaways, course_language)
            
            image_prompts = content_result.image_prompts
            chapter_images = []
            if image_prompts:
                try:
                    from src.utils.image_gen import get_image_gen_service
                    from google.cloud import storage
                    import base64

                    image_service = get_image_gen_service()

                    if image_service.is_available():
                        from src.config.settings import settings
                        storage_client = storage.Client() if settings.gcp_bucket_name else None

                        for j, prompt in enumerate(image_prompts[:3]):  # Max 3 images per chapter
                            try:
                                image_bytes = await image_service.generate_image(prompt, style="educational")

                                image_url = ""
                                if storage_client and settings.gcp_bucket_name:
                                    bucket = storage_client.bucket(settings.gcp_bucket_name)
                                    blob_name = f"chapters/{course_id}/{len(existing_nodes) + i}_{j}.png"
                                    blob = bucket.blob(blob_name)
                                    blob.upload_from_string(image_bytes, content_type="image/png")
                                    image_url = blob.public_url
                                    chapter_images.append(image_url)
                                else:
                                    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                                    image_url = f"data:image/png;base64,{image_b64}"
                                    chapter_images.append(image_url)

                            except Exception as img_err:
                                logger.warning(f"  Image generation failed for {topic.title}: {img_err}")

                except Exception as e:
                    logger.warning(f"Image service error for {topic.title}: {e}")

            processed_sections = []
            diagram_agent = get_diagram_agent()

            for section in sections:
                text_content = " ".join(section.get("paragraphs", [])) + " " + section.get("title", "")
                text_content_lower = text_content.lower()

                if any(keyword in text_content_lower for keyword in [
                    "process", "workflow", "algorithm", "steps", "procedure",
                    "sequence", "flow", "cycle", "steps to", "how to", "method"
                ]):
                    try:
                        diagram_result = await diagram_agent.generate_diagram(
                            title=f"{section.get('title', 'Diagram')} for {topic.title}",
                            description=f"Process flow for: {text_content[:200]}...",
                            data={
                                "course_title": course.get("title", ""),
                                "chapter_title": topic.title,
                                "section_content": text_content
                            },
                            context=extracted_text[:2000]
                        )

                        if diagram_result.get("success", False):
                            section["diagram_code"] = diagram_result["diagram_code"]
                    except Exception as e:
                        logger.warning(f"Failed to generate diagram for section {section.get('title', 'Untitled')}: {str(e)}")

                elif any(keyword in text_content_lower for keyword in [
                    "compare", "comparison", "vs", "versus", "difference",
                    "statistics", "data", "numbers", "metrics", "performance"
                ]):
                    try:
                        diagram_result = await diagram_agent.generate_diagram(
                            title=f"{section.get('title', 'Diagram')} for {topic.title}",
                            description=f"Comparison chart for: {text_content[:200]}...",
                            data={
                                "course_title": course.get("title", ""),
                                "chapter_title": topic.title,
                                "section_content": text_content
                            },
                            context=extracted_text[:2000]
                        )

                        if diagram_result.get("success", False):
                            section["diagram_code"] = diagram_result["diagram_code"]
                    except Exception as e:
                        logger.warning(f"Failed to generate diagram for section {section.get('title', 'Untitled')}: {str(e)}")

                elif any(keyword in text_content_lower for keyword in [
                    "structure", "architecture", "components", "parts",
                    "organization", "hierarchy", "system", "model"
                ]):
                    try:
                        diagram_result = await diagram_agent.generate_diagram(
                            title=f"{section.get('title', 'Diagram')} for {topic.title}",
                            description=f"Structure diagram for: {text_content[:200]}...",
                            data={
                                "course_title": course.get("title", ""),
                                "chapter_title": topic.title,
                                "section_content": text_content
                            },
                            context=extracted_text[:2000]
                        )

                        if diagram_result.get("success", False):
                            section["diagram_code"] = diagram_result["diagram_code"]
                    except Exception as e:
                        logger.warning(f"Failed to generate diagram for section {section.get('title', 'Untitled')}: {str(e)}")

                img_idx = section.get("image_index")
                if img_idx and 1 <= img_idx <= len(chapter_images):
                    section["image_url"] = chapter_images[img_idx - 1]
                else:
                    section["image_url"] = None

                processed_sections.append(section)

            # Translate topic title and summary for chapter doc
            chapter_title = topic.title
            chapter_summary = topic.summary
            if course_language and course_language != "en":
                from src.utils.translation import get_translation_service
                translator = get_translation_service()
                chapter_title = await translator.translate(topic.title, course_language)
                chapter_summary = await translator.translate(topic.summary, course_language)

            chapter_doc = {
                "course_id": course_id,
                "node_id": topic.id,
                "index": len(existing_nodes) + i,
                "title": chapter_title,
                "summary": chapter_summary,
                "sections": processed_sections,
                "images": chapter_images,
                "image_url": chapter_images[0] if chapter_images else None,
                "time_minutes": topic.time_minutes,
                "is_completed": False,
                "created_at": datetime.utcnow(),
            }

            result = await chapters_col.insert_one(chapter_doc)
            chapter_id = str(result.inserted_id)

            # Generate quiz questions for this chapter
            try:
                tester = get_tester_agent()
                chapter_content = ""
                for section in processed_sections:
                    chapter_content += f"## {section.get('title', '')}\n\n"
                    for p in section.get('paragraphs', []):
                        chapter_content += f"{p}\n\n"
                    for b in section.get('bullets', []):
                        chapter_content += f"- {b}\n"
                    if section.get('tip'):
                        chapter_content += f"> Tip: {section['tip']}\n\n"

                quiz_result = await tester.generate_questions(
                    title=topic.title,
                    summary=topic.summary,
                    content=chapter_content,
                    num_mcq=3,
                    num_open_text=2
                )

                if quiz_result:
                    questions_col = MongoDB.get_collection(QUESTIONS_COLLECTION)
                    mcq_count = 0
                    ot_count = 0
                    
                    if quiz_result.mcq_questions:
                        for mcq in quiz_result.mcq_questions:
                            question_doc = {
                                "chapter_id": chapter_id,
                                "question_type": "mcq",
                                "question_text": mcq.question_text,
                                "options": [{"key": opt.key, "text": opt.text} for opt in mcq.options],
                                "correct_answer": mcq.correct_answer,
                                "explanation": mcq.explanation,
                                "created_at": datetime.utcnow(),
                            }
                            await questions_col.insert_one(question_doc)
                            mcq_count += 1

                    if quiz_result.open_text_questions:
                        for ot in quiz_result.open_text_questions:
                            question_doc = {
                                "chapter_id": chapter_id,
                                "question_type": "open_text",
                                "question_text": ot.question_text,
                                "expected_answer": ot.expected_answer,
                                "grading_criteria": ot.grading_criteria,
                                "created_at": datetime.utcnow(),
                            }
                            await questions_col.insert_one(question_doc)
                            ot_count += 1
                    
                    logger.info(f"Generated {mcq_count} MCQ + {ot_count} open-text questions for {topic.title}")
            except Exception as quiz_err:
                logger.warning(f"Quiz generation failed for {topic.title}: {quiz_err}")
        
        logger.info(f"Expanded course {course_id} with {len(new_nodes)} new nodes")
        
        return MaterialUploadResponse(
            success=True,
            message=f"Successfully added {len(new_nodes)} new topics to the course.",
            new_nodes_count=len(new_nodes),
            new_edges_count=len(new_edges),
            expansion_summary=expansion_plan.summary
        )
    
    async def get_youtube_transcript(self, youtube_url: str) -> Optional[str]:
        from src.utils.youtube import get_youtube_transcript_service
        
        youtube_service = get_youtube_transcript_service()
        return await youtube_service.get_transcript(youtube_url)

_material_service = None

def get_material_service() -> MaterialService:
    global _material_service
    if _material_service is None:
        _material_service = MaterialService()
    return _material_service
