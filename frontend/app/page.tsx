"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { TaskList } from "@/components/task-list";
import { CheckSquare } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export default function Home() {
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0);

  const handleTasksUpdate = () => {
    setTaskRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <CheckSquare className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Task Manager</h1>
                <p className="text-xs text-muted-foreground">
                  Manage tasks with natural language
                </p>
              </div>
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Chat Interface - Left Column */}
          <div className="h-[calc(100vh-180px)] min-h-[500px] overflow-hidden">
            <ChatInterface onTasksUpdate={handleTasksUpdate} />
          </div>

          {/* Task List - Right Column */}
          <div className="h-[calc(100vh-180px)] min-h-[500px] overflow-hidden">
            <TaskList refreshTrigger={taskRefreshTrigger} />
          </div>
        </div>
      </main>

    </div>
  );
}
