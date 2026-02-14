from typing import List, Optional, Callable

from src.utils.llm import get_llm_service
from src.models.course import (
    FlashcardConfig, FlashcardType, TaskStatus,
    FlashcardPreview, MultipleChoiceQuestion, LearningCard,
    MCQList, LearningCardList,
)
from src.prompts.course import (
    MCQ_SYSTEM_PROMPT,
    LEARNING_CARD_SYSTEM_PROMPT,
    MCQ_USER_PROMPT,
    LEARNING_CARD_USER_PROMPT,
)
from src.utils.pdf import PDFParser
from src.utils.anki import AnkiDeckGenerator


class FlashcardAgent:
    
    def __init__(self):
        self.llm = get_llm_service()
        self.pdf_parser = PDFParser()
        self.anki_generator = AnkiDeckGenerator()

    async def analyze_pdf(
        self, 
        pdf_path: str, 
        config: FlashcardConfig
    ) -> FlashcardPreview:
        pdf_data = self.pdf_parser.extract_text_and_metadata(pdf_path)
        chapters = self.pdf_parser.identify_chapters(
            pdf_data, 
            config.chapter_mode.value, 
            config.slides_per_chapter
        )

        if config.type == FlashcardType.TESTING:
            estimated_cards = min(100, max(10, len(pdf_data["pages"]) * 2))
        else:
            estimated_cards = len(chapters) * 4
        sample_question = None
        sample_learning_card = None

        if config.type == FlashcardType.TESTING:
            sample_text = pdf_data["total_text"][:2000]
            questions = await self.generate_mcq_questions(
                sample_text, 
                config.difficulty.value, 
                1
            )
            if questions:
                sample_question = questions[0]
        else:
            if chapters:
                cards = await self.generate_learning_cards(
                    [chapters[0]], 
                    1
                )
                if cards:
                    sample_learning_card = cards[0]

        return FlashcardPreview(
            type=config.type,
            estimated_cards=estimated_cards,
            sample_question=sample_question,
            sample_learning_card=sample_learning_card,
            chapters=[ch["title"] for ch in chapters]
        )

    async def generate_from_text(
        self,
        text: str,
        title: str,
        config: FlashcardConfig,
        progress_callback: Optional[Callable] = None
    ) -> str:
        try:
            if progress_callback:
                progress_callback(TaskStatus.GENERATING, 10, "Processing text content")
                
            chapters = [{"title": title, "text": text}]
            
            if config.type == FlashcardType.TESTING:
                if progress_callback:
                    progress_callback(TaskStatus.GENERATING, 30, "Generating questions from text")
                    
                num_questions = 15
                
                questions = await self.generate_mcq_questions(
                    text,
                    config.difficulty.value,
                    num_questions
                )
                
                if progress_callback:
                    progress_callback(TaskStatus.PACKAGING, 70, f"Creating deck with {len(questions)} questions")
                    
                apkg_path = self.anki_generator.create_testing_deck(
                    questions,
                    title,
                    "generated_text"
                )
                
            else:
                if progress_callback:
                    progress_callback(TaskStatus.GENERATING, 30, "Generating learning cards")
                    
                cards = await self.generate_learning_cards(chapters, 8)
                
                if progress_callback:
                    progress_callback(TaskStatus.PACKAGING, 70, f"Creating deck with {len(cards)} cards")
                    
                apkg_path = self.anki_generator.create_learning_deck(
                    cards,
                    title,
                    "generated_text"
                )
                
            if progress_callback:
                progress_callback(TaskStatus.COMPLETED, 100, "Generation complete")
                
            return apkg_path

        except Exception as e:
            if progress_callback:
                progress_callback(TaskStatus.FAILED, 0, f"Error: {str(e)}")
            raise

    async def generate_flashcards(
        self, 
        pdf_path: str, 
        config: FlashcardConfig,
        progress_callback: Optional[Callable] = None
    ) -> str:
        try:
            if progress_callback:
                progress_callback(TaskStatus.ANALYZING, 10, "Extracting PDF content")

            pdf_data = self.pdf_parser.extract_text_and_metadata(pdf_path)
            chapters = self.pdf_parser.identify_chapters(
                pdf_data, 
                config.chapter_mode.value, 
                config.slides_per_chapter
            )

            if progress_callback:
                progress_callback(
                    TaskStatus.ANALYZING, 25, 
                    f"Found {len(chapters)} chapters, {len(pdf_data['pages'])} pages"
                )

            if config.type == FlashcardType.TESTING:
                if progress_callback:
                    progress_callback(TaskStatus.GENERATING, 40, "Generating questions")

                total_pages = pdf_data["metadata"]["page_count"]
                num_questions = min(100, max(10, total_pages * 2))

                questions = await self.generate_mcq_questions(
                    pdf_data["total_text"],
                    config.difficulty.value,
                    num_questions
                )

                if progress_callback:
                    progress_callback(
                        TaskStatus.PACKAGING, 80, 
                        f"Creating Anki deck with {len(questions)} questions"
                    )

                apkg_path = self.anki_generator.create_testing_deck(
                    questions, 
                    config.title, 
                    pdf_path
                )

            else:
                if progress_callback:
                    progress_callback(TaskStatus.GENERATING, 40, "Generating learning cards")

                cards_per_chapter = 4
                total_cards = len(chapters) * cards_per_chapter

                cards = await self.generate_learning_cards(chapters, cards_per_chapter)

                if progress_callback:
                    progress_callback(
                        TaskStatus.PACKAGING, 80, 
                        f"Creating Anki deck with {len(cards)} cards"
                    )

                apkg_path = self.anki_generator.create_learning_deck(
                    cards, 
                    config.title, 
                    pdf_path
                )

            if progress_callback:
                progress_callback(TaskStatus.COMPLETED, 100, "Flashcard generation complete")

            return apkg_path

        except Exception as e:
            if progress_callback:
                progress_callback(TaskStatus.FAILED, 0, f"Error: {str(e)}")
            raise

    async def generate_mcq_questions(
        self, 
        text: str, 
        difficulty: str, 
        num_questions: int
    ) -> List[MultipleChoiceQuestion]:
        max_chars = 100000
        if len(text) > max_chars:
            text = text[:max_chars]

        prompt = MCQ_USER_PROMPT.format(
            num_questions=num_questions,
            difficulty=difficulty,
            text=text
        )

        try:
            result = await self.llm.generate_structured(
                prompt=prompt,
                output_schema=MCQList,
                system_prompt=MCQ_SYSTEM_PROMPT
            )
            return result.questions
        except Exception as e:
            print(f"Error generating MCQ questions: {e}")
            return []

    async def generate_learning_cards(
        self, 
        chapters: List[dict], 
        cards_per_chapter: int
    ) -> List[LearningCard]:
        all_cards = []

        for chapter in chapters:
            chapter_text = chapter.get("text", "")
            chapter_title = chapter.get("title", "Unknown Chapter")

            prompt = LEARNING_CARD_USER_PROMPT.format(
                cards_per_chapter=cards_per_chapter,
                chapter_title=chapter_title,
                chapter_text=chapter_text
            )

            try:
                result = await self.llm.generate_structured(
                    prompt=prompt,
                    output_schema=LearningCardList,
                    system_prompt=LEARNING_CARD_SYSTEM_PROMPT
                )

                for card in result.cards:
                    card.chapter = chapter_title
                    all_cards.append(card)
                    
            except Exception as e:
                print(f"Error generating cards for {chapter_title}: {e}")

        return all_cards


_flashcard_agent = None


def get_flashcard_agent() -> FlashcardAgent:
    global _flashcard_agent
    if _flashcard_agent is None:
        _flashcard_agent = FlashcardAgent()
    return _flashcard_agent
