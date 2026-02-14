VIDEO_SUMMARY_PROMPT = """Analyze this video transcript and provide a comprehensive, detailed summary.

Video Title: {title}

Transcript:
{transcript}

Provide:
1. A detailed summary (4-5 paragraphs covering all major concepts, examples, and explanations from the video)
2. 8-12 key points as bullet points (each point should be a complete, informative sentence)
3. Main topics covered (5-8 topics with brief descriptions)

Be thorough, educational, and ensure no important information is missed. Include specific examples, formulas, steps, or methods mentioned in the video."""


QA_PROMPT = """Answer this question about the video based on the transcript excerpts.

Video: {video_title}
Question: {question}

Relevant Transcript Excerpts:
{context_text}

Instructions:
1. Answer the question directly and clearly
2. Reference specific parts of the video when relevant
3. If the transcript doesn't contain the answer, say so
4. Rate your confidence: high (directly answered), medium (inferred), low (not enough info)
"""

TIME_AWARE_QA_PROMPT = """At {time_str} in the video, the student asks: {question}

Video: {video_title}

Relevant Transcript Excerpts:
{context_text}

Instructions:
1. Answer the question directly and clearly
2. Reference specific parts of the video when relevant
3. If the transcript doesn't contain the answer, say so
4. Rate your confidence: high (directly answered), medium (inferred), low (not enough info)
"""

CHAPTER_GENERATION_PROMPT = """Analyze this video transcript and generate chapter markers.

Video Title: {video_title}

Transcript Sections:
{chunk_text}

Generate {target_chapters} chapters with:
1. A clear, descriptive title
2. The start timestamp (use the section timestamps)
3. A one-sentence summary

Make chapter titles specific and informative (not just "Part 1", "Part 2")."""


NOTE_CREATION_PROMPT = """Create comprehensive study notes from this video content.

Video: {video_title}
Question/Topic: {question}

Relevant Transcript Excerpts:
{context_text}

Instructions:
1. Provide a thorough, detailed response (3-5 paragraphs)
2. Include ALL relevant information - concepts, formulas, examples, steps, and explanations
3. Use bullet points or numbered lists for processes and steps
4. Reference specific timestamps when relevant
5. If explaining a formula or calculation, show it clearly
6. Rate your confidence: high (directly in transcript), medium (inferred), low (not enough info)

Make these notes comprehensive enough to serve as study material."""


TIME_AWARE_KEYWORDS = [
    "just now", "just said", "just explained", "just mentioned",
    "right now", "this part", "this section", "what he said",
    "what she said", "what they said", "this concept", "this topic",
    "what is this", "explain this", "clarify this", "what was that",
    "didn't understand", "confused about this", "repeat that"
]
