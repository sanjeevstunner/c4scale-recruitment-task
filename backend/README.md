# AI-Powered Task Management Agent - Backend

A powerful FastAPI backend with an AI agent powered by LangGraph and Google's Gemini API. The agent handles all task operations through natural language via chat interface, with real-time WebSocket communication.

## 🏗️ Architecture

### Tech Stack
- **Backend Framework**: FastAPI with async support
- **AI Agent**: LangGraph with Gemini Pro
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Real-time Communication**: WebSocket with HTTP fallback
- **API Documentation**: OpenAPI/Swagger
- **State Management**: Centralized service layer

### Design Principles
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY**: Don't Repeat Yourself - reusable service layer and tools
- **KISS**: Keep It Simple, Stupid - clean, maintainable code structure
- **Separation of Concerns**: Clear API, service, and agent layers

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration management
│   ├── database.py             # Database connection and session
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   ├── api/
│   │   ├── __init__.py
│   │   ├── tasks.py            # Task CRUD endpoints
│   │   └── chat.py             # Chat and WebSocket endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   └── task_service.py     # Business logic layer
│   └── agent/
│       ├── __init__.py
│       ├── tools.py            # LangGraph tools
│       └── task_agent.py       # AI agent implementation
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Python 3.10+
- PostgreSQL 14+
- Google Gemini API Key

### Installation

1. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
GOOGLE_API_KEY=your_gemini_api_key_here
ENVIRONMENT=development
```

4. **Set up PostgreSQL database**
```bash
# Create database
createdb taskmanager

# Or using psql
psql -U postgres
CREATE DATABASE taskmanager;
\q
```

5. **Run the application**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **WebSocket**: ws://localhost:8000/api/chat/ws

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Task Schema

```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "todo",
  "priority": "medium",
  "due_date": "2025-10-25T10:00:00",
  "created_at": "2025-10-21T12:48:07",
  "updated_at": "2025-10-21T12:48:07"
}
```

**Status Values**: `todo`, `in_progress`, `done`  
**Priority Values**: `low`, `medium`, `high`

---

## 🔌 REST API Endpoints

### 1. Create Task
**POST** `/api/tasks/`

Create a new task.

**Request Body:**
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "todo",
  "priority": "high",
  "due_date": "2025-10-25T10:00:00"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "todo",
  "priority": "high",
  "due_date": "2025-10-25T10:00:00",
  "created_at": "2025-10-21T12:48:07",
  "updated_at": "2025-10-21T12:48:07"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/tasks/" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "priority": "high"
  }'
```

---

### 2. List All Tasks
**GET** `/api/tasks/`

Retrieve all tasks with pagination.

**Query Parameters:**
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records (default: 100)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "todo",
    "priority": "high",
    "due_date": "2025-10-25T10:00:00",
    "created_at": "2025-10-21T12:48:07",
    "updated_at": "2025-10-21T12:48:07"
  }
]
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/tasks/?skip=0&limit=10"
```

---

### 3. Get Task by ID
**GET** `/api/tasks/{task_id}`

Retrieve a specific task.

**Path Parameters:**
- `task_id`: Task ID (integer)

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "todo",
  "priority": "high",
  "due_date": "2025-10-25T10:00:00",
  "created_at": "2025-10-21T12:48:07",
  "updated_at": "2025-10-21T12:48:07"
}
```

**Error Response:** `404 Not Found`
```json
{
  "detail": "Task not found"
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/tasks/1"
```

---

### 4. Update Task
**PUT** `/api/tasks/{task_id}`

Update an existing task. All fields are optional.

**Path Parameters:**
- `task_id`: Task ID (integer)

**Request Body:**
```json
{
  "title": "Buy groceries and cook dinner",
  "status": "in_progress",
  "priority": "high"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "title": "Buy groceries and cook dinner",
  "description": "Milk, eggs, bread",
  "status": "in_progress",
  "priority": "high",
  "due_date": "2025-10-25T10:00:00",
  "created_at": "2025-10-21T12:48:07",
  "updated_at": "2025-10-21T13:30:00"
}
```

**cURL Example:**
```bash
curl -X PUT "http://localhost:8000/api/tasks/1" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done"
  }'
```

---

### 5. Delete Task
**DELETE** `/api/tasks/{task_id}`

Delete a task.

**Path Parameters:**
- `task_id`: Task ID (integer)

**Response:** `204 No Content`

**Error Response:** `404 Not Found`

**cURL Example:**
```bash
curl -X DELETE "http://localhost:8000/api/tasks/1"
```

---

### 6. Filter Tasks
**GET** `/api/tasks/filter/`

Filter tasks by status and/or priority.

**Query Parameters:**
- `status` (optional): Filter by status (`todo`, `in_progress`, `done`)
- `priority` (optional): Filter by priority (`low`, `medium`, `high`)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "status": "todo",
    "priority": "high",
    ...
  }
]
```

**cURL Examples:**
```bash
# Filter by status
curl -X GET "http://localhost:8000/api/tasks/filter/?status=todo"

# Filter by priority
curl -X GET "http://localhost:8000/api/tasks/filter/?priority=high"

# Filter by both
curl -X GET "http://localhost:8000/api/tasks/filter/?status=todo&priority=high"
```

---

## 💬 Chat API Endpoints

### 7. Send Chat Message (HTTP)
**POST** `/api/chat/message`

Send a message to the AI agent via HTTP.

**Request Body:**
```json
{
  "message": "Create a task to buy groceries with high priority"
}
```

**Response:** `200 OK`
```json
{
  "response": "I've created a task titled 'Buy groceries' with high priority.",
  "tasks": [
    {
      "id": 1,
      "title": "Buy groceries",
      "status": "todo",
      "priority": "high",
      ...
    }
  ],
  "timestamp": "2025-10-21T12:48:07"
}
```

**cURL Example:**
```bash
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me all my high priority tasks"
  }'
