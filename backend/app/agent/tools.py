from typing import Optional, List, Dict, Any
from datetime import datetime
from langchain.tools import tool
from sqlalchemy.orm import Session
from app.services.task_service import TaskService
from app.schemas import TaskCreate, TaskUpdate
from app.models import TaskStatus, TaskPriority


class TaskTools:
    """LangGraph tools for task management operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.task_service = TaskService()
    
    @staticmethod
    def _parse_status(status_str: Optional[str]) -> Optional[TaskStatus]:
        """Parse status string to TaskStatus enum."""
        if not status_str:
            return None
        status_map = {
            "todo": TaskStatus.TODO,
            "in progress": TaskStatus.IN_PROGRESS,
            "in_progress": TaskStatus.IN_PROGRESS,
            "done": TaskStatus.DONE,
            "completed": TaskStatus.DONE,
            "complete": TaskStatus.DONE,
        }
        return status_map.get(status_str.lower())
    
    @staticmethod
    def _parse_priority(priority_str: Optional[str]) -> Optional[TaskPriority]:
        """Parse priority string to TaskPriority enum."""
        if not priority_str:
            return None
        priority_map = {
            "low": TaskPriority.LOW,
            "medium": TaskPriority.MEDIUM,
            "high": TaskPriority.HIGH,
        }
        return priority_map.get(priority_str.lower())
    
    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string to datetime object."""
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return None
    
    def create_task_tool(
        self,
        title: str,
        description: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new task with the given details.
        
        Args:
            title: Task title (required)
            description: Task description (optional)
            priority: Task priority - low, medium, or high (optional, default: medium)
            due_date: Due date in ISO format (optional)
            status: Task status - todo, in_progress, or done (optional, default: todo)
        
        Returns:
            Dictionary with task details and success status
        """
        try:
            task_data = TaskCreate(
                title=title,
                description=description,
                priority=self._parse_priority(priority) or TaskPriority.MEDIUM,
                due_date=self._parse_date(due_date),
                status=self._parse_status(status) or TaskStatus.TODO
            )
            task = self.task_service.create_task(self.db, task_data)
            return {
                "success": True,
                "message": f"Task '{task.title}' created successfully",
                "task": task.to_dict()
            }
        except Exception as e:
            import traceback
            return {
                "success": False,
                "message": f"Failed to create task: {str(e)}\nTraceback: {traceback.format_exc()}"
            }
    
    def update_task_tool(
        self,
        task_id: Optional[int] = None,
        title_match: Optional[str] = None,
        new_title: Optional[str] = None,
        description: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update an existing task by ID or title match.
        
        Args:
            task_id: Task ID to update (optional if title_match provided)
            title_match: Match task by title (optional if task_id provided)
            new_title: New title for the task (optional)
            description: New description (optional)
            status: New status - todo, in_progress, or done (optional)
            priority: New priority - low, medium, or high (optional)
            due_date: New due date in ISO format (optional)
        
        Returns:
            Dictionary with updated task details and success status
        """
        try:
            # Find task by ID or title
            if task_id:
                task = self.task_service.get_task_by_id(self.db, task_id)
            elif title_match:
                task = self.task_service.get_task_by_title(self.db, title_match)
            else:
                return {
                    "success": False,
                    "message": "Either task_id or title_match must be provided"
                }
            
            if not task:
                # List available tasks to help debug
                all_tasks = self.task_service.list_tasks(self.db)
                task_titles = [t.title for t in all_tasks]
                return {
                    "success": False,
                    "message": f"Task not found. Available tasks: {', '.join(task_titles) if task_titles else 'No tasks found'}. Searched for: '{title_match or task_id}'"
                }
            
            # Build update data
            update_data = TaskUpdate(
                title=new_title,
                description=description,
                status=self._parse_status(status),
                priority=self._parse_priority(priority),
                due_date=self._parse_date(due_date)
            )
            
            updated_task = self.task_service.update_task(self.db, task.id, update_data)
            return {
                "success": True,
                "message": f"Task '{updated_task.title}' updated successfully",
                "task": updated_task.to_dict()
            }
        except Exception as e:
            import traceback
            return {
                "success": False,
                "message": f"Failed to update task: {str(e)}\nTraceback: {traceback.format_exc()}"
            }
    
    def delete_task_tool(
        self,
        task_id: Optional[int] = None,
        title_match: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Delete a task by ID or title match.
        
        Args:
            task_id: Task ID to delete (optional if title_match provided)
            title_match: Match task by title (optional if task_id provided)
        
        Returns:
            Dictionary with success status and message
        """
        try:
            # Find task by ID or title
            if task_id:
                task = self.task_service.get_task_by_id(self.db, task_id)
            elif title_match:
                task = self.task_service.get_task_by_title(self.db, title_match)
            else:
                return {
                    "success": False,
                    "message": "Either task_id or title_match must be provided"
                }
            
            if not task:
                # List available tasks to help debug
                all_tasks = self.task_service.list_tasks(self.db)
                task_titles = [t.title for t in all_tasks]
                return {
                    "success": False,
                    "message": f"Task not found. Available tasks: {', '.join(task_titles) if task_titles else 'No tasks found'}. Searched for: '{title_match or task_id}'"
                }
            
            task_title = task.title
            success = self.task_service.delete_task(self.db, task.id)
            
            if success:
                return {
                    "success": True,
                    "message": f"Task '{task_title}' deleted successfully"
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to delete task"
                }
        except Exception as e:
            import traceback
            return {
                "success": False,
                "message": f"Failed to delete task: {str(e)}\nTraceback: {traceback.format_exc()}"
            }
    
    def list_tasks_tool(self) -> Dict[str, Any]:
        """
        List all active tasks.
        
        Returns:
            Dictionary with list of all tasks
        """
        try:
            tasks = self.task_service.list_tasks(self.db)
            return {
                "success": True,
                "message": f"Found {len(tasks)} task(s)",
                "tasks": [task.to_dict() for task in tasks]
            }
        except Exception as e:
            import traceback
            return {
                "success": False,
                "message": f"Failed to list tasks: {str(e)}\nTraceback: {traceback.format_exc()}"
            }
    
    def filter_tasks_tool(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        due_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Filter tasks by status, priority, or due date.
        
        Args:
            status: Filter by status - todo, in_progress, or done (optional)
            priority: Filter by priority - low, medium, or high (optional)
            due_date: Filter by due date - returns tasks due on or before this date (optional)
        
        Returns:
            Dictionary with filtered list of tasks
        """
        try:
            tasks = self.task_service.filter_tasks(
                self.db,
                status=self._parse_status(status),
                priority=self._parse_priority(priority),
                due_date=self._parse_date(due_date)
            )
            return {
                "success": True,
                "message": f"Found {len(tasks)} task(s) matching filters",
                "tasks": [task.to_dict() for task in tasks]
            }
        except Exception as e:
            import traceback
            return {
                "success": False,
                "message": f"Failed to filter tasks: {str(e)}\nTraceback: {traceback.format_exc()}"
            }
