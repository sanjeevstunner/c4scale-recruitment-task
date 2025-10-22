# Quick Start Guide - Backend

Get the AI-Powered Task Management Agent backend running in 5 minutes!

## Prerequisites

- Python 3.10+
- PostgreSQL 14+
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

## Installation Steps

### 1. Setup Environment

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

Required variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
GOOGLE_API_KEY=your_gemini_api_key_here
ENVIRONMENT=development
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb taskmanager

# Or using psql:
psql -U postgres
CREATE DATABASE taskmanager;
\q
```

### 4. Run the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **WebSocket**: ws://localhost:8000/api/chat/ws

## Quick Test

### Using cURL

```bash
# Create a task
curl -X POST "http://localhost:8000/api/tasks/" \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Task", "priority": "high"}'

# List tasks
curl -X GET "http://localhost:8000/api/tasks/"

# Chat with AI agent
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all my tasks"}'
```

### Using Browser

1. Open http://localhost:8000/docs
2. Try the interactive API documentation
3. Test the `/api/tasks/` endpoints
4. Test the `/api/chat/message` endpoint

## 🚀 What You Can Do

### Task Management via Chat
```bash
# Create tasks
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a high priority task to review code by tomorrow"}'

# Update tasks
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Mark task 1 as done"}'

# Filter tasks
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all high priority tasks"}'
```

### API Testing Examples
- **REST API**: Create, read, update, delete tasks via HTTP endpoints
- **Chat Interface**: Natural language commands via `/api/chat/message`
- **WebSocket**: Real-time communication via `/api/chat/ws`
- **Filtering**: Query tasks by status and priority

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

## Next Steps

- Read [README.md](README.md) for comprehensive backend documentation
- Explore the API documentation at http://localhost:8000/docs
- Check the main project README at `../README.md` for full-stack overview
