"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, isTomorrow } from "date-fns";

interface TaskListProps {
  refreshTrigger?: number;
}

export function TaskList({ refreshTrigger }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getTasks();
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to load tasks";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and refresh on trigger
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, refreshTrigger]);

  // Update task status
  const updateTaskStatus = async (taskId: number, newStatus: TaskStatus) => {
    try {
      setUpdatingTaskId(taskId);
      setError(null);
      const updatedTask = await apiClient.updateTask(taskId, {
        status: newStatus,
      });

      // Update local state
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (err) {
      console.error("Error updating task:", err);
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to update task";
      setError(errorMessage);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Delete task
  const deleteTask = async (taskId: number) => {
    try {
      setUpdatingTaskId(taskId);
      setError(null);
      await apiClient.deleteTask(taskId);

      // Remove from local state
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
      const errorMessage =
        err instanceof ApiError ? err.message : "Failed to delete task";
      setError(errorMessage);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Get next status in cycle: todo -> in_progress -> done -> todo
  const getNextStatus = (currentStatus: TaskStatus): TaskStatus => {
    const statusCycle: TaskStatus[] = ["todo", "in_progress", "done"];
    const currentIndex = statusCycle.indexOf(currentStatus);
    return statusCycle[(currentIndex + 1) % statusCycle.length];
  };

  // Get status icon
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  // Get priority badge variant
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
    }
  };

  // Format due date
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const isOverdue = isPast(date) && !isToday(date);

    let dateText = "";
    if (isToday(date)) {
      dateText = "Today";
    } else if (isTomorrow(date)) {
      dateText = "Tomorrow";
    } else {
      dateText = format(date, "MMM d, yyyy");
    }

    return (
      <span
        className={cn(
          "text-xs",
          isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
        )}
      >
        {isOverdue && "⚠️ "}
        {dateText}
      </span>
    );
  };

  // Group tasks by status
  const groupedTasks = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{tasks.length} total</Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchTasks}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-auto">
        {/* Error Display */}
        {error && (
          <div className="m-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && tasks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-muted-foreground">
            <div>
              <CheckCircle2 className="mx-auto mb-2 h-12 w-12 opacity-50" />
              <p className="text-sm">No tasks yet</p>
              <p className="mt-1 text-xs">
                Use the chat to create your first task
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-6 p-4">
              {/* To Do Section */}
              {groupedTasks.todo.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Circle className="h-4 w-4" />
                    To Do ({groupedTasks.todo.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.todo.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={updateTaskStatus}
                        onDelete={deleteTask}
                        isUpdating={updatingTaskId === task.id}
                        getStatusIcon={getStatusIcon}
                        getPriorityColor={getPriorityColor}
                        formatDueDate={formatDueDate}
                        getNextStatus={getNextStatus}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* In Progress Section */}
              {groupedTasks.in_progress.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    In Progress ({groupedTasks.in_progress.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.in_progress.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={updateTaskStatus}
                        onDelete={deleteTask}
                        isUpdating={updatingTaskId === task.id}
                        getStatusIcon={getStatusIcon}
                        getPriorityColor={getPriorityColor}
                        formatDueDate={formatDueDate}
                        getNextStatus={getNextStatus}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Done Section */}
              {groupedTasks.done.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    Done ({groupedTasks.done.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks.done.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={updateTaskStatus}
                        onDelete={deleteTask}
                        isUpdating={updatingTaskId === task.id}
                        getStatusIcon={getStatusIcon}
                        getPriorityColor={getPriorityColor}
                        formatDueDate={formatDueDate}
                        getNextStatus={getNextStatus}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// Task Card Component (following SRP)
interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number, newStatus: TaskStatus) => void;
  onDelete: (taskId: number) => void;
  isUpdating: boolean;
  getStatusIcon: (status: TaskStatus) => React.ReactNode;
  getPriorityColor: (priority: TaskPriority) => "destructive" | "default" | "secondary";
  formatDueDate: (dueDate: string | null) => React.ReactNode;
  getNextStatus: (status: TaskStatus) => TaskStatus;
}

function TaskCard({
  task,
  onStatusChange,
  onDelete,
  isUpdating,
  getStatusIcon,
  getPriorityColor,
  formatDueDate,
  getNextStatus,
}: TaskCardProps) {
  return (
    <div
      className={cn(
        "group rounded-lg border bg-card p-4 transition-all hover:shadow-md",
        task.status === "done" && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status Button */}
        <button
          onClick={() => onStatusChange(task.id, getNextStatus(task.status))}
          disabled={isUpdating}
          className="mt-0.5 transition-transform hover:scale-110 disabled:opacity-50"
        >
          {isUpdating ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            getStatusIcon(task.status)
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                "font-medium leading-tight",
                task.status === "done" && "line-through"
              )}
            >
              {task.title}
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => onDelete(task.id)}
              disabled={isUpdating}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {task.status.replace("_", " ")}
            </Badge>
            {task.due_date && formatDueDate(task.due_date)}
          </div>
        </div>
      </div>
    </div>
  );
}
