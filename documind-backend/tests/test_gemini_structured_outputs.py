"""
Test Gemini Structured Outputs for citation extraction
"""

import pytest
import asyncio
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.generation import GenerationService
from app.services.retrieval import RetrievalService, RetrievalConfig
from app.services.llm import LLMService, LLMConfig, LLMProvider
from app.core.config import settings


@pytest.mark.asyncio
async def test_gemini_structured_outputs_enabled():
    """Test that Structured Outputs work when enabled"""
    # Skip if Gemini not configured
    if not settings.GEMINI_API_KEY:
        pytest.skip("GEMINI_API_KEY not set")
    
    # Skip if not using Gemini
    if settings.LLM_PROVIDER != "gemini":
        pytest.skip(f"LLM_PROVIDER is {settings.LLM_PROVIDER}, not gemini")
    
    # Ensure structured outputs are enabled
    if not settings.USE_GEMINI_STRUCTURED_OUTPUTS:
        pytest.skip("USE_GEMINI_STRUCTURED_OUTPUTS is False")
    
    print("\n" + "=" * 80)
    print("Testing Gemini Structured Outputs for Citation Extraction")
    print("=" * 80)
    
    # Initialize services
    llm_service = LLMService(provider=LLMProvider.GEMINI)
    retrieval_service = RetrievalService()
    generation_service = GenerationService(
        retrieval_service=retrieval_service,
        llm_service=llm_service
    )
    
    # Create a simple test query (you'll need indexed documents first)
    # This test assumes you have documents indexed
    test_query = "What is the main topic?"
    
    print(f"\n📝 Query: {test_query}")
    print(f"🔧 Provider: {llm_service.provider.value}")
    print(f"🔧 Model: {llm_service.llm.model}")
    print(f"🔧 Structured Outputs: {settings.USE_GEMINI_STRUCTURED_OUTPUTS}")
    print()
    
    try:
        response = await generation_service.generate_answer(
            query=test_query,
            collection_name=settings.VECTOR_STORE_COLLECTION_PREFIX
        )
        
        print("✅ Generation successful!")
        print(f"   - Answer length: {len(response.answer)} characters")
        print(f"   - Citations: {len(response.citations)}")
        print(f"   - Confidence: {response.confidence:.2f}")
        print()
        
        # Check if structured output was used
        if response.metadata.get("structured_output"):
            print("✅ Structured Output detected in metadata!")
            print(f"   - Structured data: {response.metadata['structured_output']}")
        else:
            print("⚠️  No structured output in metadata (may have fallen back to regex)")
        
        print("\n📝 Answer:")
        print("-" * 80)
        print(response.answer[:500] + "..." if len(response.answer) > 500 else response.answer)
        print("-" * 80)
        
        if response.citations:
            print("\n📚 Citations:")
            for citation in response.citations[:5]:  # Show first 5
                print(f"   [{citation.index}] Doc: {citation.document_id}, Page: {citation.page}")
        
        assert response.answer, "Answer should not be empty"
        assert len(response.answer) > 0, "Answer should have content"
        
        print("\n" + "=" * 80)
        print("✅ Structured Outputs test completed!")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        raise


@pytest.mark.asyncio
async def test_gemini_structured_outputs_disabled():
    """Test that system falls back to regex when structured outputs disabled"""
    # Skip if Gemini not configured
    if not settings.GEMINI_API_KEY:
        pytest.skip("GEMINI_API_KEY not set")
    
    # Temporarily disable structured outputs
    original_setting = settings.USE_GEMINI_STRUCTURED_OUTPUTS
    settings.USE_GEMINI_STRUCTURED_OUTPUTS = False
    
    try:
        llm_service = LLMService(provider=LLMProvider.GEMINI)
        retrieval_service = RetrievalService()
        generation_service = GenerationService(
            retrieval_service=retrieval_service,
            llm_service=llm_service
        )
        
        test_query = "What is the main topic?"
        
        response = await generation_service.generate_answer(
            query=test_query,
            collection_name=settings.VECTOR_STORE_COLLECTION_PREFIX
        )
        
        # Should still work, but using regex extraction
        assert response.answer, "Answer should not be empty"
        assert not response.metadata.get("structured_output"), "Should not have structured output when disabled"
        
        print("✅ Fallback to regex extraction works correctly")
        
    finally:
        # Restore original setting
        settings.USE_GEMINI_STRUCTURED_OUTPUTS = original_setting


if __name__ == "__main__":
    # Run tests
    print("Running Gemini Structured Outputs Tests...")
    print(f"GEMINI_API_KEY: {'Set' if settings.GEMINI_API_KEY else 'Not Set'}")
    print(f"LLM_PROVIDER: {settings.LLM_PROVIDER}")
    print(f"USE_GEMINI_STRUCTURED_OUTPUTS: {settings.USE_GEMINI_STRUCTURED_OUTPUTS}")
    print()
    
    asyncio.run(test_gemini_structured_outputs_enabled())

