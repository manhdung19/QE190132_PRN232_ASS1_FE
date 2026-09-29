import { ProjectStatus, TaskStatus, TaskPriority } from "./types";

// ==================== PROJECT STATUS ====================
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.NotStarted]: "Chưa bắt đầu",
  [ProjectStatus.InProgress]: "Đang thực hiện",
  [ProjectStatus.Completed]: "Đã hoàn thành",
  [ProjectStatus.OnHold]: "Tạm dừng",
};

export const PROJECT_STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: ProjectStatus.NotStarted, label: "Chưa bắt đầu" },
  { value: ProjectStatus.InProgress, label: "Đang thực hiện" },
  { value: ProjectStatus.Completed, label: "Đã hoàn thành" },
  { value: ProjectStatus.OnHold, label: "Tạm dừng" },
];

export const PROJECT_STATUS_STYLES: Record<ProjectStatus, { bg: string; text: string; border: string; dot: string }> = {
  [ProjectStatus.NotStarted]: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  [ProjectStatus.InProgress]: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  [ProjectStatus.Completed]: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  [ProjectStatus.OnHold]: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

// ==================== TASK STATUS ====================
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.ToDo]: "Cần làm",
  [TaskStatus.InProgress]: "Đang làm",
  [TaskStatus.Done]: "Hoàn thành",
  [TaskStatus.Cancelled]: "Đã hủy",
};

export const TASK_STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: TaskStatus.ToDo, label: "Cần làm" },
  { value: TaskStatus.InProgress, label: "Đang làm" },
  { value: TaskStatus.Done, label: "Hoàn thành" },
  { value: TaskStatus.Cancelled, label: "Đã hủy" },
];

export const TASK_STATUS_STYLES: Record<TaskStatus, { bg: string; text: string; border: string; dot: string }> = {
  [TaskStatus.ToDo]: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  [TaskStatus.InProgress]: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  [TaskStatus.Done]: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  [TaskStatus.Cancelled]: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

// ==================== TASK PRIORITY ====================
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.Low]: "Thấp",
  [TaskPriority.Medium]: "Trung bình",
  [TaskPriority.High]: "Cao",
  [TaskPriority.Critical]: "Khẩn cấp",
};

export const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: TaskPriority.Low, label: "Thấp" },
  { value: TaskPriority.Medium, label: "Trung bình" },
  { value: TaskPriority.High, label: "Cao" },
  { value: TaskPriority.Critical, label: "Khẩn cấp" },
];

export const TASK_PRIORITY_STYLES: Record<TaskPriority, { bg: string; text: string; border: string; iconColor: string }> = {
  [TaskPriority.Low]: {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    iconColor: "text-slate-400",
  },
  [TaskPriority.Medium]: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    iconColor: "text-blue-500",
  },
  [TaskPriority.High]: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    iconColor: "text-amber-500",
  },
  [TaskPriority.Critical]: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    iconColor: "text-rose-500",
  },
};

// ==================== HELPERS ====================

/**
 * Determine contrast text color (black or white) for a given hex color
 */
export function getContrastTextColor(hexColor?: string | null): string {
  if (!hexColor || !/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
    return "#334155"; // slate-700
  }
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  // Calculate relative luminance (YIQ formula)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#0f172a" : "#ffffff";
}

/**
 * Format date string (YYYY-MM-DD) to localized VN display
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const [year, month, day] = dateStr.split("T")[0].split("-");
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format datetime string (UTC) to localized VN display
 */
export function formatDateTime(dateTimeStr?: string | null): string {
  if (!dateTimeStr) return "—";
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    return d.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateTimeStr;
  }
}
