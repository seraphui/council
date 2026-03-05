"""FastAPI backend for Council of AGI."""

from dotenv import load_dotenv

# Load .env before any other imports that use env vars
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid

from .council import run_council_session, direct_chat, group_chat, court_case
from .entities import get_entity, get_all_entities
from . import storage

app = FastAPI(title="Council of AGI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:3004", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class DirectChatRequest(BaseModel):
    """Request for direct chat with an entity."""
    entity_id: str
    message: str
    history: Optional[List[Dict[str, str]]] = []


class GroupChatRequest(BaseModel):
    """Request for group chat."""
    message: str
    history: Optional[List[Dict[str, str]]] = []
    num_entities: Optional[int] = None


class CourtSubmitRequest(BaseModel):
    """Request to submit a court case."""
    case_description: str


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Council of AGI API"}


@app.get("/api/entities")
async def list_entities():
    """List all council entities."""
    entities = get_all_entities()
    return [
        {
            "id": e["id"],
            "name": e["name"],
            "title": e["title"],
            "icon": e["icon"]
        }
        for e in entities
    ]


@app.get("/api/council/session")
async def council_session():
    """
    Run an autonomous council deliberation on a random topic.
    Entities respond in sequence, capped at 8 messages.
    """
    result = run_council_session()
    
    session_id = str(uuid.uuid4())
    session = storage.create_session(session_id, "council")
    session["topic"] = result["topic"]
    session["messages"] = result["messages"]
    storage.save_session(session)
    
    return {
        "session_id": session_id,
        "topic": result["topic"],
        "messages": result["messages"]
    }


@app.post("/api/chat/direct")
async def chat_direct(request: DirectChatRequest):
    """
    Direct chat with a single entity.
    Send entity_id, message, and optional history.
    """
    entity = get_entity(request.entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity '{request.entity_id}' not found")
    
    response = direct_chat(
        request.entity_id,
        request.message,
        request.history or []
    )
    
    return {
        "entity": request.entity_id,
        "response": response
    }


@app.post("/api/chat/group")
async def chat_group(request: GroupChatRequest):
    """
    Group chat where 1-3 random entities respond.
    """
    responses = group_chat(
        request.message,
        request.history or [],
        request.num_entities
    )
    
    return {
        "responses": responses
    }


@app.post("/api/court/submit")
async def court_submit(request: CourtSubmitRequest):
    """
    Submit a case to the court.
    - ARES: Prosecutor
    - PSYCHE: Defense
    - HERMES: Analyst
    - ATHENA: Judge (verdict)
    """
    result = court_case(request.case_description)
    
    session_id = str(uuid.uuid4())
    session = storage.create_session(session_id, "court")
    session["case"] = result["case"]
    session["proceedings"] = result["proceedings"]
    storage.save_session(session)
    
    return {
        "session_id": session_id,
        "case": result["case"],
        "proceedings": result["proceedings"]
    }


@app.get("/api/sessions")
async def list_sessions(session_type: Optional[str] = None):
    """List all sessions, optionally filtered by type."""
    return storage.list_sessions(session_type)


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    """Get a specific session by ID."""
    session = storage.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
