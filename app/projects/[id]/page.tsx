"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api";
import { ProjectDetail, TaskStatus } from "@/lib/types";
import {
  ProjectStatusBadge,
  TaskStatusBadge,
  TaskPriorityBadge,
  TagBadge,
  ActiveBadge,
} from "@/components/badges";
import { formatDate } from "@/lib/constants";
import { SkeletonBlock } from "@/components/ui/loading";
import { ErrorAlert } from "@/components/ui/error-alert";
import { EmptyState } from "@/components/ui/empty-state";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params?.id);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchProject = useCallback(async () => {
    if (!projectId || isNaN(projectId)) {
      setError(new Error("Mã dự án không hợp lệ."));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.projects.getById(projectId);
      setProject(data);
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || isNaN(projectId)) {
      return;
    }
    let ignore = false;
    apiClient.projects
      .getById(projectId)
      .then((data) => {
        if (!ignore) {
          setProject(data);
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
  }, [projectId]);

  // Filter tasks based on selected tab
  const tasks = project?.tasks ?? [];
  const filteredTasks =
    statusFilter === "ALL"
      ? tasks
      : tasks.filter((t) => t.status === Number(statusFilter));

  // Task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TaskStatus.Done).length;
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.InProgress).length;
  const todoTasks = tasks.filter((t) => t.status === TaskStatus.ToDo).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Đường dẫn" className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/departments" className="hover:text-indigo-600 transition-colors">
          Phòng ban
        </Link>
        {project && (
          <>
            <span>/</span>
            <Link
              href={`/departments/${project.departmentId}`}
              className="hover:text-indigo-600 transition-colors"
            >
              {project.departmentName}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-medium text-slate-900 line-clamp-1">
          {project ? project.projectName : `Dự án #${projectId}`}
        </span>
      </nav>

      {/* Error state (404 or connection error) */}
      {error && (
        <div className="space-y-4">
          <ErrorAlert
            error={error}
            title={
              error instanceof ApiError && error.status === 404
                ? "Không tìm thấy dự án"
                : "Lỗi tải thông tin dự án"
            }
            onRetry={fetchProject}
          />
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
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
              <SkeletonBlock className="h-8 w-1/3" />
              <SkeletonBlock className="h-6 w-24 rounded-full" />
            </div>
            <SkeletonBlock className="h-5 w-2/3" />
            <SkeletonBlock className="h-4 w-1/4" />
          </div>

          <div className="space-y-4">
            <SkeletonBlock className="h-6 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <SkeletonBlock className="h-5 w-2/3" />
                  <SkeletonBlock className="h-12 w-full" />
                  <SkeletonBlock className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Project Details Content */}
      {!isLoading && !error && project && (
        <div className="space-y-8">
          {/* Project Header Card */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-4 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {project.projectName}
                  </h1>
                  <ProjectStatusBadge status={project.status} />
                  <ActiveBadge isActive={project.isActive} />
                </div>

                {/* Department link */}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="h-4 w-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Phòng ban:</span>
                  <Link
                    href={`/departments/${project.departmentId}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                  >
                    {project.departmentName}
                  </Link>
                  <span className="text-xs font-mono text-slate-400">(#{project.departmentId})</span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed pt-1">
                  {project.description || "Chưa có mô tả chi tiết cho dự án này."}
                </p>

                {/* Timeline and metadata */}
                <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-slate-500 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Thời hạn:</span>
                    <strong className="text-slate-700 font-medium">{formatDate(project.startDate)}</strong>
                    <span className="text-slate-300">→</span>
                    <strong className="text-slate-700 font-medium">
                      {project.endDate ? formatDate(project.endDate) : "Chưa xác định"}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span>Mã dự án:</span>
                    <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      #{project.projectId}
                    </code>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap md:flex-col items-stretch gap-2.5 shrink-0">
                <Link
                  href="/projects/manage"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Chỉnh sửa dự án</span>
                </Link>

                <Link
                  href="/tasks/manage"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tạo Task mới</span>
                </Link>
              </div>
            </div>

            {/* Project Task Completion Progress Bar */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
                <span>Tiến độ hoàn thành công việc: {completedTasks}/{totalTasks} Task ({progressPercent}%)</span>
                <span>{inProgressTasks} đang thực hiện • {todoTasks} cần làm</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </section>

          {/* Related Tasks Section */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Danh sách công việc
                  </h2>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {totalTasks}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Tất cả các công việc thuộc phạm vi triển khai của dự án {project.projectName}.
                </p>
              </div>

              {/* Status Filter Tabs */}
              {totalTasks > 0 && (
                <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                      statusFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "hover:text-slate-900"
                    }`}
                  >
                    Tất cả ({totalTasks})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter(String(TaskStatus.ToDo))}
                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                      statusFilter === String(TaskStatus.ToDo) ? "bg-white text-slate-900 shadow-2xs font-semibold" : "hover:text-slate-900"
                    }`}
                  >
                    Cần làm ({todoTasks})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter(String(TaskStatus.InProgress))}
                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                      statusFilter === String(TaskStatus.InProgress) ? "bg-white text-slate-900 shadow-2xs font-semibold" : "hover:text-slate-900"
                    }`}
                  >
                    Đang làm ({inProgressTasks})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter(String(TaskStatus.Done))}
                    className={`rounded-lg px-3 py-1.5 transition-colors ${
                      statusFilter === String(TaskStatus.Done) ? "bg-white text-slate-900 shadow-2xs font-semibold" : "hover:text-slate-900"
                    }`}
                  >
                    Xong ({completedTasks})
                  </button>
                </div>
              )}
            </div>

            {/* Empty state when no tasks exist */}
            {totalTasks === 0 ? (
              <EmptyState
                title="Chưa có công việc nào"
                description={`Dự án "${project.projectName}" hiện chưa có công việc nào. Bắt đầu bằng cách tạo công việc đầu tiên.`}
                actionText="Tạo Task mới"
                actionHref="/tasks/manage"
              />
            ) : filteredTasks.length === 0 ? (
              <EmptyState
                title="Không có công việc phù hợp"
                description="Không có công việc nào khớp với trạng thái lọc đã chọn."
                actionText="Xem tất cả công việc"
                onAction={() => setStatusFilter("ALL")}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTasks.map((task) => (
                  <Link
                    key={task.taskId}
                    href={`/tasks/${task.taskId}`}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {task.title}
                        </h3>
                        <TaskStatusBadge status={task.status} />
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {task.description || "Không có mô tả chi tiết."}
                      </p>

                      {/* Tags list */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {task.tags.map((tag) => (
                            <TagBadge key={tag.tagId} tag={tag} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <TaskPriorityBadge priority={task.priority} />
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Hạn: {formatDate(task.dueDate)}</span>
                          </div>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-700">
                        Chi tiết
                        <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
