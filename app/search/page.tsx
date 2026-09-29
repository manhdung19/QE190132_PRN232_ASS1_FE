"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import {
  TaskListItem,
  ProjectListItem,
  TagListItem,
  TaskStatus,
  TaskPriority,
} from "@/lib/types";
import {
  TASK_STATUS_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  formatDate,
} from "@/lib/constants";
import {
  TaskStatusBadge,
  TaskPriorityBadge,
  TagBadge,
} from "@/components/badges";
import { SkeletonBlock } from "@/components/ui/loading";
import { ErrorAlert } from "@/components/ui/error-alert";
import { EmptyState } from "@/components/ui/empty-state";

export default function SearchTasksPage() {
  // Filter form states
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [tagId, setTagId] = useState<string>("");

  // Metadata dropdown options
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [tags, setTags] = useState<TagListItem[]>([]);

  // Search results & states
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | string | null>(null);

  // Request race-condition counter
  const latestRequestIdRef = useRef(0);

  // 1. Load Projects and Tags for filter dropdowns on mount
  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiClient.projects.getAll().catch(() => [] as ProjectListItem[]),
      apiClient.tags.getAll().catch(() => [] as TagListItem[]),
    ]).then(([projectsData, tagsData]) => {
      if (!ignore) {
        setProjects(projectsData);
        setTags(tagsData);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Perform search with given filter values
  const performSearch = useCallback(
    async (filters: {
      title?: string;
      status?: string;
      priority?: string;
      projectId?: string;
      tagId?: string;
    }) => {
      const requestId = ++latestRequestIdRef.current;
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = {
          title: filters.title?.trim() || undefined,
          status: filters.status !== "" && filters.status !== undefined ? (Number(filters.status) as TaskStatus) : undefined,
          priority: filters.priority !== "" && filters.priority !== undefined ? (Number(filters.priority) as TaskPriority) : undefined,
          projectId: filters.projectId ? Number(filters.projectId) : undefined,
          tagId: filters.tagId ? Number(filters.tagId) : undefined,
        };

        const results = await apiClient.tasks.search(queryParams);

        // Only update state if this is still the latest request (avoids race condition)
        if (requestId === latestRequestIdRef.current) {
          setTasks(results);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (requestId === latestRequestIdRef.current) {
          setError(err instanceof ApiError || err instanceof Error ? err : String(err));
          setIsLoading(false);
        }
      }
    },
    []
  );

  // 3. Initial load of all tasks asynchronously
  useEffect(() => {
    let ignore = false;
    apiClient.tasks
      .search({})
      .then((results) => {
        if (!ignore) {
          setTasks(results);
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
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch({ title, status, priority, projectId, tagId });
  };

  const handleResetFilters = () => {
    setTitle("");
    setStatus("");
    setPriority("");
    setProjectId("");
    setTagId("");
    performSearch({});
  };

  const hasActiveFilters = Boolean(
    title.trim() || status !== "" || priority !== "" || projectId !== "" || tagId !== ""
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900">Tìm kiếm Task</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Tìm kiếm & Lọc Công việc
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tra cứu công việc theo tiêu đề, trạng thái, độ ưu tiên, dự án hoặc nhãn phân loại.
        </p>
      </div>

      {/* Search & Filter Controls Card */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Top row: Title search */}
          <div>
            <label htmlFor="search-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Từ khóa tiêu đề
            </label>
            <div className="relative">
              <input
                id="search-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề hoặc từ khóa công việc..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors shadow-2xs"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {title && (
                <button
                  type="button"
                  onClick={() => setTitle("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  aria-label="Xóa từ khóa tiêu đề"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Bottom row: Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Status */}
            <div>
              <label htmlFor="filter-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Trạng thái
              </label>
              <select
                id="filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
              >
                <option value="">Tất cả trạng thái</option>
                {TASK_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="filter-priority" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Độ ưu tiên
              </label>
              <select
                id="filter-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
              >
                <option value="">Tất cả mức ưu tiên</option>
                {TASK_PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label htmlFor="filter-project" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Dự án
              </label>
              <select
                id="filter-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
              >
                <option value="">Tất cả dự án</option>
                {projects.map((proj) => (
                  <option key={proj.projectId} value={proj.projectId}>
                    {proj.projectName}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag */}
            <div>
              <label htmlFor="filter-tag" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Nhãn phân loại (Tag)
              </label>
              <select
                id="filter-tag"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
              >
                <option value="">Tất cả nhãn</option>
                {tags.map((t) => (
                  <option key={t.tagId} value={t.tagId}>
                    #{t.tagName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Tìm kiếm</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Đặt lại bộ lọc</span>
                </button>
              )}
            </div>

            <span className="text-xs text-slate-500">
              Kết hợp điều kiện AND theo chuẩn API
            </span>
          </div>
        </form>
      </section>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          error={error}
          title="Không thể thực hiện tìm kiếm"
          onRetry={() => performSearch({ title, status, priority, projectId, tagId })}
        />
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <SkeletonBlock className="h-5 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <SkeletonBlock className="h-5 w-2/3" />
                  <SkeletonBlock className="h-6 w-20 rounded-full" />
                </div>
                <SkeletonBlock className="h-10 w-full" />
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      {!isLoading && !error && (
        <section className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Tìm thấy <strong className="font-semibold text-slate-900">{tasks.length}</strong> công việc phù hợp
            </span>
            {hasActiveFilters && (
              <span className="text-indigo-600 font-medium">Bộ lọc đang áp dụng</span>
            )}
          </div>

          {tasks.length === 0 ? (
            <EmptyState
              title="Không tìm thấy công việc nào"
              description="Không có công việc nào thỏa mãn tất cả tiêu chí tìm kiếm hiện tại. Hãy thử điều chỉnh hoặc xóa bớt bộ lọc."
              actionText={hasActiveFilters ? "Xóa toàn bộ bộ lọc" : "Tạo công việc mới"}
              onAction={hasActiveFilters ? handleResetFilters : undefined}
              actionHref={hasActiveFilters ? undefined : "/tasks/manage"}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <Link
                  key={task.taskId}
                  href={`/tasks/${task.taskId}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                        {task.title}
                      </h2>
                      <TaskStatusBadge status={task.status} />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {task.description || "Không có mô tả chi tiết."}
                    </p>

                    {/* Tags */}
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
      )}
    </main>
  );
}
