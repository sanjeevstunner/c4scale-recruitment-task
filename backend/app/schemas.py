from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models import TaskStatus, TaskPriority


class TaskBase(BaseModel):
    """Base task schema."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.TODO
    priority: Optional[TaskPriority] = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None


class TaskCreate(TaskBase):
    """Schema for creating a task."""
    pass


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None


class TaskResponse(TaskBase):
    """Schema for task response."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    """Schema for chat messages."""
    message: str
    session_id: Optional[str] = None
    timestamp: Optional[datetime] = None


class ChatResponse(BaseModel):
    """Schema for chat response."""
    response: str
    session_id: str
    tasks: Optional[list[TaskResponse]] = None
    timestamp: datetime


class ChatHistoryMessage(BaseModel):
    """Schema for chat history messages."""
    role: str
    content: str
    timestamp: datetime
    
    class Config:
        from_attributes = True
