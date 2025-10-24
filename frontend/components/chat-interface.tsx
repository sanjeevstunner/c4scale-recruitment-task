"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2, AlertCircle } from "lucide-react";
import { apiClient, ApiError } from "@/lib/api-client";
import { Message, ChatResponse } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  onTasksUpdate?: () => void;
}

// Markdown component for rendering AI messages
function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return match ? (
            // Code block
            <pre className="bg-muted border rounded-md p-3 overflow-x-auto text-sm">
              <code className={cn("text-sm", className)} {...props}>
                {children}
              </code>
            </pre>
          ) : (
            // Inline code
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        h1: ({ children }) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic mb-2">
            {children}
          </blockquote>
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function ChatInterface({ onTasksUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    try {
      const ws = apiClient.createWebSocket();
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data: ChatResponse = JSON.parse(event.data);
          
          // Store session ID from response
          if (data.session_id) {
            setSessionId(data.session_id);
          }
          
          // Add assistant message
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: data.response,
            timestamp: new Date(data.timestamp),
          };
          
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);

          // Notify parent component to refresh tasks if tasks were updated
          if (data.tasks && data.tasks.length > 0 && onTasksUpdate) {
            onTasksUpdate();
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
          setError("Failed to parse server response");
          setIsLoading(false);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        setError("Connection error occurred");
        setIsLoading(false);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connectWebSocket();
        }, 3000);
      };
    } catch (err) {
      console.error("Failed to create WebSocket:", err);
      setError("Failed to connect to chat service");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTasksUpdate]);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      if (isConnected && wsRef.current?.readyState === WebSocket.OPEN) {
        // Send via WebSocket with session ID
        wsRef.current.send(JSON.stringify({ 
          message: userMessage.content,
          session_id: sessionId 
        }));
      } else {
        // Fallback to HTTP if WebSocket is not connected
        const response = await apiClient.sendChatMessage(userMessage.content, sessionId);
        
        // Store session ID from response
        if (response.session_id) {
          setSessionId(response.session_id);
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.response,
          timestamp: new Date(response.timestamp),
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);

        // Notify parent component to refresh tasks
        if (response.tasks && response.tasks.length > 0 && onTasksUpdate) {
          onTasksUpdate();
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      const errorMessage = err instanceof ApiError 
        ? err.message 
        : "Failed to send message";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 overflow-hidden" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                <div>
                  <Bot className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p className="text-sm">
                    Start a conversation with the AI assistant
                  </p>
                  <p className="mt-1 text-xs">
                    Try: &quot;Create a task to buy groceries&quot;
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <MarkdownMessage content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap break-all text-sm">
                      {message.content}
                    </p>
                  )}
                  <p className="mt-1 text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Thinking...
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Error Display */}
        {error && (
          <div className="mx-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (e.g., 'Create a task to buy milk')"
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
