"""Council orchestration - entities respond in sequence."""

import random
from typing import List, Dict, Any
from .anthropic_client import query_entity_sync
from .entities import ENTITIES, ENTITY_ORDER, get_entity, GROUP_CONTEXT, COURT_ROLES
from .config import MAX_SESSION_MESSAGES, RANDOM_TOPICS


def run_council_session() -> Dict[str, Any]:
    """
    Run an autonomous council deliberation on a random topic.
    Uses structured rounds with forced progress:
    - Round 1: All 4 entities give opening positions (4 messages)
    - Round 2: 2 random entities challenge each other (2 messages)
    - Round 3: Remaining 2 entities deliver final positions (2 messages)
    
    Returns:
        Session dict with topic and messages
    """
    topic = random.choice(RANDOM_TOPICS)
    messages = []
    transcript = []
    
    entity_ids = list(ENTITY_ORDER)
    random.shuffle(entity_ids)
    
    # ROUND 1: All 4 give opening positions
    for entity_id in entity_ids:
        entity = get_entity(entity_id)
        
        prompt = f"Council topic: '{topic}'\n\n"
        if transcript:
            prompt += f"Previous statements:\n" + "\n".join(transcript) + "\n\n"
        prompt += "ROUND 1 — Opening position. State your assessment in 2-3 sentences. Take a clear position. Do not repeat what others said."
        
        api_messages = [{"role": "user", "content": prompt}]
        
        response = query_entity_sync(
            entity["system_prompt"] + GROUP_CONTEXT,
            api_messages,
            max_tokens=300
        )
        
        if response:
            messages.append({
                "entity": entity_id,
                "content": response,
                "is_final": False
            })
            transcript.append(f"{entity_id}: {response}")
    
    # ROUND 2: 2 random entities challenge
    challengers = random.sample(entity_ids, 2)
    for entity_id in challengers:
        entity = get_entity(entity_id)
        
        context = "\n".join(transcript)
        prompt = f"Council topic: '{topic}'\n\nFull discussion:\n{context}\n\nROUND 2 — Challenge. Name a specific entity and identify the biggest flaw in their position. Then state what should be done instead. 2-3 sentences max."
        
        api_messages = [{"role": "user", "content": prompt}]
        
        response = query_entity_sync(
            entity["system_prompt"] + GROUP_CONTEXT,
            api_messages,
            max_tokens=300
        )
        
        if response:
            messages.append({
                "entity": entity_id,
                "content": response,
                "is_final": False
            })
            transcript.append(f"{entity_id}: {response}")
    
    # ROUND 3: Remaining 2 deliver final positions
    closers = [eid for eid in entity_ids if eid not in challengers]
    for i, entity_id in enumerate(closers):
        entity = get_entity(entity_id)
        is_final = (i == len(closers) - 1)
        
        context = "\n".join(transcript)
        prompt = f"Council topic: '{topic}'\n\nFull discussion:\n{context}\n\nROUND 3 — Final decision. The Council must conclude. State your final recommendation in 1-2 sentences. Be definitive."
        
        api_messages = [{"role": "user", "content": prompt}]
        
        response = query_entity_sync(
            entity["system_prompt"] + GROUP_CONTEXT,
            api_messages,
            max_tokens=300
        )
        
        if response:
            messages.append({
                "entity": entity_id,
                "content": response,
                "is_final": is_final
            })
            transcript.append(f"{entity_id}: {response}")
    
    return {
        "topic": topic,
        "messages": messages
    }


def direct_chat(entity_id: str, message: str, history: List[Dict[str, str]]) -> str:
    """
    Direct chat with a single entity.
    
    Args:
        entity_id: The entity to chat with
        message: User's message
        history: Previous conversation history
        
    Returns:
        Entity's response
    """
    entity = get_entity(entity_id)
    if not entity:
        return f"Unknown entity: {entity_id}"
    
    api_messages = []
    for h in history:
        api_messages.append({"role": h["role"], "content": h["content"]})
    api_messages.append({"role": "user", "content": message})
    
    response = query_entity_sync(
        entity["system_prompt"],
        api_messages,
        max_tokens=250
    )
    
    return response or "I am unable to respond at this moment."


