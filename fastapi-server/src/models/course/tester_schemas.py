from typing import List, Any
from pydantic import BaseModel, Field, model_validator


class MCQOptionSchema(BaseModel):
    key: str = Field(..., description="Option key (a, b, c, or d)")
    text: str = Field(..., description="Option text")
    
    @model_validator(mode='before')
    @classmethod
    def repair_malformed_option(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if 'text' not in data:
                key_value = data.get('key', '')
                for letter in ['a', 'b', 'c', 'd']:
                    if letter in data and letter != 'key':
                        data['text'] = data.pop(letter)
                        break
                
                if 'text' not in data:
                    for k, v in list(data.items()):
                        if k != 'key' and isinstance(v, str):
                            data['text'] = v
                            break
        return data


class MCQQuestionSchema(BaseModel):
    question_text: str = Field(..., description="The question text")
    options: List[MCQOptionSchema] = Field(..., description="Four answer options")
    correct_answer: str = Field(..., description="Correct option key (a, b, c, or d)")
    explanation: str = Field(..., description="Why this is the correct answer")


class OpenTextQuestionSchema(BaseModel):
    question_text: str = Field(..., description="The question text")
    expected_answer: str = Field(..., description="Expected answer or key points")
    grading_criteria: str = Field(..., description="How to evaluate the answer")


class QuizQuestions(BaseModel):
    mcq_questions: List[MCQQuestionSchema] = Field(default_factory=list, description="Multiple choice questions")
    open_text_questions: List[OpenTextQuestionSchema] = Field(default_factory=list, description="Open text questions")
