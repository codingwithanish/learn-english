"""
Usage examples for the new LLM service integration.
These examples show how to use different LLM providers in your application.
"""

from app.core.llm_manager import make_llm_call, get_llm_service
from app.services.nlp_service import NLPService
from app.models.models import ResourceType

async def basic_llm_usage():
    """Basic usage with default provider."""
    
    # Simple message
    messages = [
        {"role": "user", "content": "What is the meaning of 'serendipity'?"}
    ]
    
    response = await make_llm_call(messages)
    print(f"Response: {response.content}")
    print(f"Used: {response.provider}/{response.model}")
    

async def specific_provider_usage():
    """Using specific providers for different tasks."""
    
    messages = [
        {"role": "system", "content": "You are an English vocabulary expert."},
        {"role": "user", "content": "Explain the word 'ephemeral'"}
    ]
    
    # Use Groq for fast response
    groq_response = await make_llm_call(
        messages=messages,
        provider_model="groq/mixtral-8x7b-32768",
        temperature=0.3
    )
    
    # Use OpenAI for high quality
    openai_response = await make_llm_call(
        messages=messages,
        provider_model="openai/gpt-4",
        temperature=0.3
    )
    
    # Use local Ollama for privacy/development
    ollama_response = await make_llm_call(
        messages=messages,
        provider_model="ollama/llama3",
        temperature=0.3
    )
    
    print("Groq:", groq_response.content[:100])
    print("OpenAI:", openai_response.content[:100])
    print("Ollama:", ollama_response.content[:100])


async def nlp_service_with_custom_provider():
    """Using NLP service methods with custom providers."""
    
    query = "Hello, how are you today?"
    
    # Detect query type with different providers
    type_groq = await NLPService.detect_query_type(
        query, 
        provider_model="groq/mixtral-8x7b-32768"
    )
    
    type_openai = await NLPService.detect_query_type(
        query,
        provider_model="openai/gpt-3.5-turbo"
    )
    
    print(f"Groq classification: {type_groq}")
    print(f"OpenAI classification: {type_openai}")
    
    # Process text with specific provider
    result = await NLPService.process_text_query(
        query="magnificent",
        query_type=ResourceType.VOCABULARY,
        provider_model="anthropic/claude-3-sonnet-20240229"
    )
    
    print(f"Processing result: {result['description']}")
    print(f"Used provider: {result.get('provider_used')}")
    print(f"Used model: {result.get('model_used')}")


async def speech_evaluation_example():
    """Evaluating speech with different providers."""
    
    transcript = "Hello, my name is John. I am learning English and I want to improve my speaking skills."
    topic = "Self Introduction"
    
    # Use OpenAI for detailed analysis
    openai_eval = await NLPService.evaluate_speech(
        transcript=transcript,
        reference_topic=topic,
        provider_model="openai/gpt-4"
    )
    
    # Use Groq for faster evaluation
    groq_eval = await NLPService.evaluate_speech(
        transcript=transcript,
        reference_topic=topic,
        provider_model="groq/mixtral-8x7b-32768"
    )
    
    print("OpenAI Evaluation:")
    for eval_item in openai_eval:
        print(f"- {eval_item['criteria']}: {eval_item['suggestion']}")
    
    print("\nGroq Evaluation:")
    for eval_item in groq_eval:
        print(f"- {eval_item['criteria']}: {eval_item['suggestion']}")


async def cost_optimization_example():
    """Example of using different providers based on cost/performance needs."""
    
    async def classify_query_cheap(query: str):
        """Use cheap/free provider for simple classification."""
        return await NLPService.detect_query_type(
            query, 
            provider_model="ollama/llama3"  # Free local model
        )
    
    async def detailed_analysis_premium(query: str, query_type: ResourceType):
        """Use premium provider for detailed analysis."""
        return await NLPService.process_text_query(
            query=query,
            query_type=query_type,
            provider_model="openai/gpt-4"  # High quality but expensive
        )
    
    async def real_time_feedback_fast(transcript: str, topic: str):
        """Use fast provider for real-time feedback."""
        return await NLPService.evaluate_speech(
            transcript=transcript,
            reference_topic=topic,
            provider_model="groq/mixtral-8x7b-32768"  # Very fast
        )
    
    # Example workflow
    query = "procrastination"
    
    # Step 1: Quick classification with free model
    query_type = await classify_query_cheap(query)
    print(f"Query type (free): {query_type}")
    
    # Step 2: Detailed analysis with premium model
    detailed_result = await detailed_analysis_premium(query, query_type)
    print(f"Detailed analysis (premium): {detailed_result['description']}")
    
    # Step 3: Real-time speech feedback with fast model
    transcript = "I often procrastinate when I have difficult tasks to complete."
    feedback = await real_time_feedback_fast(transcript, "Discussing procrastination")
    print(f"Speech feedback (fast): {len(feedback)} evaluation points")


