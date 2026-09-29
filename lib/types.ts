// PRN232 Assignment 1 - TaskTrack Types
// Aligned with API contract and Backend DTOs

// ==================== ENUMS ====================
export enum ProjectStatus {
  NotStarted = 0,
  InProgress = 1,
  Completed = 2,
  OnHold = 3,
}

export enum TaskStatus {
  ToDo = 0,
  InProgress = 1,
  Done = 2,
  Cancelled = 3,
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3,
}

// ==================== PROBLEM DETAILS (RFC 7807) ====================
export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  instance?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

// ==================== DEPARTMENT ====================
export interface DepartmentListItem {
  departmentId: number;
  departmentName: string;
  departmentDescription: string;
  isActive: boolean;
}

export interface DepartmentDetail extends DepartmentListItem {
  projects: ProjectListItem[];
}

export interface DepartmentCreateRequest {
  departmentName: string;
  departmentDescription: string;
  isActive?: boolean;
}

export interface DepartmentUpdateRequest {
  departmentName: string;
  departmentDescription: string;
  isActive: boolean;
}

export interface DepartmentSearchRequest {
  name?: string;
}

// ==================== PROJECT ====================
export interface ProjectListItem {
  projectId: number;
  projectName: string;
  description?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  status: ProjectStatus;
  departmentId: number;
  departmentName: string;
  isActive: boolean;
  createdDate: string; // ISO date string
}

export interface ProjectDetail extends ProjectListItem {
  tasks: TaskListItem[];
}

export interface ProjectCreateRequest {
  projectName: string;
  description?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  status: ProjectStatus;
  departmentId: number;
  isActive?: boolean;
}

export interface ProjectUpdateRequest {
  projectName: string;
  description?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD
  status: ProjectStatus;
  departmentId: number;
  isActive: boolean;
}

export interface ProjectSearchRequest {
  name?: string;
  status?: ProjectStatus;
  departmentId?: number;
}

// ==================== TAG ====================
export interface TagListItem {
  tagId: number;
  tagName: string;
  color?: string | null; // #RRGGBB or null
}

export type TagDetail = TagListItem;

export interface TagCreateRequest {
  tagName: string;
  color?: string | null;
}

export interface TagUpdateRequest {
  tagName: string;
  color?: string | null;
}

// ==================== TASK ====================
export interface TaskListItem {
  taskId: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null; // YYYY-MM-DD
  projectId: number;
  isActive: boolean;
  createdDate: string; // ISO date string
  modifiedDate?: string | null; // ISO date string
  tags: TagListItem[];
}

export type TaskDetail = TaskListItem;

export interface TaskCreateRequest {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  projectId: number;
  isActive?: boolean;
  tagIds?: number[];
}

export interface TaskUpdateRequest {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: number;
  isActive: boolean;
  tagIds?: number[];
}

export interface TaskSearchRequest {
  title?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: number;
  tagId?: number;
}
