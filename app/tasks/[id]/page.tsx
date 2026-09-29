"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api";
import { TaskDetail, ProjectDetail } from "@/lib/types";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TagBadge,
  ActiveBadge,
} from "@/components/badges";
import { formatDate, formatDateTime } from "@/lib/constants";
import { SkeletonBlock } from "@/components/ui/loading";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = Number(params?.id);

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | string | null>(null);

  const fetchTaskDetails = useCallback(async () => {
    if (!taskId || isNaN(taskId)) {
      setError(new Error("Mã công việc không hợp lệ."));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const taskData = await apiClient.tasks.getById(taskId);
      setTask(taskData);

      // Fetch parent project to get full breadcrumbs and project info
      if (taskData.projectId) {
        try {
          const projectData = await apiClient.projects.getById(taskData.projectId);
          setProject(projectData);
        } catch {
          // Parent project might be soft deleted or unavailable; don't break task view
        }
      }
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!taskId || isNaN(taskId)) {
      return;
    }
    let ignore = false;
    apiClient.tasks
      .getById(taskId)
      .then(async (taskData) => {
        if (!ignore) {
          setTask(taskData);
          if (taskData.projectId) {
            try {
              const projectData = await apiClient.projects.getById(taskData.projectId);
              if (!ignore) setProject(projectData);
            } catch {
              // Ignore parent project fetch errors
            }
          }
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof ApiError || err instanceof Error ? err : String(err));
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [taskId]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        {project && (
          <>
            <Link
              href={`/departments/${project.departmentId}`}
              className="hover:text-indigo-600 transition-colors"
            >
              {project.departmentName}
            </Link>
            <span>/</span>
            <Link
              href={`/projects/${project.projectId}`}
              className="hover:text-indigo-600 transition-colors"
            >
              {project.projectName}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="font-medium text-slate-900 line-clamp-1">
          {task ? task.title : `Công việc #${taskId}`}
        </span>
      </nav>

      {/* Error state (404 or connection error) */}
      {error && (
        <div className="space-y-4">
          <ErrorAlert
            error={error}
            title={
              error instanceof ApiError && error.status === 404
                ? "Không tìm thấy công việc"
                : "Lỗi tải thông tin chi tiết công việc"
            }
            onRetry={fetchTaskDetails}
          />
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Tìm kiếm công việc</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Quay lại trang chủ</span>
            </Link>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-8 w-2/3" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-6 w-20 rounded-full" />
                <SkeletonBlock className="h-6 w-20 rounded-full" />
              </div>
            </div>
            <SkeletonBlock className="h-5 w-1/3" />
            <SkeletonBlock className="h-20 w-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <SkeletonBlock className="h-4 w-1/3" />
              <SkeletonBlock className="h-6 w-2/3" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <SkeletonBlock className="h-4 w-1/3" />
              <SkeletonBlock className="h-6 w-2/3" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <SkeletonBlock className="h-4 w-1/3" />
              <SkeletonBlock className="h-6 w-2/3" />
            </div>
          </div>
        </div>
      )}

      {/* Task Details Content */}
      {!isLoading && !error && task && (
        <div className="space-y-8">
          {/* Main Card */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-4 max-w-4xl">
                {/* Badges bar */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <TaskStatusBadge status={task.status} />
                  <TaskPriorityBadge priority={task.priority} />
                  <ActiveBadge isActive={task.isActive} />
                  <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    Task #{task.taskId}
                  </span>
                </div>

                {/* Task Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                  {task.title}
                </h1>

                {/* Description */}
                <div className="pt-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Mô tả công việc
                  </h2>
                  <div className="rounded-2xl bg-slate-50/80 border border-slate-200/80 p-5 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {task.description || "Công việc này chưa có nội dung mô tả chi tiết."}
                  </div>
                </div>

                {/* Tags */}
                <div className="pt-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Nhãn phân loại (Tags)
                  </h2>
                  {task.tags && task.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {task.tags.map((tag) => (
                        <TagBadge key={tag.tagId} tag={tag} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Chưa được gắn nhãn phân loại nào.</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap md:flex-col items-stretch gap-2.5 shrink-0">
                <Link
                  href={`/tasks/manage?edit=${task.taskId}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Chỉnh sửa Task</span>
                </Link>

                {project && (
                  <Link
                    href={`/projects/${project.projectId}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Về dự án</span>
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* Metadata Cards Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Project & Department */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Dự án & Phòng ban</span>
              </div>

              <div>
                {project ? (
                  <>
                    <Link
                      href={`/projects/${project.projectId}`}
                      className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors block"
                    >
                      {project.projectName}
                    </Link>
                    <Link
                      href={`/departments/${project.departmentId}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 inline-block"
                    >
                      {project.departmentName}
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`/projects/${task.projectId}`}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Dự án #{task.projectId}
                  </Link>
                )}
              </div>
            </div>

            {/* Card 2: Due Date */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Hạn hoàn thành (Due Date)</span>
              </div>

              <div>
                <p className="text-base font-bold text-slate-900">
                  {task.dueDate ? formatDate(task.dueDate) : "Không đặt thời hạn"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {task.dueDate ? "Định dạng ngày DD/MM/YYYY" : "Công việc có thể hoàn thành linh hoạt"}
                </p>
              </div>
            </div>

            {/* Card 3: Timestamps */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Thời gian ghi nhận</span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Ngày tạo:</span>
                  <strong className="text-slate-800 font-medium">{formatDateTime(task.createdDate)}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Cập nhật:</span>
                  <strong className="text-slate-800 font-medium">
                    {task.modifiedDate ? formatDateTime(task.modifiedDate) : "Chưa chỉnh sửa"}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