def group_chat(message: str, history: List[Dict[str, str]], num_entities: int = None) -> List[Dict[str, str]]:
    """
    Group chat with 1-3 random entities responding.
    
    Args:
        message: User's message
        history: Previous conversation history
        num_entities: Number of entities to respond (1-3, random if not specified)
        
    Returns:
        List of entity responses
    """
    if num_entities is None:
        num_entities = random.randint(1, 3)
    num_entities = max(1, min(3, num_entities))
    
    selected_entities = random.sample(ENTITY_ORDER, num_entities)
    
    responses = []
    for entity_id in selected_entities:
        entity = get_entity(entity_id)
        
        api_messages = []
        for h in history:
            api_messages.append({"role": h["role"], "content": h["content"]})
        
        context = f"User asks the Council: {message}\n\nOther entities may also respond. Give your perspective."
        api_messages.append({"role": "user", "content": context})
        
        response = query_entity_sync(
            entity["system_prompt"] + GROUP_CONTEXT,
            api_messages,
            max_tokens=300
        )
        
        if response:
            responses.append({
                "entity": entity_id,
                "content": response
            })
    
    return responses


def court_case(case_description: str) -> Dict[str, Any]:
    """
    Run a court case with assigned roles:
    - ARES: Prosecutor
    - PSYCHE: Defense
    - HERMES: Analyst
    - ATHENA: Judge (delivers verdict)
    
    Args:
        case_description: Description of the case
        
    Returns:
        Court proceedings with all statements and verdict
    """
    proceedings = []
    
    prosecutor_prompt = f"""Case: {case_description}

Present the case against the defendant."""
    
    ares = get_entity("ARES")
    prosecution = query_entity_sync(
        ares["system_prompt"] + "\n\n" + COURT_ROLES["ARES"],
        [{"role": "user", "content": prosecutor_prompt}],
        max_tokens=350
    )
    proceedings.append({
        "role": "prosecutor",
        "entity": "ARES",
        "content": prosecution or "The prosecution rests."
    })
    
    defense_prompt = f"""Case: {case_description}

Prosecution argued: {prosecution}

Defend the accused."""
    
    psyche = get_entity("PSYCHE")
    defense = query_entity_sync(
        psyche["system_prompt"] + "\n\n" + COURT_ROLES["PSYCHE"],
        [{"role": "user", "content": defense_prompt}],
        max_tokens=350
    )
    proceedings.append({
        "role": "defense",
        "entity": "PSYCHE",
        "content": defense or "The defense rests."
    })
    
    analyst_prompt = f"""Case: {case_description}

Prosecution: {prosecution}

Defense: {defense}

Provide your analysis."""
    
    hermes = get_entity("HERMES")
    analysis = query_entity_sync(
        hermes["system_prompt"] + "\n\n" + COURT_ROLES["HERMES"],
        [{"role": "user", "content": analyst_prompt}],
        max_tokens=350
    )
    proceedings.append({
        "role": "analyst",
        "entity": "HERMES",
        "content": analysis or "Analysis inconclusive."
    })
    
    judge_prompt = f"""Case: {case_description}

Prosecution (ARES): {prosecution}

Defense (PSYCHE): {defense}

Analysis (HERMES): {analysis}

Deliver your verdict."""
    
    athena = get_entity("ATHENA")
    verdict = query_entity_sync(
        athena["system_prompt"] + "\n\n" + COURT_ROLES["ATHENA"],
        [{"role": "user", "content": judge_prompt}],
        max_tokens=350
    )
    proceedings.append({
        "role": "judge",
        "entity": "ATHENA",
        "content": verdict or "The court is unable to reach a verdict."
    })
    
    return {
        "case": case_description,
        "proceedings": proceedings
    }
