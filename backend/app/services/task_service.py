from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from app.models import Task, TaskStatus, TaskPriority
from app.schemas import TaskCreate, TaskUpdate


class TaskService:
    """Service layer for task operations following SOLID principles."""
    
    @staticmethod
    def create_task(db: Session, task_data: TaskCreate) -> Task:
        """Create a new task."""
        task = Task(
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            priority=task_data.priority,
            due_date=task_data.due_date
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    
    @staticmethod
    def get_task_by_id(db: Session, task_id: int) -> Optional[Task]:
        """Get task by ID."""
        return db.query(Task).filter(Task.id == task_id).first()
    
    @staticmethod
    def get_task_by_title(db: Session, title: str) -> Optional[Task]:
        """Get task by title (case-insensitive)."""
        return db.query(Task).filter(Task.title.ilike(f"%{title}%")).first()
    
    @staticmethod
    def list_tasks(db: Session, skip: int = 0, limit: int = 100) -> List[Task]:
        """List all tasks."""
        return db.query(Task).offset(skip).limit(limit).all()
    
    @staticmethod
    def filter_tasks(
        db: Session,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        due_date: Optional[datetime] = None
    ) -> List[Task]:
        """Filter tasks by status, priority, or due date."""
        query = db.query(Task)
        
        if status:
            query = query.filter(Task.status == status)
        if priority:
            query = query.filter(Task.priority == priority)
        if due_date:
            query = query.filter(Task.due_date <= due_date)
        
        return query.all()
    
    @staticmethod
    def update_task(db: Session, task_id: int, task_data: TaskUpdate) -> Optional[Task]:
        """Update a task."""
        task = TaskService.get_task_by_id(db, task_id)
        if not task:
            return None
        
        # Only update fields that are explicitly set and not None
        update_data = task_data.model_dump(exclude_unset=True, exclude_none=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        
        db.commit()
        db.refresh(task)
        return task
    
    @staticmethod
    def delete_task(db: Session, task_id: int) -> bool:
        """Delete a task."""
        task = TaskService.get_task_by_id(db, task_id)
        if not task:
            return False
        
        db.delete(task)
        db.commit()
        return True
