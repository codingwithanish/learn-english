#!/usr/bin/env python3

"""
Quick test script to verify imports work correctly.
"""

import sys
import traceback

def test_basic_imports():
    """Test basic imports without optional dependencies."""
    
    print("Testing basic imports...")
    
    try:
        # Test basic config import
        from app.core.config import settings
        print("[OK] Config import successful")
        
        # Test LLM service import
        from app.core.llm_service import LLMService, LLMProvider, LLMMessage, LLMRequest, LLMResponse
        print("[OK] LLM service classes import successful")
        
        # Test LLM manager import  
        from app.core.llm_manager import LLMManager, get_llm_service, make_llm_call
        print("[OK] LLM manager import successful")
        
        # Test NLP service import
        from app.services.nlp_service import NLPService
        print("[OK] NLP service import successful")
        
        # Test API import
        from app.api.llm import router
        print("[OK] LLM API router import successful")
        
        print("\n[SUCCESS] All core imports successful!")
        return True
        
    except Exception as e:
        print(f"[ERROR] Import failed: {e}")
        traceback.print_exc()
        return False


def test_llm_manager_basic():
    """Test basic LLM manager functionality."""
    
    print("\nTesting LLM manager basic functionality...")
    
    try:
        from app.core.llm_manager import llm_manager
        
        # Test configuration
        default_provider = llm_manager.get_default_provider_model()
        print(f"[OK] Default provider: {default_provider}")
        
        # Test configured providers
        providers = llm_manager.get_configured_providers()
        print(f"[OK] Configured providers: {providers}")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] LLM manager test failed: {e}")
        traceback.print_exc()
        return False


def test_provider_availability():
    """Test which providers are actually available."""
    
    print("\nTesting provider availability...")
    
    try:
        from app.core.llm_service import LLMFactory, LLMProvider
        from app.core.config import settings
        
        available_providers = []
        unavailable_providers = []
        
        # Test each provider type
        provider_configs = settings.llm_provider_configs
        
        for provider_name, config in provider_configs.items():
            try:
                provider_enum = LLMProvider(provider_name)
                provider_instance = LLMFactory.create_provider(provider_enum, config)
                available_providers.append(provider_name)
                print(f"[OK] {provider_name}: Available")
                
            except ImportError as e:
                unavailable_providers.append((provider_name, "Missing dependency"))
                print(f"[WARN] {provider_name}: Missing dependency - {e}")
                
            except Exception as e:
                unavailable_providers.append((provider_name, str(e)))
                print(f"[ERROR] {provider_name}: Configuration error - {e}")
        
        print(f"\n[SUMMARY]")
        print(f"  Available providers: {len(available_providers)}")
        print(f"  Unavailable providers: {len(unavailable_providers)}")
        
        return len(available_providers) > 0
        
    except Exception as e:
        print(f"[ERROR] Provider availability test failed: {e}")
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("Testing LLM Service Integration")
    print("=" * 50)
    
    success_count = 0
    total_tests = 3
    
    # Run tests
    if test_basic_imports():
        success_count += 1
        
    if test_llm_manager_basic():
        success_count += 1
        
    if test_provider_availability():
        success_count += 1
    
    print("\n" + "=" * 50)
    print(f"Test Results: {success_count}/{total_tests} passed")
    
    if success_count == total_tests:
        print("SUCCESS: All tests passed! LLM integration is working correctly.")
        sys.exit(0)
    else:
        print("WARNING: Some tests failed. Check the errors above.")
        sys.exit(1)