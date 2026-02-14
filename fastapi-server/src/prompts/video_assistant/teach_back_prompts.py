"""Enhanced Teach Back Prompts with Bloom's Taxonomy and Socratic Dialogue"""

TEACH_BACK_EXTRACT_CONCEPTS_PROMPT = """Analyze this video transcript and extract KEY CONCEPTS that a student should understand.

Video Title: {video_title}

Transcript (time range: {time_range} - {end_time_range}):
{full_text}

Return ONLY a JSON array of concept strings like: ["concept 1", "concept 2", ...]

Requirements:
- Extract 5-8 most important concepts
- Focus on main ideas, principles, and technical terms
- Include relationships between concepts
- Note important facts or processes
- Order by importance (most important first)
- Keep concepts specific and actionable

Example: ["Neural Networks", "Backpropagation", "Gradient Descent", "Activation Functions", "Loss Functions", "Overfitting"]"""


TEACH_BACK_INITIAL_CONCEPT_PROMPT = """I found {num_concepts} key concepts in this section. Let's learn them one by one.

📚 **Concept {current_num}/{total_concepts}: {concept_name}

Can you explain what this concept means in your own words?

💡 Don't worry about being perfect - just explain your understanding. I'll help you identify any gaps!"""


TEACH_BACK_INITIAL_PROMPT = """Explain what you learned from **{time_range}** of this video.

Don't worry about being perfect - just explain in your own words what key ideas were. I'll help you identify any gaps!

You can talk about:
- Main concepts or ideas
- How things connect
- Examples you noticed
- Things you found confusing
"""

TEACH_BACK_EVALUATION_PROMPT = """You are a Socratic tutor evaluating a student's understanding of a specific concept.

VIDEO CONTENT:
Title: {video_title}
Time range: {time_range} - {end_time_range}

Transcript excerpt for this concept:
{transcript_excerpt}

STUDENT'S EXPLANATION:
{user_explanation}

CONCEPT BEING EVALUATED:
{concept_name}

BLOOM'S TAXONOMY LEVEL: {bloom_level}

BLOOM'S TAXONOMY LEVEL: {bloom_level}

---

CRITICAL INSTRUCTION:
First, check if the STUDENT'S EXPLANATION is relevant, coherent, and actually attempts to explain the concept.
- If the explanation says "I don't know" or asks for help -> RETURN SCORE 0 but provide encouraging feedback.

EVALUATION CRITERIA:

1. **UNDERSTANDING LEVEL** (string):
   - "none" - No understanding demonstrated
   - "partial" - Some correct ideas but missing key aspects
   - "full" - Complete understanding shown

2. **RECALL SCORE** (0-100):
   Did they mention the definition or core idea?

3. **EXPLANATION SCORE** (0-100):
   Did they explain it in their own words with accuracy?

4. **APPLICATION SCORE** (0-100):
   {application_criteria}

5. **OVERALL SCORE** (0-100):
   Weighted average: Recall(30%) + Explanation(40%) + Application(30%)

6. **IDENTIFIED GAPS** (array of strings):
   What key aspects are missing or incorrect?

7. **SUGGESTED CLARIFICATIONS** (array of strings):
   What would help them understand better?

8. **STRENGTHS** (array of strings):
   What did they do well?

9. **FOLLOW-UP QUESTION** (string):
   Thought-provoking question to deepen understanding based on gaps and strengths.
   Make it specific to this concept, not generic.

10. **ENCOURAGEMENT** (string):
   Positive, encouraging feedback based on their performance level.

SCORING GUIDELINES:
- 90-100: Excellent - Ready to move on
- 75-89: Good - Minor gaps, one more question
- 50-74: Needs Work - Gaps in understanding, scaffold
- 0-49: Review Needed - Start with basics, provide examples

EXAMPLES FOR DIFFERENT BLOOM LEVELS:

If BLOOM_LEVEL = "remember":
   Application criteria: Can they identify examples or basic facts?

If BLOOM_LEVEL = "understand":
   Application criteria: Can they explain meaning or give simple examples?

If BLOOM_LEVEL = "apply":
   Application criteria: Can they use the concept in a new scenario?

If BLOOM_LEVEL = "analyze":
   Application criteria: Can they compare or break down components?

If BLOOM_LEVEL = "evaluate":
   Application criteria: Can they judge or assess using criteria?

If BLOOM_LEVEL = "create":
   Application criteria: Can they design or build something using the concept?

Return your evaluation as JSON following this structure:
{{
  "understanding_level": "partial/full/none",
  "recall_score": 85,
  "explanation_score": 70,
  "application_score": 80,
  "overall_score": 78,
  "identified_gaps": ["missing aspect 1", "missing aspect 2"],
  "suggested_clarifications": ["would help to...", "try explaining..."],
  "strengths": ["good on X", "mentioned Y correctly"],
  "follow_up_question": "What would happen if...",
  "encouragement": "Great start! You're getting there..."
}}"""


BLOOM_QUESTION_TEMPLATES = {
    "remember": {
        "low": "What is the definition of {concept}?",
        "medium": "Can you list the key components of {concept}?",
        "high": "What are the main characteristics of {concept}?",
    },
    "understand": {
        "low": "Can you explain {concept} in your own words?",
        "medium": "How would you describe {concept} to someone who hasn't heard of it?",
        "high": "What's the difference between {concept} and {related_concept}?",
    },
    "apply": {
        "low": "Can you give me an example of {concept}?",
        "medium": "How would you use {concept} to solve {scenario}?",
        "high": "Given this situation: {scenario}, how does {concept} apply?",
    },
    "analyze": {
        "low": "What are the key parts of {concept}?",
        "medium": "How does {concept} compare to {alternative}?",
        "high": "What's the relationship between {concept} and {related_concept}?",
    },
    "evaluate": {
        "low": "Why is {concept} important?",
        "medium": "What are the pros and cons of {concept}?",
        "high": "In this context, why is {concept} better than {alternative}?",
    },
    "create": {
        "low": "Design a simple example using {concept}",
        "medium": "How would you modify {concept} to solve {problem}?",
        "high": "Create a plan to implement {concept} for {goal}",
    },
}


ADAPTIVE_FEEDBACK_PROMPTS = {
    "low_mastery": """🔄 Let's break this down into smaller pieces.

The concept of {concept} has these parts:
{concept_breakdown}

Try explaining each part one at a time. Start with {part_1}.

Remember: It's okay to focus on just understanding one aspect well!""",
    "medium_mastery": """📊 Good attempt! You're on the right track.

✅ You correctly understood: {correct_points}
⚠️ Let's clarify: {clarification_points}

Think about it this way:
{simplified_explanation}

Can you try explaining it again with this in mind?""",
    "high_mastery": """⭐ Excellent! You've got the core idea down.

🎯 Now let's test deeper understanding:
{challenging_question}

This will help you see if you can {advanced_goal}.""",
    "complete_mastery": """🎉 Fantastic! You've mastered {concept}!

✅ What you demonstrated:
  • Clear explanation
  • Understanding of key points
  • Ability to connect ideas

Ready to move to the next concept? Or would you like to:
  • Try a more challenging question?
  • See how this connects to other concepts?
  • Review what we've covered?""",
}


SCAFFOLDING_HINTS = {
    "definition": "💡 Hint: Think about what makes {concept} unique or special",
    "components": "🧩 Hint: What are the building blocks that make up {concept}?",
    "purpose": "🎯 Hint: What problem does {concept} solve?",
    "example": "📝 Hint: Can you think of a real-world situation where {concept} is used?",
    "comparison": "⚖️ Hint: How is {concept} similar to or different from something you already know?",
}
