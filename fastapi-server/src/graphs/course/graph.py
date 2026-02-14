from datetime import datetime
from typing import Literal
from bson import ObjectId
import re

from langgraph.graph import StateGraph, START, END

from src.graphs.course.state import CourseGenerationState, GeneratedChapter, CoursePlan, TopicNodePlan, TopicEdgePlan
from src.agents.course.planner import get_planner_agent
from src.agents.course.tester import get_tester_agent
from src.utils.translation import get_translation_service
from src.utils.vector import get_vector_service
from src.db.mongodb import MongoDB, COURSES_COLLECTION, CHAPTERS_COLLECTION, QUESTIONS_COLLECTION


async def plan_course_node(state: CourseGenerationState) -> dict:
    planner = get_planner_agent()
    vector_service = get_vector_service()

    context = state.get("context")
    if not context and state.get("course_id"):
        context = await vector_service.get_context_for_topic(
            topic=state["topic"],
            course_id=state.get("course_id", "temp")
        )

    research_context = ""
    try:
        from src.utils.research import get_research_service
        research_agent = get_research_service()
        print(f"🔍 Researching course topic: {state['topic']}")
        research = await research_agent.research(state["topic"], context="course")
        research_context = f"""

WEB RESEARCH FINDINGS:
{research.summary}

Key Topics to Cover:
{chr(10).join('- ' + fact for fact in research.key_facts[:5])}

Current Trends:
{chr(10).join('- ' + trend for trend in research.current_trends[:3])}

Use this research to ensure the course covers current, relevant content."""
        print(f"Research complete - {len(research.resources)} resources found")
    except ValueError:
        pass
    except Exception as e:
        print(f"Research failed, continuing without: {str(e)}")

    combined_context = context or ""
    if research_context:
        combined_context = f"{context}\n{research_context}" if context else research_context

    plan = await planner.plan_course(
        topic=state["topic"],
        time_hours=state["time_hours"],
        difficulty=state["difficulty"],
        context=combined_context
    )

    course_plan = CoursePlan(
        title=plan.title,
        description=plan.description,
        root_node_id=plan.root_node_id,
        nodes=[
            TopicNodePlan(
                id=node.id,
                title=node.title,
                summary=node.summary,
                learning_objectives=node.learning_objectives,
                time_minutes=node.time_minutes
            )
            for node in plan.nodes
        ],
        edges=[
            TopicEdgePlan(source=edge.source, target=edge.target)
            for edge in plan.edges
        ],
        total_time_hours=plan.total_time_hours
    )
    
    return {
        "course_plan": course_plan,
        "status": "planning_complete",
        "context": combined_context
    }