```

---

### 8. WebSocket Chat
**WebSocket** `/api/chat/ws`

Real-time chat with the AI agent with session management support.

**Connection URL:**
```
ws://localhost:8000/api/chat/ws
```

**Client Message Format:**
```json
{
  "message": "Create a task to buy groceries",
  "session_id": "optional-session-id"
}
```

**Server Response Format:**
```json
{
  "response": "I've created a task titled 'Buy groceries'.",
  "tasks": [...],
  "session_id": "generated-session-id",
  "timestamp": "2025-10-21T12:48:07"
}
```

**JavaScript Example:**
```javascript
const ws = new WebSocket('ws://localhost:8000/api/chat/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    message: "Create a task to buy groceries"
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Agent:', data.response);
  console.log('Tasks:', data.tasks);
  console.log('Session ID:', data.session_id);
};
```

**Python Example:**
```python
import asyncio
import websockets
import json

async def chat():
    uri = "ws://localhost:8000/api/chat/ws"
    async with websockets.connect(uri) as websocket:
        # Send message
        await websocket.send(json.dumps({
            "message": "List all my tasks"
        }))

        # Receive response
        response = await websocket.recv()
        data = json.loads(response)
        print(f"Agent: {data['response']}")
        print(f"Session: {data['session_id']}")

asyncio.run(chat())
```

---

## 🤖 AI Agent Natural Language Examples

The AI agent understands natural language commands. Here are examples:

### Creating Tasks
```
"Create a task to buy groceries"
"Add a new task: finish the report by Friday"
"Make a high priority task to call the client"
"Create a task called 'Review code' with medium priority due tomorrow"
```

### Listing Tasks
```
"Show me all my tasks"
"List my tasks"
"What tasks do I have?"
"Display all tasks"
```

### Filtering Tasks
```
"Show me high priority tasks"
"List all completed tasks"
"What tasks are in progress?"
"Show me tasks that are done"
```

### Updating Tasks
```
"Mark 'Buy groceries' as done"
"Update task 1 to high priority"
"Change the status of 'Review code' to in progress"
"Mark task 2 as complete"
```

### Deleting Tasks
```
"Delete the task 'Buy groceries'"
"Remove task 1"
"Delete the task about groceries"
```

---

## 🛠️ AI Agent Tools

The LangGraph agent has access to these tools:

### 1. create_task
Creates a new task with title, description, priority, due date, and status.

### 2. update_task
Updates an existing task by ID or title match. Supports partial updates.

### 3. delete_task
Deletes a task by ID or title match.

### 4. list_tasks
Returns all active tasks.

### 5. filter_tasks
Filters tasks by status, priority, or due date.

---

## 🧪 Testing the API

### Using cURL

**Create a task:**
```bash
curl -X POST "http://localhost:8000/api/tasks/" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "priority": "high"}'
```

**Chat with agent:**
```bash
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a task to test the API"}'
```

### Using Python

```python
import requests

# Create a task
response = requests.post(
    "http://localhost:8000/api/tasks/",
    json={
        "title": "Test Task",
        "description": "Testing the API",
        "priority": "high"
    }
)
print(response.json())

# Chat with agent
response = requests.post(
    "http://localhost:8000/api/chat/message",
    json={"message": "Show me all high priority tasks"}
)
print(response.json())
```

### Using Postman

1. Import the OpenAPI spec from `http://localhost:8000/openapi.json`
2. Or use the interactive docs at `http://localhost:8000/docs`

---

## 🔒 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `GOOGLE_API_KEY` | Gemini API key | Yes | - |
| `ENVIRONMENT` | Environment (development/production) | No | development |

---

## 🏛️ Database Schema

### tasks Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-incrementing ID |
| title | VARCHAR | NOT NULL | Task title |
| description | TEXT | NULLABLE | Task description |
| status | ENUM | NOT NULL | todo, in_progress, done |
| priority | ENUM | NOT NULL | low, medium, high |
| due_date | TIMESTAMP | NULLABLE | Due date |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

---

## 🚦 Error Handling

### HTTP Status Codes

- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST request
- `204 No Content`: Successful DELETE request
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "detail": "Error message description"
}
```

---

## 📊 Performance Considerations

- **Database Connection Pooling**: Configured via SQLAlchemy
- **Async Support**: FastAPI async endpoints for better concurrency
- **WebSocket**: Real-time bidirectional communication
- **Pagination**: List endpoints support skip/limit parameters

---

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` file
2. **API Keys**: Store securely in environment variables
3. **CORS**: Configure `allow_origins` for production
4. **Database**: Use strong passwords and connection encryption
5. **Input Validation**: Pydantic schemas validate all inputs

---

## 📝 Development Notes

### Adding New Tools

1. Add method to `TaskTools` class in `app/agent/tools.py`
2. Register tool in `TaskManagementAgent._create_tools()` in `app/agent/task_agent.py`
3. Update agent system message with tool description

### Database Migrations

For production, use Alembic for database migrations:

```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U user -d taskmanager
```

### Gemini API Issues
- Verify API key is correct
- Check API quota and billing
- Ensure network connectivity

### WebSocket Connection Issues
- Check firewall settings
- Verify WebSocket support in client
- Test with simple WebSocket client first

---

## 📄 License

This project is for assessment purposes.

---

## 👥 Support

For issues or questions, please refer to the API documentation at `/docs` endpoint.
