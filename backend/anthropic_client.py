"""Anthropic API client for making Claude requests."""

import os
import anthropic
from typing import List, Dict, Any, Optional
from .config import ANTHROPIC_API_KEY, MODEL

print(f"[DEBUG] API key loaded: {ANTHROPIC_API_KEY[:20] if ANTHROPIC_API_KEY else 'NONE'}...")
print(f"[DEBUG] Model: {MODEL}")

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def query_entity(
    system_prompt: str,
    messages: List[Dict[str, str]],
    max_tokens: int = 250
) -> Optional[str]:
    """
    Query Claude with a specific entity's system prompt.
    """
    print(f"[DEBUG] query_entity called with {len(messages)} messages")
    try:
        print(f"[DEBUG] Making API call to {MODEL}...")
        response = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages
        )
        print(f"[DEBUG] API call successful, got response")
        return response.content[0].text
    except Exception as e:
        print(f"[API ERROR] {type(e).__name__}: {e}")
        return None


def query_entity_sync(
    system_prompt: str,
    messages: List[Dict[str, str]],
    max_tokens: int = 250
) -> Optional[str]:
    """
    Synchronous version of query_entity.
    """
    print(f"[DEBUG] query_entity_sync called with {len(messages)} messages")
    print(f"[DEBUG] System prompt preview: {system_prompt[:100]}...")
    print(f"[DEBUG] Messages: {messages}")
    try:
        print(f"[DEBUG] Making API call to {MODEL}...")
        response = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages
        )
        print(f"[DEBUG] API call successful!")
        print(f"[DEBUG] Response: {response.content[0].text[:100]}...")
        return response.content[0].text
    except Exception as e:
        print(f"[API ERROR] {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None
