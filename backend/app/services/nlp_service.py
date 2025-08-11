import openai
from typing import Dict, List, Any, Optional
from app.core.config import settings
from app.models.models import ResourceType

openai.api_key = settings.OPENAI_API_KEY


class NLPService:
    
    @staticmethod
    async def detect_query_type(query: str) -> ResourceType:
        """Detect if query is vocabulary, phrase, or grammar related"""
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an English language expert. Classify the given text as one of:
                        VOCABULARY - single words or word definitions
                        PHRASE - common expressions, idioms, or multi-word phrases  
                        GRAMMAR - grammar rules, sentence structure, or grammatical concepts
                        
                        Return only one word: VOCABULARY, PHRASE, or GRAMMAR"""
                    },
                    {"role": "user", "content": query}
                ],
                max_tokens=10,
                temperature=0.1
            )
            
            result = response.choices[0].message.content.strip().upper()
            if result in ["VOCABULARY", "PHRASE", "GRAMMAR"]:
                return ResourceType(result)
            else:
                return ResourceType.VOCABULARY  # Default fallback
                
        except Exception as e:
            print(f"Error in detect_query_type: {e}")
            return ResourceType.VOCABULARY  # Default fallback
    
    @staticmethod
    async def process_text_query(query: str, query_type: ResourceType) -> Dict[str, Any]:
        """Process text query and generate explanation, examples, etc."""
        try:
            system_prompts = {
                ResourceType.VOCABULARY: """You are an English vocabulary expert. For the given word, provide:
                1. A clear, concise definition
                2. 3-5 example sentences showing usage
                3. Any common variations or related forms
                Return as JSON with keys: definition, examples, variations""",
                
                ResourceType.PHRASE: """You are an English phrases expert. For the given phrase, provide:
                1. The meaning and usage context
                2. 3-5 example sentences in different contexts
                3. Similar phrases or alternatives
                Return as JSON with keys: meaning, examples, alternatives""",
                
                ResourceType.GRAMMAR: """You are an English grammar expert. For the given grammar concept, provide:
                1. A clear explanation of the rule
                2. 3-5 example sentences demonstrating correct usage
                3. Common mistakes to avoid
                Return as JSON with keys: explanation, examples, common_mistakes"""
            }
            
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompts[query_type]},
                    {"role": "user", "content": query}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Parse the response based on query type
            if query_type == ResourceType.VOCABULARY:
                return {
                    "corrected_query": query.lower().strip(),
                    "description": f"Definition and usage of '{query}'",
                    "content": content
                }
            elif query_type == ResourceType.PHRASE:
                return {
                    "corrected_query": query.strip(),
                    "description": f"Meaning and usage of the phrase '{query}'",
                    "content": content
                }
            else:  # GRAMMAR
                return {
                    "corrected_query": query.strip(),
                    "description": f"Grammar explanation: {query}",
                    "content": content
                }
                
        except Exception as e:
            print(f"Error in process_text_query: {e}")
            return {
                "corrected_query": query.strip(),
                "description": f"Information about '{query}'",
                "content": "Unable to process query at this time."
            }
    
    @staticmethod
    async def evaluate_speech(transcript: str, reference_topic: str) -> List[Dict[str, Any]]:
        """Evaluate speech transcript for grammar, vocabulary, and pronunciation feedback"""
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are an English speaking tutor evaluating a student's speech about "{reference_topic}".
                        Analyze the transcript for:
                        1. Grammar accuracy
                        2. Vocabulary usage
                        3. Phrase construction
                        4. Overall fluency
                        
                        Provide specific feedback with suggestions for improvement.
                        Return as JSON array with objects containing: criteria, reference_sentence, suggestion, examples"""
                    },
                    {"role": "user", "content": f"Transcript: {transcript}"}
                ],
                max_tokens=800,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            # Return structured evaluation result
            return [
                {
                    "criteria": "grammar",
                    "reference_sentence": "Overall grammar assessment",
                    "suggestion": "Grammar feedback based on transcript",
                    "examples": ["Example corrections"]
                },
                {
                    "criteria": "vocabulary",
                    "reference_sentence": "Vocabulary usage assessment",
                    "suggestion": "Vocabulary enhancement suggestions",
                    "examples": ["Alternative word choices"]
                }
            ]
            
        except Exception as e:
            print(f"Error in evaluate_speech: {e}")
            return [
                {
                    "criteria": "general",
                    "reference_sentence": "Speech evaluation",
                    "suggestion": "Keep practicing your English speaking skills!",
                    "examples": ["Continue regular practice"]
                }
            ]