async def save_course_metadata_node(state: CourseGenerationState) -> dict:
    courses = MongoDB.get_collection(COURSES_COLLECTION)
    translator = get_translation_service()
    
    plan = state["course_plan"]
    language = state.get("language", "en")

    title = plan.title
    description = plan.description
    
    if language != "en":
        title = await translator.translate(title, language)
        description = await translator.translate(description, language)

    nodes_data = []
    for node in plan.nodes:
        node_title = node.title
        node_summary = node.summary
        if language != "en":
            node_title = await translator.translate(node.title, language)
            node_summary = await translator.translate(node.summary, language)
        nodes_data.append({
            "id": node.id,
            "title": node_title,
            "summary": node_summary,
            "learning_objectives": node.learning_objectives,
            "time_minutes": node.time_minutes,
            "status": "unlocked" if node.id == plan.root_node_id else "locked"
        })
    
    edges_data = [
        {"source": edge.source, "target": edge.target}
        for edge in plan.edges
    ]

    if state.get("course_id"):
        await courses.update_one(
            {"_id": ObjectId(state["course_id"])},
            {
                "$set": {
                    "title": title,
                    "description": description,
                    "chapter_count": len(plan.nodes),
                    "root_node_id": plan.root_node_id,
                    "nodes": nodes_data,
                    "edges": edges_data,
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        course_id = state["course_id"]
    else:
        result = await courses.insert_one({
            "topic": state["topic"],
            "title": title,
            "description": description,
            "time_hours": state["time_hours"],
            "difficulty": state["difficulty"],
            "language": language,
            "status": "creating",
            "chapter_count": len(plan.nodes),
            "root_node_id": plan.root_node_id,
            "nodes": nodes_data,
            "edges": edges_data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
        course_id = str(result.inserted_id)
    
    return {
        "course_id": course_id,
        "status": "metadata_saved"
    }


async def generate_chapter_node(state: CourseGenerationState) -> dict:
    from src.agents.course.content_writer import get_content_writer_agent
    from src.utils.image_gen import get_image_gen_service
    from google.cloud import storage
    import base64
    
    translator = get_translation_service()
    content_writer = get_content_writer_agent()
    tester = get_tester_agent()
    image_service = get_image_gen_service()
    chapters_col = MongoDB.get_collection(CHAPTERS_COLLECTION)
    questions_col = MongoDB.get_collection(QUESTIONS_COLLECTION)
    
    plan = state["course_plan"]
    idx = state.get("current_node_index", 0)
    if idx >= len(plan.nodes):
        return {"status": "all_nodes_processed"}
    node_plan = plan.nodes[idx]
    language = state.get("language", "en")
    course_id = state["course_id"]

    try:
        print(f"Generating content for chapter {idx + 1}: {node_plan.title}")
        content_result = await content_writer.generate_content(
            title=node_plan.title,
            summary=node_plan.summary,
            learning_objectives=node_plan.learning_objectives,
            difficulty=state.get("difficulty", "intermediate"),
            time_minutes=node_plan.time_minutes,
            context=state.get("context")
        )
        sections = [section.model_dump() for section in content_result.sections]
        key_takeaways = content_result.key_takeaways
        image_prompts = content_result.image_prompts
        print(f"Successfully generated {len(sections)} sections for: {node_plan.title}")
    except Exception as e:
        print(f"ContentWriterAgent failed for {node_plan.title}: {e}, using placeholder")
        sections = [
            {
                "section_type": "introduction",
                "title": "Introduction",
                "paragraphs": [node_plan.summary],
                "bullets": None,
                "tip": None,
                "image_index": None
            },
            {
                "section_type": "summary",
                "title": "Summary",
                "paragraphs": ["Review the learning objectives to ensure you've understood the material."],
                "bullets": None,
                "tip": None,
                "image_index": None
            }
        ]
        key_takeaways = node_plan.learning_objectives
        image_prompts = []

    chapter_images = []
    if image_service.is_available() and image_prompts:
        try:
            from src.config.settings import settings
            storage_client = storage.Client() if settings.gcp_bucket_name else None
            
            for i, prompt in enumerate(image_prompts[:3]):  
                try:
                    print(f"  Generating image {i+1} for {node_plan.title}...")
                    image_bytes = await image_service.generate_image(prompt, style="educational")
                    
                    image_url = ""
                    if storage_client and settings.gcp_bucket_name:
                        bucket = storage_client.bucket(settings.gcp_bucket_name)
                        blob_name = f"chapters/{course_id}/{idx}_{i}.png"
                        blob = bucket.blob(blob_name)
                        blob.upload_from_string(image_bytes, content_type="image/png")
                        image_url = blob.public_url
                        chapter_images.append(image_url)
                    else:
                        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
                        image_url = f"data:image/png;base64,{image_b64}"
                        chapter_images.append(image_url)
                        
                except Exception as img_err:
                    print(f"  Image generation failed: {img_err}")

        except Exception as e:
            print(f"Image service error: {e}")
    
    for section in sections:
        img_idx = section.get("image_index")
        if img_idx and 1 <= img_idx <= len(chapter_images):
            section["image_url"] = chapter_images[img_idx - 1]
        else:
            section["image_url"] = None


    title = node_plan.title
    summary = node_plan.summary
    
    if language != "en":
        print(f"  Translating content to {language}...")
        title = await translator.translate(title, language)
        summary = await translator.translate(summary, language)

        for section in sections:
            if section.get("title"):
                section["title"] = await translator.translate(section["title"], language)

            if section.get("paragraphs"):
                translated_paragraphs = []
                for paragraph in section["paragraphs"]:
                    translated_paragraphs.append(await translator.translate(paragraph, language))
                section["paragraphs"] = translated_paragraphs

            if section.get("bullets"):
                translated_bullets = []
                for bullet in section["bullets"]:
                    translated_bullets.append(await translator.translate(bullet, language))
                section["bullets"] = translated_bullets

            if section.get("tip"):
                section["tip"] = await translator.translate(section["tip"], language)
        
        translated_takeaways = []
        for takeaway in key_takeaways:
            translated_takeaways.append(await translator.translate(takeaway, language))
        key_takeaways = translated_takeaways
        
        print(f"  Translation complete for: {title}")
    
    chapter_doc = {
        "course_id": course_id,
        "node_id": node_plan.id,
        "index": idx,
        "title": title,
        "summary": summary,
        "sections": sections,  
        "images": chapter_images,
        "image_url": chapter_images[0] if chapter_images else None,
        "time_minutes": node_plan.time_minutes,
        "is_completed": False,
        "created_at": datetime.utcnow(),
    }
    
    result = await chapters_col.insert_one(chapter_doc)
    chapter_id = str(result.inserted_id)
    
    chapter_content = ""
    for section in sections:
        if section.get('title'):
            chapter_content += f"## {section['title']}\n\n"
        for p in section.get('paragraphs', []):
            chapter_content += f"{p}\n\n"
        if section.get('bullets'):
            for b in section['bullets']:
                chapter_content += f"- {b}\n"
            chapter_content += "\n"
        if section.get('tip'):
            chapter_content += f"> Tip: {section['tip']}\n\n"

    try:
        print(f"  Generating quiz questions for: {node_plan.title}")
        quiz_result = await tester.generate_questions(
            title=node_plan.title,
            summary=node_plan.summary,
            content=chapter_content,
            num_mcq=3,
            num_open_text=2
        )

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
        
        print(f"  Saved {len(quiz_result.mcq_questions)} MCQ + {len(quiz_result.open_text_questions)} open-text questions")
    except Exception as e:
        print(f"  Quiz generation failed for {node_plan.title}: {e}")

    chapter = GeneratedChapter(
        node_id=node_plan.id,
        index=idx,
        title=title,
        summary=summary,
        content=chapter_content,
        key_takeaways=key_takeaways
    )
    
    return {
        "chapters": [chapter],
        "current_node_index": idx + 1,
        "status": f"generated_node_{idx + 1}"
    }


async def generate_diagrams_node(state: CourseGenerationState) -> dict:
    from src.agents.course.diagram_agent import get_diagram_agent

    diagram_agent = get_diagram_agent()
    chapters_col = MongoDB.get_collection(CHAPTERS_COLLECTION)
    
    chapters_cursor = chapters_col.find({"course_id": state["course_id"]}).sort("index", 1)
    chapters = await chapters_cursor.to_list(length=100)
    
    if not chapters:
        return {"status": "no_chapters_for_diagrams"}
    
    total_diagrams = 0
    
    for chapter_doc in chapters:
        print(f"  Processing diagrams for chapter: {chapter_doc.get('title', 'Untitled')}")
        sections = chapter_doc.get("sections", [])
        chapter_diagrams = 0
        
        diagram_sections = [(i, s) for i, s in enumerate(sections) if s.get("diagram_index") is not None]
        
        if not diagram_sections:
            for i, s in enumerate(sections):
                if s.get("section_type") == "concept":
                    diagram_sections = [(i, s)]
                    print(f"    No diagram_index found, using first concept section: {s.get('title', 'Untitled')}")
                    break
        
        if not diagram_sections:
            print(f"    No suitable sections for diagrams in this chapter")
            continue

        for idx, section in diagram_sections:
            try:
                section_content = " ".join(section.get("paragraphs", [])) + " " + section.get("title", "")
                course_title = state.get("course_plan").title if state.get("course_plan") else state.get("topic", "")
                
                diagram_result = await diagram_agent.generate_diagram(
                    title=section.get('title', 'Diagram'),
                    description=section_content[:500],
                    data={
                        "course_title": course_title,
                        "chapter_title": chapter_doc.get("title", ""),
                        "section_content": section_content
                    },
                    context=state.get("context", "")
                )

                if diagram_result.get("success", False):
                    section["diagram_code"] = diagram_result["diagram_code"]
                    chapter_diagrams += 1
                    print(f"    Generated diagram for section: {section.get('title', 'Untitled')}")
                else:
                    print(f"    Diagram failed for: {section.get('title', 'Untitled')}, errors: {diagram_result.get('validation_errors', ['Unknown'])}")
            except Exception as e:
                print(f"    Diagram error for section {idx}: {e}")

        if chapter_diagrams > 0:
            await chapters_col.update_one(
                {"_id": chapter_doc["_id"]},
                {"$set": {"sections": sections}}
            )
            total_diagrams += chapter_diagrams

    return {"status": f"diagrams_processed_{total_diagrams}_across_{len(chapters)}_chapters"}


async def generate_questions_node(state: CourseGenerationState) -> dict:
    return {"status": "questions_complete"}


async def finalize_course_node(state: CourseGenerationState) -> dict:
    courses = MongoDB.get_collection(COURSES_COLLECTION)
    
    await courses.update_one(
        {"_id": ObjectId(state["course_id"])},
        {
            "$set": {
                "status": "ready",
                "updated_at": datetime.utcnow(),
            }
        }
    )
    
    return {"status": "complete"}


def should_continue_chapters(state: CourseGenerationState) -> Literal["generate_chapter", "generate_diagrams"]:

    plan = state.get("course_plan")
    if not plan:
        return "generate_diagrams"

    current_idx = state.get("current_node_index", 0)
    total_nodes = len(plan.nodes)

    if current_idx < total_nodes:
        return "generate_chapter"
    else:
        return "generate_diagrams"


def build_course_graph() -> StateGraph:
    graph = StateGraph(CourseGenerationState)

    graph.add_node("plan_course", plan_course_node)
    graph.add_node("save_metadata", save_course_metadata_node)
    graph.add_node("generate_chapter", generate_chapter_node)
    graph.add_node("generate_diagrams", generate_diagrams_node)
    graph.add_node("generate_questions", generate_questions_node)
    graph.add_node("finalize_course", finalize_course_node)

    graph.add_edge(START, "plan_course")
    graph.add_edge("plan_course", "save_metadata")
    graph.add_edge("save_metadata", "generate_chapter")

    graph.add_conditional_edges(
        "generate_chapter",
        should_continue_chapters,
        {
            "generate_chapter": "generate_chapter",
            "generate_diagrams": "generate_diagrams"
        }
    )

    graph.add_edge("generate_diagrams", "generate_questions")
    graph.add_edge("generate_questions", "finalize_course")
    graph.add_edge("finalize_course", END)
    
    return graph.compile()


course_graph = build_course_graph()



