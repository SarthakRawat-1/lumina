from typing import List, Union
from pydantic import BaseModel

from src.models.schemas import MCQQuestion, OpenTextQuestion


class QuestionsResponse(BaseModel):
    questions: List[Union[MCQQuestion, OpenTextQuestion]]
    total: int
