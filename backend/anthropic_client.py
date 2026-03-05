"""Anthropic API client for making Claude requests."""

import anthropic
from typing import List, Dict, Any, Optional
from .config import ANTHROPIC_API_KEY, MODEL

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


async def query_entity(
    system_prompt: str,
    messages: List[Dict[str, str]],
    max_tokens: int = 250
) -> Optional[str]:
    """
    Query Claude with a specific entity's system prompt.
    """
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages
        )
        return response.content[0].text
    except Exception as e:
        print(f"[API ERROR] {type(e).__name__}")
        return None


def query_entity_sync(
    system_prompt: str,
    messages: List[Dict[str, str]],
    max_tokens: int = 250
) -> Optional[str]:
    """
    Synchronous version of query_entity.
    """
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages
        )
        return response.content[0].text
    except Exception as e:
        print(f"[API ERROR] {type(e).__name__}")
        return None
