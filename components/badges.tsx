import React from "react";
import { ProjectStatus, TaskStatus, TaskPriority, TagListItem } from "@/lib/types";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
  TASK_STATUS_LABELS,
  TASK_STATUS_STYLES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_STYLES,
  getContrastTextColor,
} from "@/lib/constants";

// ==================== PROJECT STATUS BADGE ====================
export function ProjectStatusBadge({
  status,
  className = "",
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const label = PROJECT_STATUS_LABELS[status] ?? "Không rõ";
  const styles = PROJECT_STATUS_STYLES[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

// ==================== TASK STATUS BADGE ====================
export function TaskStatusBadge({
  status,
  className = "",
}: {
  status: TaskStatus;
  className?: string;
}) {
  const label = TASK_STATUS_LABELS[status] ?? "Không rõ";
  const styles = TASK_STATUS_STYLES[status] ?? {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

// ==================== TASK PRIORITY BADGE ====================
export function TaskPriorityBadge({
  priority,
  className = "",
}: {
  priority: TaskPriority;
  className?: string;
}) {
  const label = TASK_PRIORITY_LABELS[priority] ?? "Không rõ";
  const styles = TASK_PRIORITY_STYLES[priority] ?? {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    iconColor: "text-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${styles.bg} ${styles.text} ${styles.border} ${className}`}
    >
      <svg
        className={`h-3 w-3 ${styles.iconColor}`}
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </span>
  );
}

// ==================== TAG BADGE ====================
export function TagBadge({
  tag,
  onRemove,
  className = "",
}: {
  tag: TagListItem;
  onRemove?: () => void;
  className?: string;
}) {
  const hasColor = Boolean(tag.color && /^#[0-9a-fA-F]{6}$/.test(tag.color));
  const textColor = hasColor ? getContrastTextColor(tag.color) : undefined;

  return (
    <span
      style={
        hasColor
          ? {
              backgroundColor: tag.color!,
              color: textColor,
              borderColor: tag.color!,
            }
          : undefined
      }
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
        !hasColor ? "bg-slate-100 text-slate-700 border-slate-300" : ""
      } ${className}`}
    >
      <span>#{tag.tagName}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-75 focus:outline-none"
          aria-label={`Xóa nhãn ${tag.tagName}`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

// ==================== ACTIVE STATUS BADGE ====================
export function ActiveBadge({
  isActive,
  className = "",
}: {
  isActive: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-500 border-slate-200"
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-slate-400"
        }`}
        aria-hidden="true"
      />
      {isActive ? "Hoạt động" : "Đã vô hiệu"}
    </span>
  );
}
