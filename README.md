# AI Task Manager

A modern full-stack task management application with an AI agent powered by LangGraph and Google's Gemini API. The system consists of a FastAPI backend with real-time WebSocket communication and a Next.js frontend with comprehensive theming and markdown rendering.

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI with async support, SQLAlchemy ORM, PostgreSQL
- **Frontend**: Next.js 16 with TypeScript, TailwindCSS, shadcn/ui
- **AI Agent**: LangGraph with Gemini Pro for natural language task management
- **Real-time**: WebSocket with HTTP fallback
- **Database**: PostgreSQL with comprehensive task management features

### Project Structure
```
c4scale-assessment/
├── backend/                 # FastAPI application with AI agent
│   ├── app/
│   │   ├── agent/          # LangGraph AI agent implementation
│   │   ├── api/            # REST and WebSocket endpoints
│   │   └── services/       # Business logic layer
│   ├── README.md           # Backend-specific documentation
│   └── QUICKSTART.md       # Backend setup guide
├── frontend/               # Next.js web application
│   ├── app/                # Next.js app router
│   ├── components/         # React components with UI library
│   ├── lib/                # Utilities and API client
│   └── README.md           # Frontend-specific documentation
└── README.md               # This file - project overview
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Google Gemini API Key

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
createdb taskmanager
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

**Access the applications:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🎯 Features

### 🤖 AI-Powered Task Management
- **Natural Language Processing**: Create, update, and manage tasks using conversational commands
- **Intelligent Agent**: LangGraph-powered AI that understands context and intent
- **Real-time Updates**: WebSocket communication for instant task synchronization

### 🎨 Modern Frontend
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Theme System**: Light/Dark/System modes with persistent preferences
- **Rich Text Rendering**: Markdown support for AI responses with syntax highlighting
- **Interactive Components**: Modern UI with shadcn/ui and Radix primitives

### 🔧 Robust Backend
- **Async Architecture**: High-performance FastAPI with async endpoints
- **Type Safety**: Full Pydantic validation and SQLAlchemy models
- **WebSocket Support**: Real-time bidirectional communication
- **Comprehensive API**: RESTful endpoints with OpenAPI documentation

## 📚 Documentation

### Project-Specific Guides
- **[Backend README](./backend/README.md)** - Complete backend architecture, API documentation, and development guide
- **[Backend Quickstart](./backend/QUICKSTART.md)** - Fast backend setup and testing instructions
- **[Frontend README](./frontend/README.md)** - Frontend architecture, component guide, and development documentation

### Getting Started
1. **Backend First**: Follow the [backend quickstart](./backend/QUICKSTART.md) to get the API running
2. **Frontend Setup**: Use the [frontend README](./frontend/README.md) for detailed frontend instructions
3. **Full Stack**: Run both applications for the complete experience

## 🧪 Testing & Development

### Backend Testing
```bash
# API Testing via cURL
curl -X POST "http://localhost:8000/api/chat/message" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a task to review the documentation"}'

# Interactive API Documentation
open http://localhost:8000/docs
```

### Frontend Testing
```bash
# Frontend Development
cd frontend
npm run dev

# Test Commands:
# "Create a high priority task to review code"
# "Show me all my tasks"
# "Mark task 1 as completed"
```

## 🚦 Development Workflow

1. **Start Backend**: `cd backend && uvicorn app.main:app --reload`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Test Integration**: Use the frontend chat interface
4. **API Development**: Use http://localhost:8000/docs for API testing
5. **Theme Testing**: Toggle between light/dark modes in the frontend

## 🔧 Configuration

### Backend Environment
```env
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
GOOGLE_API_KEY=your_gemini_api_key_here
ENVIRONMENT=development
```

### Frontend Environment
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🤝 Integration

The backend and frontend communicate through:
- **REST API**: Standard HTTP endpoints for CRUD operations
- **WebSocket**: Real-time chat and task updates
- **Session Management**: Persistent conversation context
- **Error Handling**: Graceful fallbacks and user feedback

## 📈 Production Considerations

- **Database Migrations**: Use Alembic for schema versioning
- **Authentication**: Add user sessions and API authentication
- **Deployment**: Docker containers for both services
- **Monitoring**: Add logging and performance monitoring
- **Scaling**: Consider load balancing and caching strategies

## 📄 License

This project is part of the C4Scale assessment.

---

For detailed implementation details, see the specific README files in each project directory.
