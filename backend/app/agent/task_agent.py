from typing import Dict, Any, List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.tools import StructuredTool
from langgraph.prebuilt import create_react_agent
from sqlalchemy.orm import Session
from app.agent.tools import TaskTools
from app.config import get_settings
from app.models import ChatSession, ChatMessage as DBChatMessage
import uuid


class TaskManagementAgent:
    """LangGraph-based AI agent for task management using Gemini."""
    
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.task_tools = TaskTools(db)
        self.llm = self._initialize_llm()
        self.tools = self._create_tools()
        self.agent = self._create_agent()
    
    def _initialize_llm(self) -> ChatGoogleGenerativeAI:
        """Initialize Gemini LLM."""
        return ChatGoogleGenerativeAI(
            model=self.settings.google_model,
            google_api_key=self.settings.google_api_key,
            temperature=0.7,
            convert_system_message_to_human=True
        )
    
    def _create_tools(self) -> List[StructuredTool]:
        """Create LangGraph tools from task operations."""
        return [
            StructuredTool.from_function(
                func=self.task_tools.create_task_tool,
                name="create_task",
                description="""Create a new task with the given details.
                Use this when the user wants to add, create, or make a new task.
                Parameters:
                - title (required): The task title
                - description (optional): Task description
                - priority (optional): low, medium, or high
                - due_date (optional): Due date in ISO format (YYYY-MM-DD)
                - status (optional): todo, in_progress, or done
                """
            ),
            StructuredTool.from_function(
                func=self.task_tools.update_task_tool,
                name="update_task",
                description="""Update an existing task by ID or title match.
                Use this when the user wants to modify, change, update, or mark a task as done/complete.
                Parameters:
                - task_id (optional): The task ID to update
                - title_match (optional): Match task by title (use if task_id not provided)
                - new_title (optional): New title for the task
                - description (optional): New description
                - status (optional): todo, in_progress, or done
                - priority (optional): low, medium, or high
                - due_date (optional): New due date in ISO format
                """
            ),
            StructuredTool.from_function(
                func=self.task_tools.delete_task_tool,
                name="delete_task",
                description="""Delete a task by ID or title match.
                Use this when the user wants to remove, delete, or cancel a task.
                Parameters:
                - task_id (optional): The task ID to delete
                - title_match (optional): Match task by title (use if task_id not provided)
                """
            ),
            StructuredTool.from_function(
                func=self.task_tools.list_tasks_tool,
                name="list_tasks",
                description="""List all active tasks.
                Use this when the user wants to see all tasks, view their tasks, or get a list of tasks.
                No parameters required.
                """
            ),
            StructuredTool.from_function(
                func=self.task_tools.filter_tasks_tool,
                name="filter_tasks",
                description="""Filter tasks by status, priority, or due date.
                Use this when the user wants to see specific tasks based on criteria.
                Parameters:
                - status (optional): Filter by status - todo, in_progress, or done
                - priority (optional): Filter by priority - low, medium, or high
                - due_date (optional): Filter by due date - returns tasks due on or before this date
                """
            ),
        ]
    
    def _create_agent(self):
        """Create the LangGraph ReAct agent."""
        self.system_message = """You are a helpful AI assistant for task management.
        You help users create, update, delete, list, and filter their tasks through natural language.
        
        Guidelines:
        - Be conversational and friendly
        - Understand user intent even with casual language
        - When users say "mark as done" or "complete", update the task status to "done"
        - When users say "show me my tasks" or similar, list all tasks
        - When users mention priority or status filters, use the filter_tasks tool
        - Always confirm actions taken and provide clear feedback
        - If a task title is ambiguous, ask for clarification
        - Format task information clearly in your responses
        
        IMPORTANT - Error Handling:
        - When a tool returns an error (success: False), you MUST include the FULL error message from the tool in your response
        - Do NOT hide or simplify error messages - users need to see the complete details for debugging
        - If the error message includes a list of available tasks, show that list to the user
        - If the error message includes a traceback, include it in your response
        - Be helpful but always preserve the technical details from tool errors
        
        Available task statuses: todo, in_progress, done
        Available priorities: low, medium, high
        """
        
        return create_react_agent(
            self.llm,
            self.tools
        )
    
    def _get_or_create_session(self, session_id: str = None) -> ChatSession:
        """Get existing session or create a new one."""
        if session_id:
            session = self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
            if session:
                return session
        
        # Create new session
        new_session = ChatSession(id=str(uuid.uuid4()))
        self.db.add(new_session)
        self.db.commit()
        return new_session
    
    def _load_conversation_history(self, session_id: str) -> List[tuple]:
        """Load conversation history from database."""
        messages = self.db.query(DBChatMessage).filter(
            DBChatMessage.session_id == session_id
        ).order_by(DBChatMessage.timestamp).all()
        
        history = []
        for msg in messages:
            if msg.role in ['user', 'assistant', 'system']:
                history.append((msg.role, msg.content))
        
        return history
    
    def _save_message(self, session_id: str, role: str, content: str):
        """Save a message to the database."""
        message = DBChatMessage(
            session_id=session_id,
            role=role,
            content=content
        )
        self.db.add(message)
        self.db.commit()
    
    def process_message(self, message: str, session_id: str = None) -> Dict[str, Any]:
        """
        Process a user message and return the agent's response.
        
        Args:
            message: User's natural language message
            session_id: Optional session ID for conversation continuity
        
        Returns:
            Dictionary containing the response, session_id, and any relevant task data
        """
        try:
            # Get or create session
            session = self._get_or_create_session(session_id)
            session_id = session.id
            
            # Save user message
            self._save_message(session_id, "user", message)
            
            # Load conversation history
            history = self._load_conversation_history(session_id)
            
            # Build message list with system message, history, and current message
            messages = [("system", self.system_message)]
            
            # Add conversation history (excluding the current message we just saved)
            if len(history) > 1:  # More than just the current message
                messages.extend(history[:-1])  # Exclude the last message (current one)
            
            # Add current user message
            messages.append(("user", message))
            
            # Invoke the agent
            result = self.agent.invoke({
                "messages": messages
            })
            
            # Log the result for debugging
            import logging
            import json
            
            # Log all messages including tool responses
            result_messages = result.get("messages", [])
            for i, msg in enumerate(result_messages):
                msg_type = getattr(msg, 'type', 'unknown')
                if msg_type == 'tool':
                    logging.info(f"Tool response {i}: {msg.content}")
                elif msg_type == 'ai':
                    content = getattr(msg, 'content', '')
                    logging.info(f"AI message {i}: {content[:200]}...")
            
            logging.info(f"Total messages in result: {len(result_messages)}")
            
            # Extract the final response
            if result_messages:
                final_message = result_messages[-1]
                response_content = final_message.content if hasattr(final_message, 'content') else str(final_message)
                
                # Handle case where content is a list (sometimes happens with LangChain)
                if isinstance(response_content, list):
                    # Join list items or extract text from structured content
                    response_text = ""
                    for item in response_content:
                        if isinstance(item, str):
                            response_text += item
                        elif isinstance(item, dict) and 'text' in item:
                            response_text += item['text']
                        else:
                            response_text += str(item)
                else:
                    response_text = response_content
            else:
                response_text = "I processed your request."
            
            # Save assistant response
            self._save_message(session_id, "assistant", response_text)
            
            # Extract task data from tool calls if any
            tasks_data = self._extract_tasks_from_result(result)
            
            return {
                "success": True,
                "response": response_text,
                "session_id": session_id,
                "tasks": tasks_data
            }
        except Exception as e:
            import traceback
            import logging
            logging.error(f"Error processing message: {str(e)}\n{traceback.format_exc()}")
            return {
                "success": False,
                "response": f"I encountered an error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}",
                "session_id": session_id if session_id else None,
                "tasks": None
            }
    
    def _extract_tasks_from_result(self, result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract task data from agent result."""
        import json
        tasks = []
        messages = result.get("messages", [])
        
        for message in messages:
            # Check if this is a ToolMessage (response from a tool call)
            if hasattr(message, 'type') and message.type == 'tool':
                try:
                    # Parse the tool response content
                    content = message.content
                    if isinstance(content, str):
                        # Try to parse as JSON
                        tool_result = json.loads(content)
                    elif isinstance(content, dict):
                        tool_result = content
                    else:
                        continue
                    
                    # Extract task data from tool result
                    if 'task' in tool_result and tool_result['task']:
                        # Single task (create, update)
                        tasks.append(tool_result['task'])
                    elif 'tasks' in tool_result and tool_result['tasks']:
                        # Multiple tasks (list, filter)
                        tasks.extend(tool_result['tasks'])
                except (json.JSONDecodeError, AttributeError, KeyError):
                    continue
        
        return tasks
