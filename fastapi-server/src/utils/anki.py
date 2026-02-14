import uuid
from pathlib import Path
from typing import List

try:
    import genanki
    HAS_GENANKI = True
except ImportError:
    HAS_GENANKI = False

from src.models.course import MultipleChoiceQuestion, LearningCard

class AnkiDeckGenerator:
    def __init__(self):
        import tempfile
        self.output_dir = Path(tempfile.gettempdir()) / "anki_output"
        self.output_dir.mkdir(exist_ok=True)

    def create_testing_deck(
        self, 
        questions: List[MultipleChoiceQuestion], 
        deck_name: str, 
        pdf_filename: str = None
    ) -> str:
        if not HAS_GENANKI:
            raise RuntimeError("genanki is not installed. Run: pip install genanki")
        
        model = genanki.Model(
            1607392319,
            'Interactive Multiple Choice',
            fields=[
                {'name': 'Question'},
                {'name': 'ChoiceA'},
                {'name': 'ChoiceB'},
                {'name': 'ChoiceC'},
                {'name': 'ChoiceD'},
                {'name': 'CorrectAnswer'},
                {'name': 'Explanation'},
            ],
            templates=[
                {
                    'name': 'Card 1',
                    'qfmt': self._get_front_template(),
                    'afmt': self._get_back_template(),
                },
            ],
            css=self._get_mcq_css()
        )

        deck = genanki.Deck(2059400110, deck_name)

        for question in questions:
            note = genanki.Note(
                model=model,
                fields=[
                    question.question,
                    question.options.get('A', ''),
                    question.options.get('B', ''),
                    question.options.get('C', ''),
                    question.options.get('D', ''),
                    question.correct_answer,
                    question.explanation or ''
                ]
            )
            deck.add_note(note)

        if pdf_filename:
            base_name = Path(pdf_filename).stem
            output_path = self.output_dir / f"{base_name}_testing.apkg"
        else:
            output_path = self.output_dir / f"{uuid.uuid4().hex}.apkg"
            
        package = genanki.Package(deck)
        package.write_to_file(str(output_path))

        return str(output_path)

    def create_learning_deck(
        self, 
        cards: List[LearningCard], 
        deck_name: str, 
        pdf_filename: str = None
    ) -> str:
        if not HAS_GENANKI:
            raise RuntimeError("genanki is not installed. Run: pip install genanki")

        model = genanki.Model(
            1607392320,
            'Learning Flashcard',
            fields=[
                {'name': 'Front'},
                {'name': 'Back'},
                {'name': 'Chapter'},
            ],
            templates=[
                {
                    'name': 'Card 1',
                    'qfmt': '''
                    <div class="card-container">
                        <div class="chapter-tag">{{Chapter}}</div>
                        <div class="front-content">{{Front}}</div>
                    </div>
                    ''',
                    'afmt': '''
                    <div class="card-container">
                        <div class="chapter-tag">{{Chapter}}</div>
                        <div class="front-content">{{Front}}</div>
                        <hr>
                        <div class="back-content">{{Back}}</div>
                    </div>
                    ''',
                },
            ],
            css=self._get_learning_css()
        )

        deck = genanki.Deck(2059400111, deck_name)

        for card in cards:
            note = genanki.Note(
                model=model,
                fields=[card.front, card.back, card.chapter]
            )
            deck.add_note(note)

        if pdf_filename:
            base_name = Path(pdf_filename).stem
            output_path = self.output_dir / f"{base_name}_learning.apkg"
        else:
            output_path = self.output_dir / f"{uuid.uuid4().hex}.apkg"
            
        package = genanki.Package(deck)
        package.write_to_file(str(output_path))

        return str(output_path)

    def _get_front_template(self) -> str:
        return '''
<div class="mcq-container">
    <div class="question">{{Question}}</div>
    <div class="choices">
        {{#ChoiceA}}<div class="choice" data-choice="A">A. {{ChoiceA}}</div>{{/ChoiceA}}
        {{#ChoiceB}}<div class="choice" data-choice="B">B. {{ChoiceB}}</div>{{/ChoiceB}}
        {{#ChoiceC}}<div class="choice" data-choice="C">C. {{ChoiceC}}</div>{{/ChoiceC}}
        {{#ChoiceD}}<div class="choice" data-choice="D">D. {{ChoiceD}}</div>{{/ChoiceD}}
    </div>
</div>
'''

    def _get_back_template(self) -> str:
        return '''
<div class="mcq-container">
    <div class="question">{{Question}}</div>
    <div class="choices">
        {{#ChoiceA}}<div class="choice {{#CorrectAnswer}}{{^ChoiceA}}{{/ChoiceA}}{{/CorrectAnswer}}" data-choice="A">A. {{ChoiceA}}</div>{{/ChoiceA}}
        {{#ChoiceB}}<div class="choice" data-choice="B">B. {{ChoiceB}}</div>{{/ChoiceB}}
        {{#ChoiceC}}<div class="choice" data-choice="C">C. {{ChoiceC}}</div>{{/ChoiceC}}
        {{#ChoiceD}}<div class="choice" data-choice="D">D. {{ChoiceD}}</div>{{/ChoiceD}}
    </div>
    <div class="answer-section">
        <div class="correct-answer">Correct Answer: {{CorrectAnswer}}</div>
        {{#Explanation}}<div class="explanation">{{Explanation}}</div>{{/Explanation}}
    </div>
</div>
'''

    def _get_mcq_css(self) -> str:
        return '''
.mcq-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
.question { font-size: 18px; font-weight: bold; margin-bottom: 20px; line-height: 1.4; }
.choices { margin-bottom: 20px; }
.choice { background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 12px 16px; margin: 8px 0; font-size: 16px; }
.choice:hover { background: #e9ecef; }
.answer-section { margin-top: 20px; padding-top: 20px; border-top: 2px solid #e9ecef; }
.correct-answer { font-weight: bold; color: #28a745; margin-bottom: 10px; }
.explanation { background: #f8f9fa; border-left: 4px solid #007bff; padding: 12px 16px; font-style: italic; }
'''

    def _get_learning_css(self) -> str:
        return '''
.card-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6; }
.chapter-tag { background-color: #007bff; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 15px; }
.front-content { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; }
.back-content { font-size: 16px; color: #555; margin-top: 15px; }
hr { border: none; height: 1px; background-color: #ddd; margin: 20px 0; }
'''
