CONTENT_WRITER_SYSTEM_PROMPT = """You are an expert educational content writer. Your task is to create engaging, comprehensive learning materials in a structured JSON format.

Your content should be:
- Clear and well-structured with distinct sections
- Educational and informative
- Engaging with examples and analogies
- Accessible to the target difficulty level
- Rich with explanations, not just bullet points

You must output valid JSON matching the required schema exactly."""


CONTENT_WRITER_USER_PROMPT = """Write a COMPREHENSIVE and DETAILED educational chapter as structured JSON.

**Title:** {title}
**Summary:** {summary}
**Difficulty:** {difficulty}
**Time Estimate:** {time_minutes} minutes

**Learning Objectives:**
{objectives}

{context_section}

## Instructions

Create a full chapter for a high-quality interactive course. **Write extensive, deep, and engaging content.**

## Required Structure

Output JSON with this exact structure:

{{
  "sections": [
    {{
      "section_type": "introduction",
      "title": "Introduction",
      "paragraphs": [
        "Start with a compelling hook - a fact, story, or question.",
        "Explain why this topic matters in the real world.",
        "Briefly outline what will be covered."
      ],
      "bullets": null,
      "tip": null,
      "image_index": null,
      "diagram_index": null
    }},
    {{
      "section_type": "concept",
      "title": "[Learning Objective 1 Name]",
      "paragraphs": [
        "Detailed step-by-step explanation of the concept.",
        "Use a relatable analogy: Think of it like...",
        "Go into technical details appropriate for the difficulty level."
      ],
      "bullets": ["Key point 1", "Key point 2", "Key point 3"],
      "tip": "Pro tip or important note (optional)",
      "image_index": 1,
      "diagram_index": 1
    }},
    {{
      "section_type": "concept",
      "title": "[Learning Objective 2 Name]",
      "paragraphs": ["..."],
      "bullets": null,
      "tip": null,
      "image_index": 2,
      "diagram_index": null
    }},
    {{
      "section_type": "case_study",
      "title": "Real-World Applications",
      "paragraphs": [
        "Provide at least 2 concrete, detailed examples or case studies.",
        "Explain how this is used in industry/research today."
      ],
      "bullets": null,
      "tip": null,
      "image_index": null,
      "diagram_index": null
    }},
    {{
      "section_type": "summary",
      "title": "Key Takeaways",
      "paragraphs": [
        "Summarize the main points.",
        "What should the learner remember forever?"
      ],
      "bullets": null,
      "tip": null,
      "image_index": null,
      "diagram_index": null
    }}
  ],
  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"],
  "image_prompts": [
    "A detailed diagram showing [concept 1]...",
    "An infographic illustrating [concept 2]..."
  ]
}}

## Rules

1. Create a "concept" section for EACH learning objective listed above.

2. **Images** (`image_index`): Assign `image_index` (1 or 2) to sections that would benefit from a static educational image.
   - Add corresponding descriptions to `image_prompts` array.

3. **Interactive Diagrams** (`diagram_index`) - **REQUIRED**:
   - **You MUST set `diagram_index: 1` on exactly ONE section per chapter.**
   - This triggers generation of an interactive React visualization.
   - Choose the concept section that would benefit MOST from interactivity.
   - A section CAN have BOTH `image_index` AND `diagram_index` if both make sense.

4. Each paragraph should be 2-4 sentences of rich content.
5. Use "bullets" for lists of key points or steps.
6. Use "tip" for pro tips, warnings, or important notes.
7. Provide 2 image_prompts that describe educational visuals matching the concepts."""
