"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import {
  ProjectListItem,
  DepartmentListItem,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectStatus,
} from "@/lib/types";
import { PROJECT_STATUS_OPTIONS, formatDate } from "@/lib/constants";
import { ProjectStatusBadge, ActiveBadge } from "@/components/badges";
import { useToast } from "@/components/toast-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SkeletonBlock } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, Input, Textarea, Select, Checkbox } from "@/components/ui/form-controls";

export default function ManageProjectsPage() {
  const toast = useToast();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | string | null>(null);

  // Search & Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Modal Create/Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    projectName: string;
    description: string;
    startDate: string;
    endDate: string;
    status: ProjectStatus;
    departmentId: number;
    isActive: boolean;
  }>({
    projectName: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: ProjectStatus.NotStarted,
    departmentId: 0,
    isActive: true,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<ProjectListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Fetch projects and departments
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [projectsData, deptsData] = await Promise.all([
        apiClient.projects.getAll(),
        apiClient.departments.getAll(),
      ]);
      setProjects(projectsData);
      setDepartments(deptsData);
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiClient.projects.getAll(),
      apiClient.departments.getAll(),
    ])
      .then(([projectsData, deptsData]) => {
        if (!ignore) {
          setProjects(projectsData);
          setDepartments(deptsData);
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

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    if (nameFilter.trim()) {
      const q = nameFilter.toLowerCase().trim();
      const match =
        p.projectName.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        String(p.projectId).includes(q);
      if (!match) return false;
    }
    if (deptFilter && p.departmentId !== Number(deptFilter)) {
      return false;
    }
    if (statusFilter !== "" && p.status !== Number(statusFilter)) {
      return false;
    }
    return true;
  });

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setCurrentId(null);
    const defaultDeptId = departments.length > 0 ? departments[0].departmentId : 0;
    setFormData({
      projectName: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      status: ProjectStatus.NotStarted,
      departmentId: defaultDeptId,
      isActive: true,
    });
    setFieldErrors({});
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  // Open Edit Modal
  const openEditModal = (proj: ProjectListItem) => {
    setModalMode("edit");
    setCurrentId(proj.projectId);
    setFormData({
      projectName: proj.projectName,
      description: proj.description || "",
      startDate: proj.startDate.split("T")[0],
      endDate: proj.endDate ? proj.endDate.split("T")[0] : "",
      status: proj.status,
      departmentId: proj.departmentId,
      isActive: proj.isActive,
    });
    setFieldErrors({});
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  // Open Delete Dialog
  const openDeleteDialog = (proj: ProjectListItem) => {
    setDeletingProject(proj);
    setIsDeleteDialogOpen(true);
  };

  // Client-side Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.projectName.trim()) {
      errors.projectName = "Tên dự án không được để trống hoặc chỉ chứa khoảng trắng.";
    } else if (formData.projectName.length > 200) {
      errors.projectName = "Tên dự án không được vượt quá 200 ký tự.";
    }

    if (!formData.startDate) {
      errors.startDate = "Ngày bắt đầu là bắt buộc.";
    }

    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      errors.endDate = "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.";
    }

    if (!formData.departmentId || formData.departmentId <= 0) {
      errors.departmentId = "Vui lòng chọn phòng ban phụ trách hợp lệ.";
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
        const payload: ProjectCreateRequest = {
          projectName: formData.projectName,
          description: formData.description.trim() ? formData.description : null,
          startDate: formData.startDate,
          endDate: formData.endDate ? formData.endDate : null,
          status: formData.status,
          departmentId: Number(formData.departmentId),
          isActive: formData.isActive,
        };
        await apiClient.projects.create(payload);
        toast.success(`Đã tạo dự án "${formData.projectName}" thành công.`);
      } else if (modalMode === "edit" && currentId) {
        const payload: ProjectUpdateRequest = {
          projectName: formData.projectName,
          description: formData.description.trim() ? formData.description : null,
          startDate: formData.startDate,
          endDate: formData.endDate ? formData.endDate : null,
          status: formData.status,
          departmentId: Number(formData.departmentId),
          isActive: formData.isActive,
        };
        await apiClient.projects.update(currentId, payload);
        toast.success(`Đã cập nhật dự án "${formData.projectName}" thành công.`);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const newErrors: Record<string, string> = {};
          if (err.getFieldErrors("projectName").length > 0) {
            newErrors.projectName = err.getFieldError("projectName")!;
          }
          if (err.getFieldErrors("startDate").length > 0) {
            newErrors.startDate = err.getFieldError("startDate")!;
          }
          if (err.getFieldErrors("endDate").length > 0) {
            newErrors.endDate = err.getFieldError("endDate")!;
          }
          if (err.getFieldErrors("departmentId").length > 0) {
            newErrors.departmentId = err.getFieldError("departmentId")!;
          }
          if (err.getFieldErrors("status").length > 0) {
            newErrors.status = err.getFieldError("status")!;
          }
          if (err.operationError) {
            toast.error(err.operationError);
          }
          setFieldErrors(newErrors);
        } else {
          toast.error(err.getUserMessage());
        }
      } else {
        toast.error("Đã xảy ra lỗi khi lưu thông tin dự án.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingProject) return;

    setIsDeleting(true);
    try {
      await apiClient.projects.delete(deletingProject.projectId);
      toast.success(`Đã xóa dự án "${deletingProject.projectName}" thành công.`);
      setIsDeleteDialogOpen(false);
      setDeletingProject(null);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        // Blocked delete with 400 (project has associated tasks)
        const opError = err.operationError || err.getUserMessage();
        toast.error(`Không thể xóa: ${opError}`);
      } else {
        toast.error("Đã xảy ra lỗi khi xóa dự án.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(nameFilter.trim() || deptFilter || statusFilter !== "");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900">Quản lý Dự án</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Quản lý Dự án
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi tiến độ, phân công phòng ban và quản lý trạng thái của các dự án.
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
          <span>Thêm Dự án mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Name search */}
          <div>
            <label htmlFor="search-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Tìm theo tên / mô tả
            </label>
            <div className="relative">
              <input
                id="search-name"
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Nhập tên dự án hoặc ID..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Department filter */}
          <div>
            <label htmlFor="filter-department" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Phòng ban
            </label>
            <select
              id="filter-department"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
            >
              <option value="">Tất cả phòng ban</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label htmlFor="filter-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Trạng thái
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
            >
              <option value="">Tất cả trạng thái</option>
              {PROJECT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Đang lọc: {filteredProjects.length} / {projects.length} dự án
            </span>
            <button
              type="button"
              onClick={() => {
                setNameFilter("");
                setDeptFilter("");
                setStatusFilter("");
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
          title="Không thể tải danh sách dự án"
          onRetry={loadData}
        />
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <SkeletonBlock className="h-6 w-1/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBlock key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredProjects.length === 0 && (
        <EmptyState
          title={hasActiveFilters ? "Không tìm thấy dự án nào" : "Chưa có dự án nào"}
          description={
            hasActiveFilters
              ? "Không có dự án nào khớp với các tiêu chí lọc đã chọn."
              : "Hệ thống chưa ghi nhận dự án nào hoạt động."
          }
          actionText={hasActiveFilters ? "Xóa bộ lọc" : "Tạo dự án mới"}
          onAction={
            hasActiveFilters
              ? () => {
                  setNameFilter("");
                  setDeptFilter("");
                  setStatusFilter("");
                }
              : openCreateModal
          }
        />
      )}

      {/* Projects Table */}
      {!isLoading && !error && filteredProjects.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4">Mã ID</th>
                  <th scope="col" className="px-6 py-4">Tên dự án</th>
                  <th scope="col" className="px-6 py-4">Phòng ban</th>
                  <th scope="col" className="px-6 py-4">Trạng thái</th>
                  <th scope="col" className="px-6 py-4">Thời hạn</th>
                  <th scope="col" className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((proj) => (
                  <tr key={proj.projectId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      #{proj.projectId}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/projects/${proj.projectId}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block"
                      >
                        {proj.projectName}
                      </Link>
                      {proj.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500 max-w-xs">
                          {proj.description}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/departments/${proj.departmentId}`}
                        className="text-xs font-medium text-slate-700 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                      >
                        <span>{proj.departmentName}</span>
                      </Link>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <ProjectStatusBadge status={proj.status} />
                        <ActiveBadge isActive={proj.isActive} />
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div>
                        <span>Bắt đầu: {formatDate(proj.startDate)}</span>
                        {proj.endDate && (
                          <div className="text-slate-400">
                            Kết thúc: {formatDate(proj.endDate)}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/projects/${proj.projectId}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="Xem chi tiết & danh sách tasks"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>

                        <button
                          type="button"
                          onClick={() => openEditModal(proj)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteDialog(proj)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Xóa dự án"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal Create / Edit Project */}
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
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10 transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === "create" ? "Thêm Dự án mới" : "Chỉnh sửa Dự án"}
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

            <form onSubmit={handleModalSubmit} className="mt-4 space-y-4">
              <FormField
                label="Tên dự án"
                name="projectName"
                required
                error={fieldErrors.projectName}
                hint="Tối đa 200 ký tự"
              >
                <Input
                  ref={nameInputRef}
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="Ví dụ: Nâng cấp cổng thông tin người dùng"
                  hasError={Boolean(fieldErrors.projectName)}
                  disabled={isSubmitting}
                  maxLength={200}
                />
              </FormField>

              <FormField
                label="Phòng ban phụ trách"
                name="departmentId"
                required
                error={fieldErrors.departmentId}
              >
                <Select
                  id="departmentId"
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) })}
                  hasError={Boolean(fieldErrors.departmentId)}
                  disabled={isSubmitting}
                >
                  <option value={0}>-- Chọn phòng ban --</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>
                      {d.departmentName}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                label="Mô tả dự án"
                name="description"
                error={fieldErrors.description}
                hint="Không bắt buộc"
              >
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mục tiêu, phạm vi và kết quả mong đợi của dự án..."
                  rows={3}
                  hasError={Boolean(fieldErrors.description)}
                  disabled={isSubmitting}
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="Ngày bắt đầu"
                  name="startDate"
                  required
                  error={fieldErrors.startDate}
                >
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    hasError={Boolean(fieldErrors.startDate)}
                    disabled={isSubmitting}
                  />
                </FormField>

                <FormField
                  label="Ngày kết thúc"
                  name="endDate"
                  error={fieldErrors.endDate}
                  hint="Phải >= ngày bắt đầu"
                >
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    hasError={Boolean(fieldErrors.endDate)}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <FormField
                label="Trạng thái triển khai"
                name="status"
                error={fieldErrors.status}
              >
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) as ProjectStatus })}
                  hasError={Boolean(fieldErrors.status)}
                  disabled={isSubmitting}
                >
                  {PROJECT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <Checkbox
                id="isActive"
                label="Kích hoạt hoạt động (Active)"
                description="Chỉ những dự án active mới hiển thị trong các danh sách và cho phép tạo task."
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
                  <span>{modalMode === "create" ? "Tạo dự án" : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa dự án"
        message={`Bạn có chắc chắn muốn xóa dự án "${deletingProject?.projectName}" (#${deletingProject?.projectId})? Lưu ý: Nếu dự án vẫn còn Công việc (Task) liên kết (kể cả inactive), hệ thống sẽ từ chối thao tác.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        isDangerous
        isLoading={isDeleting}
      />
    </main>
  );
}
