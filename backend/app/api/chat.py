from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
import json
from app.database import get_db
from app.schemas import ChatMessage, ChatResponse, ChatHistoryMessage
from app.agent.task_agent import TaskManagementAgent
from app.models import ChatSession, ChatMessage as DBChatMessage

router = APIRouter(prefix="/chat", tags=["chat"])


class ConnectionManager:
    """Manages WebSocket connections."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept and store a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        self.active_connections.remove(websocket)
    
    async def send_message(self, message: dict, websocket: WebSocket):
        """Send a message to a specific WebSocket."""
        await websocket.send_text(json.dumps(message))
    
    async def broadcast(self, message: dict):
        """Broadcast a message to all connected clients."""
        for connection in self.active_connections:
            await connection.send_text(json.dumps(message))


manager = ConnectionManager()


@router.get("/history/{session_id}", response_model=List[ChatHistoryMessage])
async def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    """
    Retrieve chat history for a specific session.
    """
    # Check if session exists
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get all messages for this session
    messages = db.query(DBChatMessage).filter(
        DBChatMessage.session_id == session_id
    ).order_by(DBChatMessage.timestamp).all()
    
    return [ChatHistoryMessage(
        role=msg.role,
        content=msg.content,
        timestamp=msg.timestamp
    ) for msg in messages]


@router.post("/message", response_model=ChatResponse)
async def send_message(message: ChatMessage, db: Session = Depends(get_db)):
    """
    Send a message to the AI agent via HTTP POST.
    Alternative to WebSocket for simpler integrations.
    Supports session-based conversation history.
    """
    agent = TaskManagementAgent(db)
    result = agent.process_message(message.message, session_id=message.session_id)
    
    return ChatResponse(
        response=result["response"],
        session_id=result["session_id"],
        tasks=result.get("tasks"),
        timestamp=datetime.now()
    )


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time chat with the AI agent.
    Supports session-based conversation history.
    
    Message format (client -> server):
    {
        "message": "create a task to buy groceries",
        "session_id": "optional-session-uuid"
    }
    
    Response format (server -> client):
    {
        "response": "I've created a task...",
        "session_id": "session-uuid",
        "tasks": [...],
        "timestamp": "2025-10-21T12:48:07"
    }
    """
    await manager.connect(websocket)
    
    # Get database session for this connection
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        agent = TaskManagementAgent(db)
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process message with agent (with session support)
            result = agent.process_message(
                message_data.get("message", ""),
                session_id=message_data.get("session_id")
            )
            
            # Send response back to client
            response = {
                "response": result["response"],
                "session_id": result["session_id"],
                "tasks": result.get("tasks"),
                "timestamp": datetime.now().isoformat()
            }
            
            await manager.send_message(response, websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        import traceback
        error_response = {
            "response": f"Error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}",
            "session_id": None,
            "tasks": None,
            "timestamp": datetime.now().isoformat()
        }
        try:
            await manager.send_message(error_response, websocket)
        except:
            pass
        manager.disconnect(websocket)
    finally:
        try:
            db_gen.close()
        except:
            pass
