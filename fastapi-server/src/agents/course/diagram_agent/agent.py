import os
import json
import logging
from typing import List, Dict, Any

from src.utils.llm import get_llm_service
from src.utils.code_checker import ESLintValidator, clean_up_response, find_react_code_in_response
from src.prompts.course import DIAGRAM_SYSTEM_PROMPT, DIAGRAM_USER_PROMPT

logger = logging.getLogger(__name__)


def extract_react_code_from_delimiters(response: str) -> str:
    import re

    response = re.sub(r'<thinking>[\s\S]*?</thinking>', '', response)
    response = re.sub(r'<think>[\s\S]*?</think>', '', response)

    delimiter_match = re.search(
        r'<REACT_CODE>([\s\S]*?)</REACT_CODE>',
        response,
        re.IGNORECASE
    )
    
    if delimiter_match:
        code = delimiter_match.group(1).strip()
        code = re.sub(r'^[^()]*\(', '(', code)
        return code

    return find_react_code_in_response(response)


class DiagramAgent:
    def __init__(self, iterations: int = 5):
        self.llm = get_llm_service(provider="groq", model="qwen/qwen3-32b")
        self.eslint = ESLintValidator()
        self.iterations = iterations
        self.plugin_docs = self._load_plugin_docs()

    def _load_plugin_docs(self) -> str:
        docs = []
        try:
            docs_dir = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "..", "..", "..", "utils", "code_checker", "plugin_docs"
            )
            docs_dir = os.path.normpath(docs_dir)

            if os.path.exists(docs_dir):
                for filename in sorted(os.listdir(docs_dir)):
                    if filename.endswith(".txt"):
                        with open(os.path.join(docs_dir, filename), "r", encoding="utf-8") as f:
                            docs.append(f.read())
            else:
                logger.warning(f"Plugin docs directory not found at {docs_dir}")

        except Exception as e:
            logger.error(f"Failed to load plugin docs: {e}")

        return "\n\n".join(docs)

    async def generate_diagram(
        self,
        title: str,
        description: str,
        data: Dict[str, Any] = None,
        context: str = None
    ) -> Dict[str, Any]:
        prompt = self._build_diagram_prompt(title, description, data, context)

        current_prompt = prompt
        validation_check = {"errors": []}

        for attempt in range(self.iterations):
            try:
                raw_code = await self.llm.generate(
                    prompt=current_prompt,
                    system_prompt=DIAGRAM_SYSTEM_PROMPT
                )
                extracted_code = extract_react_code_from_delimiters(raw_code)
                
                if not extracted_code:
                    logger.warning(f"Attempt {attempt+1}: No valid React code found in response")
                    validation_check = {'errors': [{'message': 'No valid React code found. Use <REACT_CODE> delimiters.'}]}
                else:
                    validation_result = self.eslint.validate_jsx(extracted_code)

                    if validation_result['valid']:
                        logger.info("Diagram Code Validation Passed")
                        return {
                            "success": True,
                            "diagram_code": extracted_code,
                            "validation_errors": [],
                            "attempt": attempt + 1
                        }
                    else:
                        validation_check = validation_result
                errors = validation_check['errors']
                error_msg = json.dumps(errors, indent=2)
                logger.warning(f"Attempt {attempt+1} failed validation: {error_msg}")

                current_prompt = f"""
You were prompted before, but the code did not pass validation.

Previous errors:
{error_msg}

Please try again. Remember to wrap your code EXACTLY like this:

<REACT_CODE>
() => {{
  // your fixed code here
}}
</REACT_CODE>

Nothing before <REACT_CODE>, nothing after </REACT_CODE>.
"""
            except Exception as e:
                logger.error(f"Error in generation attempt {attempt+1}: {e}")
                if attempt == self.iterations - 1:
                    return {
                        "success": False,
                        "diagram_code": "",
                        "validation_errors": [str(e)],
                        "attempt": attempt + 1
                    }

        error_msg = json.dumps(validation_check['errors'], indent=2)
        return {
            "success": False,
            "diagram_code": "",
            "validation_errors": [f"Failed to generate valid code after {self.iterations} attempts. Errors: \n{error_msg}"],
            "attempt": self.iterations
        }

    def _build_diagram_prompt(self, title: str, description: str, data: Dict[str, Any], context: str = None) -> str:
        context_parts = []
        
        if data:
            if data.get("course_title"):
                context_parts.append(f"**COURSE:** {data['course_title']}")
            if data.get("chapter_title"):
                context_parts.append(f"**CHAPTER:** {data['chapter_title']}")
            if data.get("section_content"):
                section_text = data["section_content"][:1500]
                context_parts.append(f"**SECTION CONTENT:**\n{section_text}")
        
        if context:
            context_parts.append(f"**ADDITIONAL CONTEXT:**\n{context[:500]}")
        
        context_section = "\n\n".join(context_parts) if context_parts else "No specific context provided."

        prompt = DIAGRAM_USER_PROMPT.format(
            title=title,
            description=description,
            plugin_docs=self.plugin_docs,
            context_section=context_section
        )

        return prompt

    def _get_system_prompt(self) -> str:
        return DIAGRAM_SYSTEM_PROMPT


_diagram_agent = None


def get_diagram_agent(iterations: int = 5) -> DiagramAgent:
    global _diagram_agent
    if _diagram_agent is None:
        _diagram_agent = DiagramAgent(iterations=iterations)
    return _diagram_agent