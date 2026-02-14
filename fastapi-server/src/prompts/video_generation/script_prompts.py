"""
Video Generation Prompts - Script generation prompt templates

Contains prompts for Gemini to generate video scripts.
"""


def get_script_prompt(
    topic: str,
    language: str,
    duration_mode: str,
    target_scenes: int,
    target_duration_per_scene: float,
    research_context: str = "",
    lang_instruction: str = "",
) -> str:
    """
    Generate script creation prompt for Gemini.

    Args:
        topic: The video topic
        language: Target language for narration
        duration_mode: short/medium/long
        target_scenes: Number of scenes to generate
        target_duration_per_scene: Target seconds per scene (precise timing)
        research_context: Optional research facts to include
        lang_instruction: Language-specific instructions

    Returns:
        Complete prompt string for Gemini
    """
    # Calculate target word count based on speaking rate
    # English: ~3.5 words/second, Hindi/Indian: ~3 words/second
    words_per_second = 3.5 if language.startswith("English") else 3.0
    target_words_per_scene = int(target_duration_per_scene * words_per_second)

    # Add a small buffer (10%) for natural speech
    target_words_per_scene = int(target_words_per_scene * 1.1)

    # Limit to reasonable range
    target_words_per_scene = max(8, min(25, target_words_per_scene))

    return f"""You are an expert video producer creating educational content.

Topic: "{topic}"
Target Length: {duration_mode} ({target_scenes} scenes, exactly {int(target_scenes * target_duration_per_scene)} seconds)
{research_context}

LANGUAGE INSTRUCTIONS:
{lang_instruction}

STRICT RULES:
1. Generate exactly {target_scenes} scenes.
2. Each scene's "text" must be EXACTLY {target_words_per_scene} words (±2 words tolerance).
3. Each scene must take approximately {target_duration_per_scene:.1f} seconds when spoken.
4. Keep narration conversational and engaging for TTS.
5. "visual_prompt" must ALWAYS be in English (for image generation).
6. Visual prompts should be detailed: include style, lighting, composition.

Return ONLY valid JSON in this exact format:
{{
  "scenes": [
    {{"text": "Narration in {language}...", "visual_prompt": "Detailed English prompt..."}},
    ...
  ]
}}"""


def get_language_instruction(language: str) -> str:
    """
    Get language-specific instruction for script generation.

    Args:
        language: Language name (e.g., "Hindi", "Tamil")

    Returns:
        Instruction string for that language
    """
    indian_languages = [
        "Hindi",
        "Bengali",
        "Tamil",
        "Telugu",
        "Marathi",
        "Kannada",
        "Gujarati",
        "Malayalam",
        "Punjabi",
        "Urdu",
    ]

    if language in indian_languages:
        return f"Write the narration text in {language} using the native script (Devanagari, Tamil script, etc.)."
    elif language == "Hinglish":
        return "Write the narration in Hinglish (Hindi mixed with English technical terms like 'video', 'internet', 'subscribe')."
    elif language == "English (India)":
        return "Write in English suitable for an Indian audience."
    else:
        return "Write in clear, simple English."


# Scene count mapping by duration mode
# Increased by 20% to account for word count variability and natural speech pacing
# This allows more precise timing control
SCENE_COUNTS = {
    "short": 12,  # ~5 seconds per scene = 60 seconds total
    "medium": 24,  # ~5 seconds per scene = 120 seconds total
    "long": 36,  # ~5 seconds per scene = 180 seconds total
}

# Target durations in seconds
TARGET_DURATIONS = {"short": 60, "medium": 120, "long": 180}
