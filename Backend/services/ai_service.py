import os
import json
import hashlib
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from groq import Groq
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        
        print("Loading embedding model...")
        self.embedding_model = SentenceTransformer('BAAI/bge-small-en-v1.5')
        
        print("Initializing ChromaDB...")
        self.chroma_client = chromadb.PersistentClient(
            path=os.getenv("CHROMA_PERSIST_DIR", "./chroma_db"),
            settings=Settings(anonymized_telemetry=False)
        )
        
        self.question_collection = self.chroma_client.get_or_create_collection(
            name="question_embeddings",
            metadata={"hnsw:space": "cosine"}
        )
        
        self.mistake_patterns = self.chroma_client.get_or_create_collection(
            name="mistake_patterns",
            metadata={"hnsw:space": "cosine"}
        )
        print("AI Service ready!")
    
    def generate_embedding(self, text: str) -> List[float]:
        return self.embedding_model.encode(text).tolist()
    
    async def store_question_embedding(self, question_id: int, question_text: str, topic: str):
        embedding = self.generate_embedding(question_text)
        self.question_collection.upsert(
            ids=[str(question_id)],
            embeddings=[embedding],
            metadatas=[{"topic": topic, "question_id": question_id}],
            documents=[question_text]
        )
    
    async def find_similar_questions(self, question_text: str, topic: Optional[str] = None, n_results: int = 5):
        query_embedding = self.generate_embedding(question_text)
        where_filter = {"topic": topic} if topic else None
        
        results = self.question_collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter
        )
        return results
    
    async def store_mistake_pattern(self, student_answer: str, correct_answer: str, topic: str, feedback: str):
        mistake_text = f"Topic: {topic}\nStudent answer: {student_answer}\nCorrect: {correct_answer}"
        embedding = self.generate_embedding(mistake_text)
        unique_id = hashlib.md5(mistake_text.encode()).hexdigest()
        
        self.mistake_patterns.upsert(
            ids=[unique_id],
            embeddings=[embedding],
            metadatas=[{"topic": topic, "feedback": feedback, "student_answer": student_answer[:100]}],
            documents=[mistake_text]
        )
    
    async def find_similar_mistakes(self, student_answer: str, topic: str, n_results: int = 3):
        query_text = f"Topic: {topic}\nStudent answer: {student_answer}"
        query_embedding = self.generate_embedding(query_text)
        
        results = self.mistake_patterns.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where={"topic": topic}
        )
        return results
    
    async def generate_feedback(self, submission: Dict[str, Any], similar_mistakes: Optional[list] = None) -> Dict[str, Any]:
        is_correct = submission['student_answer'].lower().strip() == submission['correct_answer'].lower().strip()
        
        if is_correct:
            prompt = self._build_correct_prompt(submission)
        else:
            prompt = self._build_wrong_prompt(submission, similar_mistakes)
        
        completion = self.groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are an expert tutor. Provide encouraging, educational feedback."},
                {"role": "user", "content": prompt}
            ],
            model=self.model_name,
            temperature=0.7,
            max_tokens=500,
        )
        
        feedback = completion.choices[0].message.content
        follow_up = None if is_correct else await self._generate_follow_up(submission)
        
        return {
            "is_correct": is_correct,
            "feedback": feedback,
            "follow_up_question": follow_up
        }
    
    def _build_wrong_prompt(self, submission: Dict, similar_mistakes: Optional[list]) -> str:
        prompt = f"""
Topic: {submission['topic']}
Question: {submission['question']}
Student's Answer: {submission['student_answer']}
Correct Answer: {submission['correct_answer']}

The student got this WRONG. Provide:
1. Encouraging acknowledgment
2. Clear explanation of correct answer
3. Memory tip
4. Encouragement to try again

Keep under 50 words, be supportive.
"""
        if similar_mistakes and len(similar_mistakes) > 0:
            prompt += f"\n\nSimilar mistakes from others: {similar_mistakes[:3]}"
        return prompt
    
    def _build_correct_prompt(self, submission: Dict) -> str:
        return f"""
Topic: {submission['topic']}
Question: {submission['question']}
Student's Answer: {submission['student_answer']}
Correct Answer: {submission['correct_answer']}

The student got this CORRECT. Provide:
1. Positive reinforcement
2. Brief explanation why correct
3. Challenging follow-up insight
4. Encouragement

Keep under 50 words, be enthusiastic.
"""
    
    async def _generate_follow_up(self, submission: Dict) -> str:
        prompt = f"""
Based on {submission['topic']} question:
Original: {submission['question']}
Student got it wrong. Their answer: {submission['student_answer']}
Correct: {submission['correct_answer']}

Generate ONE simpler practice question. Return ONLY the question text.
"""
        completion = self.groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=self.model_name,
            temperature=0.8,
            max_tokens=200,
        )
        return completion.choices[0].message.content
    
    async def generate_quiz_question(self, topic: str, difficulty: str, previous_questions: Optional[list] = None) -> Dict:
        previous_text = ""
        if previous_questions and len(previous_questions) > 0:
            previous_text = f"\n\nDo NOT repeat these questions:\n" + "\n".join([f"- {q}" for q in previous_questions[-5:]])  # Last 5 questions
        
        difficulty_guide = {
            "easy": """
                - Use basic, fundamental concepts only
                - Question should be straightforward with clear, unambiguous answer
                - Options should have obvious wrong answers (common misconceptions)
                - Example: "What is the output of print(5 + 3) in Python?" 
                - Correct answer should be immediately obvious to beginners
            """,
            "medium": """
                - Use intermediate concepts requiring some understanding
                - Question may involve 2-3 steps of reasoning
                - Options should include plausible distractors (partially correct answers)
                - Example: "What will be the output of: x = [1,2,3]; print(x[1:])?"
                - Requires understanding of concepts, not just memorization
            """,
            "hard": """
                - Use advanced concepts, edge cases, or combined topics
                - Question may require deep understanding or debugging
                - Options should be very similar, requiring precision to distinguish
                - Example: "What is the difference between 'is' and '==' in Python with regards to object identity vs equality?"
                - May involve analyzing code snippets or scenarios
            """
        }
        
        difficulty_instructions = difficulty_guide.get(difficulty.lower(), difficulty_guide["medium"])
        
        prompt = f"""
Generate a UNIQUE and DIVERSE multiple-choice question about {topic}.

DIFFICULTY LEVEL: {difficulty.upper()}

Difficulty Guidelines:
{difficulty_instructions}

Make sure the question is different from common/typical questions. Be creative!

Return ONLY valid JSON in this exact format:
{{
    "question": "question text",
    "options": ["option1", "option2", "option3", "option4"],
    "correct_answer": "correct option",
    "explanation": "brief explanation"
}}{previous_text}

Do not include markdown formatting or code blocks.
IMPORTANT: Return ONLY the JSON, no other text.
"""
        completion = self.groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You generate educational quiz questions. Return ONLY valid JSON, no markdown."},
                {"role": "user", "content": prompt}
            ],
            model=self.model_name,
            temperature=0.7,
            max_tokens=500,
        )
        
        try:
            content = completion.choices[0].message.content.strip()
            # Remove markdown code blocks if present
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
                content = content.strip()
            
            result = json.loads(content)
            # Ensure all required fields exist, include difficulty
            result['difficulty'] = difficulty
            if all(k in result for k in ['question', 'options', 'correct_answer', 'explanation']):
                return result
            else:
                raise ValueError("Missing required fields")
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            print(f"Raw content: {completion.choices[0].message.content}")
            return {
                "question": f"What is a key concept in {topic}?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "Option A",
                "explanation": f"This is a basic question about {topic}."
            }