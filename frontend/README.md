# AI Task Manager - Frontend

A modern, responsive Next.js application for managing tasks using natural language AI commands. Features real-time WebSocket communication, markdown rendering for AI responses, comprehensive theming system, and beautiful UI components.

## 🚀 Features

### 🤖 Chat Interface
- **Real-time WebSocket communication** with AI agent
- **Markdown rendering** for AI responses with syntax highlighting
- **Message history** with timestamps
- **Connection status indicator**
- **Auto-reconnection** on disconnect
- **HTTP fallback** when WebSocket unavailable
- **Error handling** with user-friendly messages
- **Session management** for conversation continuity

### ✅ Task List View
- **Live task updates** synchronized with chat actions
- **Task grouping** by status (To Do, In Progress, Done)
- **Quick status cycling** with one-click status changes
- **Priority badges** (High, Medium, Low) with color coding
- **Due date display** with overdue warnings
- **Task deletion** with confirmation
- **Responsive design** for all screen sizes

### 🎨 UI/UX
- **Modern design** with shadcn/ui components
- **Dark/Light/System theme support** with persistence
- **Responsive layout** (mobile, tablet, desktop)
- **Smooth animations** and transitions
- **Loading states** and error feedback
- **Accessible** components with ARIA labels

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Markdown Rendering**: react-markdown
- **State Management**: React Hooks
- **API Communication**: Custom API client with WebSocket support

## 📋 Prerequisites

- Node.js 18+ or Bun
- Backend API running on `http://localhost:8000`

## 🔧 Installation

1. **Install dependencies**:
```bash
npm install
# or
bun install
```

2. **Create environment file**:
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with metadata and theme provider
│   ├── page.tsx            # Main application page
│   └── globals.css         # Global styles with CSS variables
├── components/
│   ├── ui/                 # shadcn/ui components
│   │   ├── theme-switcher.tsx  # Dark/Light/System theme toggle
│   │   ├── badge.tsx       # Priority and status badges
│   │   ├── button.tsx      # Interactive buttons
│   │   ├── card.tsx        # Card containers
│   │   ├── dropdown-menu.tsx # Dropdown menus
│   │   ├── input.tsx       # Form inputs
│   │   ├── scroll-area.tsx # Scrollable areas
│   │   └── separator.tsx   # Visual separators
│   ├── chat-interface.tsx  # Chat component with WebSocket
│   └── task-list.tsx       # Task list component
├── lib/
│   ├── api-client.ts       # Centralized API client (Singleton)
│   ├── theme-provider.tsx  # Theme context and provider
│   ├── types.ts            # TypeScript type definitions
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## 🏗️ Architecture

### Design Principles

#### SOLID Principles
- **Single Responsibility**: Each component has one clear purpose
  - `ChatInterface`: Handles chat UI and WebSocket
  - `TaskList`: Manages task display and updates
  - `ApiClient`: Centralized API communication

- **Open/Closed**: Components are extensible without modification
  - New API endpoints can be added to `ApiClient`
  - Components accept props for customization

- **Dependency Inversion**: Components depend on abstractions
  - Components use `apiClient` singleton, not direct fetch calls
  - Type interfaces define contracts

#### DRY (Don't Repeat Yourself)
- **Centralized API client** for all HTTP/WebSocket communication
- **Reusable UI components** from shadcn/ui
- **Shared type definitions** across components
- **Common utility functions** in `lib/utils.ts`

#### KISS (Keep It Simple, Stupid)
- **Simple state management** with React hooks
- **No unnecessary abstractions** or over-engineering
- **Clear component hierarchy**
- **Straightforward data flow**

### Theme System

The application includes a comprehensive theming system:

```typescript
// Theme provider with system preference detection
<ThemeProvider defaultTheme="system" storageKey="theme">
  {/* App content */}
</ThemeProvider>
```

**Features:**
- **Light/Dark/System modes** with automatic system preference detection
- **Persistent storage** in localStorage
- **Smooth transitions** between themes
- **CSS custom properties** for consistent styling
- **Hydration-safe** implementation

### API Client Singleton

The `ApiClient` class provides:
- **Centralized error handling** with custom `ApiError` class
- **Request timeout** (30 seconds default)
- **Automatic retries** with exponential backoff (3 retries)
- **Type-safe methods** for all API endpoints
- **WebSocket management** for real-time chat

```typescript
// Usage example
import { apiClient } from '@/lib/api-client';

// Fetch tasks
const tasks = await apiClient.getTasks();

// Create task
const newTask = await apiClient.createTask({
  title: 'Buy groceries',
  priority: 'high'
});

// WebSocket connection
const ws = apiClient.createWebSocket();
```

## 🎯 Key Features Implementation

### Real-time Chat with WebSocket
- Automatic connection on mount
- Reconnection logic with 3-second delay
- HTTP fallback for reliability
- Message streaming support
- Task update notifications

### Markdown Rendering for AI Messages
AI responses are rendered with full markdown support:
- **Headers** (H1, H2, H3)
- **Text formatting** (bold, italic)
- **Lists** (ordered and unordered)
- **Code blocks** with syntax highlighting
- **Blockquotes**
- **Links** and inline code

The markdown rendering is implemented using react-markdown with custom styling components that match the application's design system.

### Task Management
- Real-time synchronization with backend
- Optimistic UI updates
- Error recovery
- Status cycling (todo → in_progress → done)
- Priority-based color coding

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Flexible grid layout
- Touch-friendly interactions
- Adaptive typography

## 🔌 API Integration

The frontend communicates with the backend through:

- **REST Endpoints**: Task CRUD operations via HTTP
- **Chat Endpoints**: Natural language processing via HTTP POST
- **WebSocket**: Real-time bidirectional communication
- **Session Management**: Persistent conversation context

**Expected Backend API:**
- `GET /api/tasks/` - List all tasks
- `POST /api/tasks/` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/chat/message` - Send chat message (HTTP)
- `WS /api/chat/ws` - Real-time chat connection

## 🎨 Customization

### Theme Customization
The theme system can be customized by modifying the CSS custom properties in `app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    /* ... more variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 84% 4.9%;
    /* ... more variables */
  }
}
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api` |

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📄 License

This project is part of the C4Scale assessment.

## 🤝 Contributing

This is an assessment project. For production use, consider:
- Adding authentication
- Implementing user sessions
- Adding unit tests
- Setting up CI/CD
- Adding analytics
- Implementing caching

---

For backend documentation, see `../backend/README.md`. For full project overview, see `../README.md`.
