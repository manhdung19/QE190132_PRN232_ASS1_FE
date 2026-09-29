"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import {
  TaskListItem,
  ProjectListItem,
  TagListItem,
  TaskCreateRequest,
  TaskUpdateRequest,
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
  ActiveBadge,
} from "@/components/badges";
import { useToast } from "@/components/toast-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SkeletonBlock } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, Input, Textarea, Select, Checkbox } from "@/components/ui/form-controls";

export default function ManageTasksPage() {
  const toast = useToast();

  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [tags, setTags] = useState<TagListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | string | null>(null);

  // Filters
  const [titleFilter, setTitleFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<string>("");

  // Modal Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    projectId: number;
    isActive: boolean;
    tagIds: number[];
  }>({
    title: "",
    description: "",
    status: TaskStatus.ToDo,
    priority: TaskPriority.Medium,
    dueDate: "",
    projectId: 0,
    isActive: true,
    tagIds: [],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<TaskListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tasksData, projectsData, tagsData] = await Promise.all([
        apiClient.tasks.getAll(),
        apiClient.projects.getAll(),
        apiClient.tags.getAll(),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
      setTags(tagsData);
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiClient.tasks.getAll(),
      apiClient.projects.getAll(),
      apiClient.tags.getAll(),
    ])
      .then(([tasksData, projectsData, tagsData]) => {
        if (!ignore) {
          setTasks(tasksData);
          setProjects(projectsData);
          setTags(tagsData);
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

  // Keyboard accessibility: Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen && !isSubmitting) {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isSubmitting]);

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    if (titleFilter.trim()) {
      const q = titleFilter.toLowerCase().trim();
      const match =
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        String(t.taskId).includes(q);
      if (!match) return false;
    }
    if (projectFilter && t.projectId !== Number(projectFilter)) {
      return false;
    }
    if (statusFilter !== "" && t.status !== Number(statusFilter)) {
      return false;
    }
    if (priorityFilter !== "" && t.priority !== Number(priorityFilter)) {
      return false;
    }
    if (tagFilter && !t.tags.some((tag) => tag.tagId === Number(tagFilter))) {
      return false;
    }
    return true;
  });

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setCurrentId(null);
    const defaultProjectId = projects.length > 0 ? projects[0].projectId : 0;
    setFormData({
      title: "",
      description: "",
      status: TaskStatus.ToDo,
      priority: TaskPriority.Medium,
      dueDate: "",
      projectId: defaultProjectId,
      isActive: true,
      tagIds: [],
    });
    setFieldErrors({});
    setIsModalOpen(true);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  // Open Edit Modal - fetches GET /api/tasks/{id} to get fresh task detail & tags
  const openEditModal = async (task: TaskListItem) => {
    setModalMode("edit");
    setCurrentId(task.taskId);
    setFieldErrors({});
    setIsModalOpen(true);
    setIsLoadingDetail(true);

    try {
      const detail = await apiClient.tasks.getById(task.taskId);
      setFormData({
        title: detail.title,
        description: detail.description || "",
        status: detail.status,
        priority: detail.priority,
        dueDate: detail.dueDate ? detail.dueDate.split("T")[0] : "",
        projectId: detail.projectId,
        isActive: detail.isActive,
        tagIds: detail.tags ? detail.tags.map((tg) => tg.tagId) : [],
      });
    } catch {
      // Fallback to table row item if detail request fails
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        projectId: task.projectId,
        isActive: task.isActive,
        tagIds: task.tags ? task.tags.map((tg) => tg.tagId) : [],
      });
    } finally {
      setIsLoadingDetail(false);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  };

  // Toggle Tag selection in form
  const toggleTag = (tagId: number) => {
    setFormData((prev) => {
      const exists = prev.tagIds.includes(tagId);
      return {
        ...prev,
        tagIds: exists
          ? prev.tagIds.filter((id) => id !== tagId)
          : [...prev.tagIds, tagId],
      };
    });
  };

  // Open Delete Dialog
  const openDeleteDialog = (task: TaskListItem) => {
    setDeletingTask(task);
    setIsDeleteDialogOpen(true);
  };

  // Validate form client-side
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Tiêu đề công việc không được để trống hoặc chỉ chứa khoảng trắng.";
    } else if (formData.title.length > 300) {
      errors.title = "Tiêu đề không được vượt quá 300 ký tự.";
    }

    if (!formData.projectId || formData.projectId <= 0) {
      errors.projectId = "Vui lòng chọn dự án hợp lệ cho công việc này.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      if (modalMode === "create") {
        const payload: TaskCreateRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() ? formData.description : null,
          status: formData.status,
          priority: formData.priority,
          dueDate: formData.dueDate ? formData.dueDate : null,
          projectId: Number(formData.projectId),
          isActive: formData.isActive,
          tagIds: formData.tagIds,
        };
        await apiClient.tasks.create(payload);
        toast.success(`Đã tạo công việc "${formData.title.trim()}" thành công.`);
      } else if (modalMode === "edit" && currentId) {
        const payload: TaskUpdateRequest = {
          title: formData.title.trim(),
          description: formData.description.trim() ? formData.description : null,
          status: formData.status,
          priority: formData.priority,
          dueDate: formData.dueDate ? formData.dueDate : null,
          projectId: Number(formData.projectId),
          isActive: formData.isActive,
          tagIds: formData.tagIds, // Replaces entire tags list; [] removes all tags
        };
        await apiClient.tasks.update(currentId, payload);
        toast.success(`Đã cập nhật công việc "${formData.title.trim()}" thành công.`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const newErrors: Record<string, string> = {};
          if (err.getFieldErrors("title").length > 0) {
            newErrors.title = err.getFieldError("title")!;
          }
          if (err.getFieldErrors("projectId").length > 0) {
            newErrors.projectId = err.getFieldError("projectId")!;
          }
          if (err.getFieldErrors("dueDate").length > 0) {
            newErrors.dueDate = err.getFieldError("dueDate")!;
          }
          if (err.getFieldErrors("status").length > 0) {
            newErrors.status = err.getFieldError("status")!;
          }
          if (err.getFieldErrors("priority").length > 0) {
            newErrors.priority = err.getFieldError("priority")!;
          }
          if (err.getFieldErrors("tagIds").length > 0) {
            newErrors.tagIds = err.getFieldError("tagIds")!;
          }
          if (err.operationError) {
            toast.error(err.operationError);
          }
          setFieldErrors(newErrors);
        } else {
          toast.error(err.getUserMessage());
        }
      } else {
        toast.error("Đã xảy ra lỗi khi lưu thông tin công việc.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Soft Delete
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;

    setIsDeleting(true);
    try {
      await apiClient.tasks.delete(deletingTask.taskId);
      toast.success(`Đã xóa mềm công việc "${deletingTask.title}" thành công.`);
      setIsDeleteDialogOpen(false);
      setDeletingTask(null);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.getUserMessage());
      } else {
        toast.error("Đã xảy ra lỗi khi xóa công việc.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(
    titleFilter.trim() ||
      projectFilter ||
      statusFilter !== "" ||
      priorityFilter !== "" ||
      tagFilter
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900">Quản lý Công việc</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Quản lý Công việc (Tasks)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi nhiệm vụ dự án, phân loại nhãn, cập nhật tiến độ và độ ưu tiên.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Thêm Công việc mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="search-task-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Tìm theo tiêu đề / ID
            </label>
            <div className="relative">
              <input
                id="search-task-title"
                type="text"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                placeholder="Nhập tên việc hoặc ID..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Project filter */}
          <div>
            <label htmlFor="filter-task-project" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Dự án
            </label>
            <select
              id="filter-task-project"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
            >
              <option value="">Tất cả dự án</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label htmlFor="filter-task-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Trạng thái
            </label>
            <select
              id="filter-task-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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

          {/* Priority filter */}
          <div>
            <label htmlFor="filter-task-priority" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Độ ưu tiên
            </label>
            <select
              id="filter-task-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
            >
              <option value="">Tất cả mức độ</option>
              {TASK_PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tag filter */}
          <div>
            <label htmlFor="filter-task-tag" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Nhãn phân loại
            </label>
            <select
              id="filter-task-tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
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

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Đang lọc: {filteredTasks.length} / {tasks.length} công việc
            </span>
            <button
              type="button"
              onClick={() => {
                setTitleFilter("");
                setProjectFilter("");
                setStatusFilter("");
                setPriorityFilter("");
                setTagFilter("");
              }}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Xóa các bộ lọc
            </button>
          </div>
        )}
      </section>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          error={error}
          title="Không thể tải danh sách công việc"
          onRetry={loadData}
        />
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <SkeletonBlock className="h-6 w-1/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonBlock key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredTasks.length === 0 && (
        <EmptyState
          title={hasActiveFilters ? "Không tìm thấy công việc nào" : "Chưa có công việc nào"}
          description={
            hasActiveFilters
              ? "Không có công việc nào khớp với các tiêu chí lọc đã chọn."
              : "Hệ thống chưa ghi nhận công việc nào đang hoạt động."
          }
          actionText={hasActiveFilters ? "Xóa bộ lọc" : "Tạo công việc mới"}
          onAction={
            hasActiveFilters
              ? () => {
                  setTitleFilter("");
                  setProjectFilter("");
                  setStatusFilter("");
                  setPriorityFilter("");
                  setTagFilter("");
                }
              : openCreateModal
          }
        />
      )}

      {/* Tasks Table */}
      {!isLoading && !error && filteredTasks.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4">Mã ID</th>
                  <th scope="col" className="px-6 py-4">Tiêu đề & Dự án</th>
                  <th scope="col" className="px-6 py-4">Trạng thái</th>
                  <th scope="col" className="px-6 py-4">Ưu tiên</th>
                  <th scope="col" className="px-6 py-4">Hạn chót</th>
                  <th scope="col" className="px-6 py-4">Nhãn (Tags)</th>
                  <th scope="col" className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const parentProject = projects.find((p) => p.projectId === task.projectId);

                  return (
                    <tr key={task.taskId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        #{task.taskId}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/tasks/${task.taskId}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block"
                        >
                          {task.title}
                        </Link>

                        <div className="mt-1 flex items-center gap-2 text-xs">
                          {parentProject ? (
                            <Link
                              href={`/projects/${task.projectId}`}
                              className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                              <span>{parentProject.projectName}</span>
                            </Link>
                          ) : (
                            <span className="text-slate-400">Dự án #{task.projectId}</span>
                          )}
                          <span className="text-slate-300">•</span>
                          <ActiveBadge isActive={task.isActive} />
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <TaskStatusBadge status={task.status} />
                      </td>

                      <td className="px-6 py-4">
                        <TaskPriorityBadge priority={task.priority} />
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-600">
                        {task.dueDate ? (
                          <span className="font-medium text-slate-700">
                            {formatDate(task.dueDate)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Không có</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {task.tags && task.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {task.tags.map((tg) => (
                              <TagBadge key={tg.tagId} tag={tg} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa gắn nhãn</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/tasks/${task.taskId}`}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                            title="Xem chi tiết công việc"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>

                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                            title="Chỉnh sửa công việc"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteDialog(task)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Xóa công việc (Soft delete)"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal Create / Edit Task */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => !isSubmitting && setIsModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Box */}
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10 transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === "create" ? "Thêm Công việc mới" : "Chỉnh sửa Công việc"}
              </h3>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingDetail ? (
              <div className="py-12 space-y-4">
                <SkeletonBlock className="h-6 w-1/3 mx-auto" />
                <SkeletonBlock className="h-24 w-full" />
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} className="mt-4 space-y-4">
                <FormField
                  label="Tiêu đề công việc"
                  name="title"
                  required
                  error={fieldErrors.title}
                  hint="Tối đa 300 ký tự"
                >
                  <Input
                    ref={titleInputRef}
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ví dụ: Thiết kế giao diện Dashboard"
                    hasError={Boolean(fieldErrors.title)}
                    disabled={isSubmitting}
                    maxLength={300}
                  />
                </FormField>

                <FormField
                  label="Thuộc dự án"
                  name="projectId"
                  required
                  error={fieldErrors.projectId}
                >
                  <Select
                    id="projectId"
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: Number(e.target.value) })}
                    hasError={Boolean(fieldErrors.projectId)}
                    disabled={isSubmitting}
                  >
                    <option value={0}>-- Chọn dự án --</option>
                    {projects.map((p) => (
                      <option key={p.projectId} value={p.projectId}>
                        {p.projectName}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField
                  label="Mô tả công việc"
                  name="description"
                  error={fieldErrors.description}
                  hint="Không bắt buộc"
                >
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Chi tiết yêu cầu, tiêu chí nghiệm thu công việc..."
                    rows={3}
                    hasError={Boolean(fieldErrors.description)}
                    disabled={isSubmitting}
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField
                    label="Trạng thái"
                    name="status"
                    error={fieldErrors.status}
                  >
                    <Select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) as TaskStatus })}
                      hasError={Boolean(fieldErrors.status)}
                      disabled={isSubmitting}
                    >
                      {TASK_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField
                    label="Độ ưu tiên"
                    name="priority"
                    error={fieldErrors.priority}
                  >
                    <Select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) as TaskPriority })}
                      hasError={Boolean(fieldErrors.priority)}
                      disabled={isSubmitting}
                    >
                      {TASK_PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField
                    label="Hạn hoàn thành"
                    name="dueDate"
                    error={fieldErrors.dueDate}
                  >
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      hasError={Boolean(fieldErrors.dueDate)}
                      disabled={isSubmitting}
                    />
                  </FormField>
                </div>

                {/* Multi-Select Tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700">
                      Gắn nhãn phân loại (Tags)
                    </label>
                    {formData.tagIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tagIds: [] })}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Bỏ chọn tất cả
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Bấm để chọn/bỏ chọn nhãn. Khi chỉnh sửa, danh sách nhãn sẽ được cập nhật đồng bộ.
                  </p>

                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50/50">
                    {tags.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">Chưa có nhãn nào trong hệ thống.</span>
                    ) : (
                      tags.map((tg) => {
                        const isSelected = formData.tagIds.includes(tg.tagId);
                        return (
                          <button
                            key={tg.tagId}
                            type="button"
                            onClick={() => toggleTag(tg.tagId)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs scale-102"
                                : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                            }`}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: tg.color || "#94a3b8" }}
                            />
                            <span>#{tg.tagName}</span>
                            {isSelected && (
                              <svg className="h-3 w-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {fieldErrors.tagIds && (
                    <p className="text-xs font-medium text-rose-600">{fieldErrors.tagIds}</p>
                  )}
                </div>

                <Checkbox
                  id="isActive"
                  label="Kích hoạt hoạt động (Active)"
                  description="Công việc active mới xuất hiện trên bảng làm việc và bộ lọc tìm kiếm."
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={isSubmitting}
                />

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isSubmitting && (
                      <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    <span>{modalMode === "create" ? "Tạo công việc" : "Lưu thay đổi"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa công việc"
        message={`Bạn có chắc chắn muốn xóa công việc "${deletingTask?.title}" (#${deletingTask?.taskId})? Hành động này sẽ chuyển trạng thái công việc sang không hoạt động (soft delete) và ẩn khỏi danh sách.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        isDangerous
        isLoading={isDeleting}
      />
    </main>
  );
}
