import { API_BASE_URL } from "./config";
import {
  DepartmentListItem,
  DepartmentDetail,
  DepartmentCreateRequest,
  DepartmentUpdateRequest,
  DepartmentSearchRequest,
  ProjectListItem,
  ProjectDetail,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectSearchRequest,
  TagListItem,
  TagDetail,
  TagCreateRequest,
  TagUpdateRequest,
  TaskListItem,
  TaskDetail,
  TaskCreateRequest,
  TaskUpdateRequest,
  TaskSearchRequest,
  ProblemDetails,
} from "./types";

// ==================== API ERROR CLASS ====================
export class ApiError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly instance?: string;
  public readonly traceId?: string;
  public readonly errors?: Record<string, string[]>;
  public readonly isNetworkError: boolean;

  constructor(options: {
    status: number;
    title: string;
    message?: string;
    instance?: string;
    traceId?: string;
    errors?: Record<string, string[]>;
    isNetworkError?: boolean;
  }) {
    super(options.message || options.title);
    this.name = "ApiError";
    this.status = options.status;
    this.title = options.title;
    this.instance = options.instance;
    this.traceId = options.traceId;
    this.errors = options.errors;
    this.isNetworkError = options.isNetworkError ?? false;
  }

  /**
   * Returns general operation error if present (e.g. errors.operation or errors.body)
   */
  get operationError(): string | null {
    if (this.errors?.operation && this.errors.operation.length > 0) {
      return this.errors.operation[0];
    }
    if (this.errors?.body && this.errors.body.length > 0) {
      return this.errors.body[0];
    }
    return null;
  }

  /**
   * Get errors for a specific field name (supports camelCase and case-insensitivity)
   */
  getFieldErrors(field: string): string[] {
    if (!this.errors) return [];
    if (this.errors[field]) return this.errors[field];
    const lower = field.toLowerCase();
    for (const [key, value] of Object.entries(this.errors)) {
      if (key.toLowerCase() === lower) {
        return value;
      }
    }
    return [];
  }

  /**
   * First error message of a field
   */
  getFieldError(field: string): string | null {
    const list = this.getFieldErrors(field);
    return list.length > 0 ? list[0] : null;
  }

  /**
   * Friendly general summary for user display
   */
  getUserMessage(): string {
    if (this.isNetworkError) {
      return "Không thể kết nối đến máy chủ API. Vui lòng kiểm tra xem Backend đã khởi chạy chưa.";
    }
    if (this.operationError) {
      return this.operationError;
    }
    if (this.status === 404) {
      return "Không tìm thấy dữ liệu yêu cầu hoặc dữ liệu đã bị xóa.";
    }
    if (this.status === 400 && this.errors && Object.keys(this.errors).length > 0) {
      const messages = Object.values(this.errors).flat();
      if (messages.length > 0) {
        return messages[0];
      }
    }
    return this.title || "Đã xảy ra lỗi khi xử lý yêu cầu.";
  }
}

// ==================== CORE REQUEST FUNCTION ====================
export interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, body, ...rest } = options;

  let url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        query.append(key, String(value));
      }
    }
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const reqHeaders = new Headers(headers);
  // Rule: Do NOT send Authorization header (endpoints are public)
  reqHeaders.delete("Authorization");

  let serializedBody: BodyInit | undefined = undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      serializedBody = body;
    } else {
      reqHeaders.set("Content-Type", "application/json");
      serializedBody = JSON.stringify(body);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: reqHeaders,
      body: serializedBody,
    });
  } catch {
    throw new ApiError({
      status: 0,
      title: "Lỗi kết nối",
      message: "Không thể kết nối đến máy chủ API. Vui lòng kiểm tra mạng hoặc trạng thái Backend.",
      isNetworkError: true,
    });
  }

  // 204 No Content -> Must NOT parse body
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  // Success 200, 201
  if (response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await response.json()) as T;
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  // Error responses (400, 404, 500...)
  let problem: ProblemDetails | null = null;
  try {
    const text = await response.text();
    if (text) {
      problem = JSON.parse(text) as ProblemDetails;
    }
  } catch {
    // Non-JSON response
  }

  const status = response.status;
  const title =
    problem?.title ||
    (status === 404
      ? "Không tìm thấy tài nguyên"
      : status === 400
      ? "Dữ liệu không hợp lệ"
      : `Lỗi máy chủ (${status})`);

  throw new ApiError({
    status,
    title,
    message: problem?.title,
    errors: problem?.errors,
    instance: problem?.instance,
    traceId: problem?.traceId || ((problem as Record<string, unknown>)?.extensions as Record<string, unknown> | undefined)?.traceId as string | undefined,
  });
}

