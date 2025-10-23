import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  ChatResponse,
} from "./types";

/**
 * Custom error class for API errors with additional context
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Configuration for API client
 */
interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

/**
 * Centralized API Client Singleton
 * Implements SOLID principles:
 * - Single Responsibility: Handles all HTTP communication
 * - Open/Closed: Extensible for new endpoints
 * - Dependency Inversion: Depends on abstractions (interfaces)
 */
class ApiClient {
  private static instance: ApiClient;
  private config: ApiClientConfig;

  private constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
      timeout: 30000, // 30 seconds
      retries: 3,
    };
  }

  /**
   * Get singleton instance (Singleton pattern)
   */
  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Generic fetch wrapper with timeout and error handling
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = this.config.timeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout", 408);
      }
      throw error;
    }
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: unknown;

      try {
        const errorData = await response.json();
        errorDetails = errorData;
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If response is not JSON, use default error message
      }

      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    try {
      return await response.json();
    } catch {
      throw new ApiError("Invalid JSON response", response.status);
    }
  }

  /**
   * Retry logic for failed requests
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries: number = this.config.retries
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.statusCode && error.statusCode < 500) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError!;
  }

  /**
   * GET request
   */
  private async get<T>(endpoint: string): Promise<T> {
    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}${endpoint}`
      );
      return this.handleResponse<T>(response);
    });
  }

  /**
   * POST request
   */
  private async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}${endpoint}`,
        {
          method: "POST",
          body: data ? JSON.stringify(data) : undefined,
        }
      );
      return this.handleResponse<T>(response);
    });
  }

  /**
   * PUT request
   */
  private async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}${endpoint}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      );
      return this.handleResponse<T>(response);
    });
  }

  /**
   * DELETE request
   */
  private async delete<T>(endpoint: string): Promise<T> {
    return this.retryRequest(async () => {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}${endpoint}`,
        {
          method: "DELETE",
        }
      );
      return this.handleResponse<T>(response);
    });
  }

  // ==================== Task API Methods ====================

  /**
   * Get all tasks with pagination
   */
  public async getTasks(skip: number = 0, limit: number = 100): Promise<Task[]> {
    return this.get<Task[]>(`/tasks/?skip=${skip}&limit=${limit}`);
  }

  /**
   * Get a specific task by ID
   */
  public async getTask(id: number): Promise<Task> {
    return this.get<Task>(`/tasks/${id}`);
  }

  /**
   * Create a new task
   */
  public async createTask(data: CreateTaskRequest): Promise<Task> {
    return this.post<Task>("/tasks/", data);
  }

  /**
   * Update an existing task
   */
  public async updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
    return this.put<Task>(`/tasks/${id}`, data);
  }

  /**
   * Delete a task
   */
  public async deleteTask(id: number): Promise<void> {
    return this.delete<void>(`/tasks/${id}`);
  }

  /**
   * Filter tasks by status and/or priority
   */
  public async filterTasks(
    status?: string,
    priority?: string
  ): Promise<Task[]> {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (priority) params.append("priority", priority);

    const queryString = params.toString();
    return this.get<Task[]>(
      `/tasks/filter/${queryString ? `?${queryString}` : ""}`
    );
  }

  // ==================== Chat API Methods ====================

  /**
   * Send a message to the AI agent (HTTP)
   */
  public async sendChatMessage(message: string): Promise<ChatResponse> {
    return this.post<ChatResponse>("/chat/message", { message });
  }

  /**
   * Create WebSocket connection for real-time chat
   */
  public createWebSocket(): WebSocket {
    const wsUrl = this.config.baseUrl.replace(/^http/, "ws");
    return new WebSocket(`${wsUrl}/chat/ws`);
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();