async def error_handling_example():
    """Example of handling errors and provider fallbacks."""
    
    async def robust_text_processing(query: str):
        """Process text with fallback providers."""
        
        providers_to_try = [
            "openai/gpt-4",           # Try premium first
            "groq/mixtral-8x7b-32768", # Fall back to fast
            "ollama/llama3",          # Fall back to local
        ]
        
        for provider_model in providers_to_try:
            try:
                query_type = await NLPService.detect_query_type(
                    query, provider_model=provider_model
                )
                
                result = await NLPService.process_text_query(
                    query=query,
                    query_type=query_type,
                    provider_model=provider_model
                )
                
                print(f"Success with provider: {provider_model}")
                return result
                
            except Exception as e:
                print(f"Failed with {provider_model}: {e}")
                continue
        
        raise Exception("All providers failed")
    
    # Test the robust function
    try:
        result = await robust_text_processing("serendipity")
        print(f"Final result: {result['description']}")
    except Exception as e:
        print(f"All providers failed: {e}")


async def provider_comparison_example():
    """Compare different providers for the same task."""
    
    query = "What is machine learning?"
    messages = [{"role": "user", "content": query}]
    
    providers = [
        ("openai/gpt-3.5-turbo", "OpenAI GPT-3.5"),
        ("groq/mixtral-8x7b-32768", "Groq Mixtral"),
        ("google/gemini-1.5-flash", "Google Gemini"),
        ("ollama/llama3", "Ollama Llama3"),
    ]
    
    results = {}
    
    for provider_model, display_name in providers:
        try:
            import time
            start_time = time.time()
            
            response = await make_llm_call(
                messages=messages,
                provider_model=provider_model,
                max_tokens=100
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            results[display_name] = {
                "content": response.content[:100] + "...",
                "response_time": round(response_time, 2),
                "success": True
            }
            
        except Exception as e:
            results[display_name] = {
                "content": None,
                "response_time": None,
                "success": False,
                "error": str(e)
            }
    
    print("Provider Comparison Results:")
    print("-" * 50)
    
    for provider, result in results.items():
        if result["success"]:
            print(f"{provider}:")
            print(f"  Response Time: {result['response_time']}s")
            print(f"  Content: {result['content']}")
        else:
            print(f"{provider}: FAILED - {result['error']}")
        print()


async def dynamic_provider_selection():
    """Select provider dynamically based on requirements."""
    
    def select_provider_for_task(task_type: str, priority: str = "balanced"):
        """Select best provider based on task and priority."""
        
        provider_matrix = {
            "classification": {
                "speed": "groq/mixtral-8x7b-32768",
                "quality": "openai/gpt-4", 
                "cost": "ollama/llama3",
                "balanced": "groq/mixtral-8x7b-32768"
            },
            "detailed_analysis": {
                "speed": "groq/mixtral-8x7b-32768",
                "quality": "anthropic/claude-3-opus-20240229",
                "cost": "ollama/llama3",
                "balanced": "openai/gpt-3.5-turbo"
            },
            "speech_evaluation": {
                "speed": "groq/mixtral-8x7b-32768", 
                "quality": "openai/gpt-4",
                "cost": "ollama/llama3",
                "balanced": "openai/gpt-3.5-turbo"
            }
        }
        
        return provider_matrix.get(task_type, {}).get(priority, "openai/gpt-3.5-turbo")
    
    # Examples
    query = "ephemeral"
    
    # Quick classification for real-time UI
    speed_provider = select_provider_for_task("classification", "speed")
    query_type = await NLPService.detect_query_type(query, provider_model=speed_provider)
    print(f"Quick classification with {speed_provider}: {query_type}")
    
    # Detailed analysis for comprehensive learning
    quality_provider = select_provider_for_task("detailed_analysis", "quality") 
    detailed_result = await NLPService.process_text_query(
        query, query_type, provider_model=quality_provider
    )
    print(f"Detailed analysis with {quality_provider}: {detailed_result['description']}")
    
    # Cost-effective processing for batch operations
    cost_provider = select_provider_for_task("detailed_analysis", "cost")
    cost_result = await NLPService.process_text_query(
        query, query_type, provider_model=cost_provider
    )
    print(f"Cost-effective analysis with {cost_provider}: {cost_result['description']}")


# Main example runner
if __name__ == "__main__":
    import asyncio
    
    async def run_examples():
        print("=== Basic LLM Usage ===")
        await basic_llm_usage()
        
        print("\n=== Specific Provider Usage ===")
        await specific_provider_usage()
        
        print("\n=== NLP Service with Custom Providers ===")
        await nlp_service_with_custom_provider()
        
        print("\n=== Speech Evaluation Example ===")
        await speech_evaluation_example()
        
        print("\n=== Cost Optimization Example ===")
        await cost_optimization_example()
        
        print("\n=== Error Handling Example ===")
        await error_handling_example()
        
        print("\n=== Provider Comparison ===")
        await provider_comparison_example()
        
        print("\n=== Dynamic Provider Selection ===")
        await dynamic_provider_selection()
    
    asyncio.run(run_examples())