// ==================== TYPED API CLIENT METHODS ====================

export const apiClient = {
  // Generic HTTP helpers
  get: <T>(path: string, params?: Record<string, string | number | boolean | null | undefined>) =>
    request<T>(path, { method: "GET", params }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  delete: (path: string) =>
    request<void>(path, { method: "DELETE" }),

  // Departments (Endpoints 1 - 6)
  departments: {
    getAll: () => request<DepartmentListItem[]>("/departments"),
    getById: (id: number) => request<DepartmentDetail>(`/departments/${id}`),
    search: (params?: DepartmentSearchRequest) =>
      request<DepartmentListItem[]>("/departments/search", { params: { name: params?.name } }),
    create: (data: DepartmentCreateRequest) =>
      request<DepartmentDetail>("/departments", { method: "POST", body: data }),
    update: (id: number, data: DepartmentUpdateRequest) =>
      request<DepartmentDetail>(`/departments/${id}`, { method: "PUT", body: data }),
    delete: (id: number) =>
      request<void>(`/departments/${id}`, { method: "DELETE" }),
  },

  // Projects (Endpoints 7 - 13)
  projects: {
    getAll: () => request<ProjectListItem[]>("/projects"),
    getById: (id: number) => request<ProjectDetail>(`/projects/${id}`),
    getByDepartment: (departmentId: number) =>
      request<ProjectListItem[]>(`/projects/department/${departmentId}`),
    search: (params?: ProjectSearchRequest) =>
      request<ProjectListItem[]>("/projects/search", {
        params: {
          name: params?.name,
          status: params?.status,
          departmentId: params?.departmentId,
        },
      }),
    create: (data: ProjectCreateRequest) =>
      request<ProjectDetail>("/projects", { method: "POST", body: data }),
    update: (id: number, data: ProjectUpdateRequest) =>
      request<ProjectDetail>(`/projects/${id}`, { method: "PUT", body: data }),
    delete: (id: number) =>
      request<void>(`/projects/${id}`, { method: "DELETE" }),
  },

  // Tags (Endpoints 14 - 17)
  tags: {
    getAll: () => request<TagListItem[]>("/tags"),
    create: (data: TagCreateRequest) =>
      request<TagDetail>("/tags", { method: "POST", body: data }),
    update: (id: number, data: TagUpdateRequest) =>
      request<TagDetail>(`/tags/${id}`, { method: "PUT", body: data }),
    delete: (id: number) =>
      request<void>(`/tags/${id}`, { method: "DELETE" }),
  },

  // Tasks (Endpoints 18 - 24)
  tasks: {
    getAll: () => request<TaskListItem[]>("/tasks"),
    getById: (id: number) => request<TaskDetail>(`/tasks/${id}`),
    getByProject: (projectId: number) =>
      request<TaskListItem[]>(`/tasks/project/${projectId}`),
    search: (params?: TaskSearchRequest) =>
      request<TaskListItem[]>("/tasks/search", {
        params: {
          title: params?.title,
          status: params?.status,
          priority: params?.priority,
          projectId: params?.projectId,
          tagId: params?.tagId,
        },
      }),
    create: (data: TaskCreateRequest) =>
      request<TaskDetail>("/tasks", { method: "POST", body: data }),
    update: (id: number, data: TaskUpdateRequest) =>
      request<TaskDetail>(`/tasks/${id}`, { method: "PUT", body: data }),
    delete: (id: number) =>
      request<void>(`/tasks/${id}`, { method: "DELETE" }),
  },
};
