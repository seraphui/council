"""JSON-based storage for sessions and conversations."""

import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from .config import DATA_DIR


def ensure_data_dir():
    """Ensure the data directory exists."""
    Path(DATA_DIR).mkdir(parents=True, exist_ok=True)


def get_session_path(session_id: str) -> str:
    """Get the file path for a session."""
    return os.path.join(DATA_DIR, f"{session_id}.json")


def create_session(session_id: str, session_type: str) -> Dict[str, Any]:
    """
    Create a new session.
    
    Args:
        session_id: Unique identifier for the session
        session_type: Type of session (council, direct, group, court)
        
    Returns:
        New session dict
    """
    ensure_data_dir()
    
    session = {
        "id": session_id,
        "type": session_type,
        "created_at": datetime.utcnow().isoformat(),
        "messages": []
    }
    
    path = get_session_path(session_id)
    with open(path, 'w') as f:
        json.dump(session, f, indent=2)
    
    return session


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Load a session from storage."""
    path = get_session_path(session_id)
    
    if not os.path.exists(path):
        return None
    
    with open(path, 'r') as f:
        return json.load(f)


def save_session(session: Dict[str, Any]):
    """Save a session to storage."""
    ensure_data_dir()
    
    path = get_session_path(session['id'])
    with open(path, 'w') as f:
        json.dump(session, f, indent=2)


def list_sessions(session_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    List all sessions (metadata only).
    
    Args:
        session_type: Optional filter by session type
        
    Returns:
        List of session metadata dicts
    """
    ensure_data_dir()
    
    sessions = []
    if not os.path.exists(DATA_DIR):
        return sessions
        
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json'):
            path = os.path.join(DATA_DIR, filename)
            with open(path, 'r') as f:
                data = json.load(f)
                if session_type is None or data.get("type") == session_type:
                    sessions.append({
                        "id": data["id"],
                        "type": data.get("type", "unknown"),
                        "created_at": data["created_at"],
                        "message_count": len(data.get("messages", []))
                    })
    
    sessions.sort(key=lambda x: x["created_at"], reverse=True)
    return sessions


def add_message(session_id: str, role: str, content: str, entity: Optional[str] = None):
    """Add a message to a session."""
    session = get_session(session_id)
    if session is None:
        raise ValueError(f"Session {session_id} not found")
    
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.utcnow().isoformat()
    }
    if entity:
        message["entity"] = entity
    
    session["messages"].append(message)
    save_session(session)
