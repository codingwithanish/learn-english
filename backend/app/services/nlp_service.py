from typing import Dict, List, Any, Optional
from app.core.config import settings
from app.core.llm_manager import make_llm_call
from app.models.models import ResourceType
import logging

logger = logging.getLogger(__name__)


class NLPService:
    
    @staticmethod
    async def detect_query_type(
        query: str, 
        provider_model: Optional[str] = None
    ) -> ResourceType:
        """
        Detect if query is vocabulary, phrase, or grammar related.
        
        Args:
            query: Text query to classify
            provider_model: Optional provider/model override (e.g., "openai/gpt-4")
        
        Returns:
            ResourceType enum value
        """
        try:
            messages = [
                {
                    "role": "system",
                    "content": """You are an English language expert. Classify the given text as one of:
                    VOCABULARY - single words or word definitions
                    PHRASE - common expressions, idioms, or multi-word phrases  
                    GRAMMAR - grammar rules, sentence structure, or grammatical concepts
                    
                    Return only one word: VOCABULARY, PHRASE, or GRAMMAR"""
                },
                {"role": "user", "content": query}
            ]
            
            response = await make_llm_call(
                messages=messages,
                provider_model=provider_model,
                max_tokens=10,
                temperature=0.1
            )
            
            result = response.content.strip().upper()
            if result in ["VOCABULARY", "PHRASE", "GRAMMAR"]:
                return ResourceType(result)
            else:
                logger.warning(f"Unexpected classification result: {result}")
                return ResourceType.VOCABULARY  # Default fallback
                
        except Exception as e:
            logger.error(f"Error in detect_query_type: {e}")
            return ResourceType.VOCABULARY  # Default fallback
    
    @staticmethod
    async def process_text_query(
        query: str, 
        query_type: ResourceType,
        provider_model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process text query and generate explanation, examples, etc.
        
        Args:
            query: Text query to process
            query_type: Type of query (vocabulary/phrase/grammar)
            provider_model: Optional provider/model override
            
        Returns:
            Dictionary with processed query information
        """
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
            
            messages = [
                {"role": "system", "content": system_prompts[query_type]},
                {"role": "user", "content": query}
            ]
            
            response = await make_llm_call(
                messages=messages,
                provider_model=provider_model,
                max_tokens=500,
                temperature=0.3
            )
            
            content = response.content
            
            # Parse the response based on query type
            if query_type == ResourceType.VOCABULARY:
                return {
                    "corrected_query": query.lower().strip(),
                    "description": f"Definition and usage of '{query}'",
                    "content": content,
                    "model_used": response.model,
                    "provider_used": response.provider
                }
            elif query_type == ResourceType.PHRASE:
                return {
                    "corrected_query": query.strip(),
                    "description": f"Meaning and usage of the phrase '{query}'",
                    "content": content,
                    "model_used": response.model,
                    "provider_used": response.provider
                }
            else:  # GRAMMAR
                return {
                    "corrected_query": query.strip(),
                    "description": f"Grammar explanation: {query}",
                    "content": content,
                    "model_used": response.model,
                    "provider_used": response.provider
                }
                
        except Exception as e:
            logger.error(f"Error in process_text_query: {e}")
            return {
                "corrected_query": query.strip(),
                "description": f"Information about '{query}'",
                "content": "Unable to process query at this time.",
                "error": str(e)
            }
    
    @staticmethod
    async def evaluate_speech(
        transcript: str, 
        reference_topic: str,
        provider_model: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluate speech transcript for grammar, vocabulary, and pronunciation feedback.
        
        Args:
            transcript: Speech transcript to evaluate
            reference_topic: Topic the speech was about
            provider_model: Optional provider/model override
            
        Returns:
            List of evaluation criteria with feedback
        """
        try:
            messages = [
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
            ]
            
            response = await make_llm_call(
                messages=messages,
                provider_model=provider_model,
                max_tokens=800,
                temperature=0.3
            )
            
            content = response.content
            
            try:
                # Try to parse JSON response
                import json
                evaluation_data = json.loads(content)
                
                # Ensure it's a list
                if not isinstance(evaluation_data, list):
                    evaluation_data = [evaluation_data]
                    
                # Add metadata to each evaluation item
                for item in evaluation_data:
                    item["model_used"] = response.model
                    item["provider_used"] = response.provider
                    
                return evaluation_data
                
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                logger.warning("Could not parse JSON from speech evaluation response")
                return [
                    {
                        "criteria": "general",
                        "reference_sentence": "Overall speech evaluation",
                        "suggestion": content,
                        "examples": [],
                        "model_used": response.model,
                        "provider_used": response.provider
                    }
                ]
            
        except Exception as e:
            logger.error(f"Error in evaluate_speech: {e}")
            return [
                {
                    "criteria": "general",
                    "reference_sentence": "Speech evaluation",
                    "suggestion": "Keep practicing your English speaking skills!",
                    "examples": ["Continue regular practice"],
                    "error": str(e)
                }
            ]