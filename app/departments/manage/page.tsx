"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { DepartmentListItem, DepartmentCreateRequest, DepartmentUpdateRequest } from "@/lib/types";
import { ActiveBadge } from "@/components/badges";
import { useToast } from "@/components/toast-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SkeletonBlock } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, Input, Textarea, Checkbox } from "@/components/ui/form-controls";

export default function ManageDepartmentsPage() {
  const toast = useToast();

  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | string | null>(null);

  // Modal Create/Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    departmentName: string;
    departmentDescription: string;
    isActive: boolean;
  }>({
    departmentName: "",
    departmentDescription: "",
    isActive: true,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<DepartmentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load departments
  const loadDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.departments.getAll();
      setDepartments(data);
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    apiClient.departments
      .getAll()
      .then((data) => {
        if (!ignore) {
          setDepartments(data);
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

  // Filtered department list
  const filteredDepartments = departments.filter((d) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    return (
      d.departmentName.toLowerCase().includes(q) ||
      d.departmentDescription.toLowerCase().includes(q) ||
      String(d.departmentId).includes(q)
    );
  });

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setCurrentId(null);
    setFormData({
      departmentName: "",
      departmentDescription: "",
      isActive: true,
    });
    setFieldErrors({});
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  // Open Edit Modal
  const openEditModal = (dept: DepartmentListItem) => {
    setModalMode("edit");
    setCurrentId(dept.departmentId);
    setFormData({
      departmentName: dept.departmentName,
      departmentDescription: dept.departmentDescription,
      isActive: dept.isActive,
    });
    setFieldErrors({});
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  // Open Delete Dialog
  const openDeleteDialog = (dept: DepartmentListItem) => {
    setDeletingDepartment(dept);
    setIsDeleteDialogOpen(true);
  };

  // Validate form client-side
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.departmentName.trim()) {
      errors.departmentName = "Tên phòng ban không được để trống hoặc chỉ chứa khoảng trắng.";
    } else if (formData.departmentName.length > 100) {
      errors.departmentName = "Tên phòng ban không được vượt quá 100 ký tự.";
    }

    if (!formData.departmentDescription.trim()) {
      errors.departmentDescription = "Mô tả phòng ban không được để trống hoặc chỉ chứa khoảng trắng.";
    } else if (formData.departmentDescription.length > 300) {
      errors.departmentDescription = "Mô tả phòng ban không được vượt quá 300 ký tự.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Create or Update Submit
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      if (modalMode === "create") {
        const payload: DepartmentCreateRequest = {
          departmentName: formData.departmentName,
          departmentDescription: formData.departmentDescription,
          isActive: formData.isActive,
        };
        await apiClient.departments.create(payload);
        toast.success(`Đã tạo phòng ban "${formData.departmentName}" thành công.`);
      } else if (modalMode === "edit" && currentId) {
        const payload: DepartmentUpdateRequest = {
          departmentName: formData.departmentName,
          departmentDescription: formData.departmentDescription,
          isActive: formData.isActive,
        };
        await apiClient.departments.update(currentId, payload);
        toast.success(`Đã cập nhật phòng ban "${formData.departmentName}" thành công.`);
      }

      setIsModalOpen(false);
      await loadDepartments();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const newErrors: Record<string, string> = {};
          if (err.getFieldErrors("departmentName").length > 0) {
            newErrors.departmentName = err.getFieldError("departmentName")!;
          }
          if (err.getFieldErrors("departmentDescription").length > 0) {
            newErrors.departmentDescription = err.getFieldError("departmentDescription")!;
          }
          if (err.operationError) {
            toast.error(err.operationError);
          }
          setFieldErrors(newErrors);
        } else {
          toast.error(err.getUserMessage());
        }
      } else {
        toast.error("Đã xảy ra lỗi khi lưu thông tin phòng ban.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingDepartment) return;

    setIsDeleting(true);
    try {
      await apiClient.departments.delete(deletingDepartment.departmentId);
      toast.success(`Đã xóa phòng ban "${deletingDepartment.departmentName}" thành công.`);
      setIsDeleteDialogOpen(false);
      setDeletingDepartment(null);
      await loadDepartments();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        // HTTP 400 with operation error (contains projects)
        const opError = err.operationError || err.getUserMessage();
        toast.error(`Không thể xóa: ${opError}`);
      } else {
        toast.error("Đã xảy ra lỗi khi xóa phòng ban.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href="/departments" className="hover:text-indigo-600 transition-colors">
          Phòng ban
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900">Quản lý</span>
      </nav>

      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Quản lý Phòng ban
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Thêm mới, cập nhật thông tin và quản lý các phòng ban trong hệ thống.
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
          <span>Thêm Phòng ban mới</span>
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Lọc phòng ban theo tên, mô tả hoặc ID..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-2xs"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter("")}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={loadDepartments}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs disabled:opacity-50"
        >
          <svg className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới danh sách</span>
        </button>
      </div>

      {/* Error state */}
      {error && (
        <ErrorAlert
          error={error}
          title="Không thể tải danh sách phòng ban"
          onRetry={loadDepartments}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <SkeletonBlock className="h-6 w-1/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBlock key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredDepartments.length === 0 && (
        <EmptyState
          title={searchFilter ? "Không tìm thấy phòng ban nào" : "Chưa có phòng ban nào"}
          description={
            searchFilter
              ? `Không tìm thấy kết quả nào khớp với "${searchFilter}".`
              : "Hệ thống chưa có dữ liệu phòng ban. Hãy tạo phòng ban đầu tiên."
          }
          actionText={searchFilter ? "Xóa bộ lọc" : "Tạo phòng ban mới"}
          onAction={searchFilter ? () => setSearchFilter("") : openCreateModal}
        />
      )}

      {/* Data Table */}
      {!isLoading && !error && filteredDepartments.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4">Mã ID</th>
                  <th scope="col" className="px-6 py-4">Tên phòng ban</th>
                  <th scope="col" className="px-6 py-4">Mô tả chức năng</th>
                  <th scope="col" className="px-6 py-4">Trạng thái</th>
                  <th scope="col" className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepartments.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      #{dept.departmentId}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/departments/${dept.departmentId}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {dept.departmentName}
                      </Link>
                    </td>

                    <td className="px-6 py-4 max-w-md">
                      <p className="line-clamp-2 text-xs text-slate-600">
                        {dept.departmentDescription}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <ActiveBadge isActive={dept.isActive} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/departments/${dept.departmentId}`}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="Xem chi tiết & dự án"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>

                        <button
                          type="button"
                          onClick={() => openEditModal(dept)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="Chỉnh sửa thông tin"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteDialog(dept)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Xóa phòng ban"
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

      {/* Modal Create / Edit */}
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
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === "create" ? "Thêm Phòng ban mới" : "Chỉnh sửa Phòng ban"}
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
                label="Tên phòng ban"
                name="departmentName"
                required
                error={fieldErrors.departmentName}
                hint="Tối đa 100 ký tự"
              >
                <Input
                  ref={nameInputRef}
                  id="departmentName"
                  value={formData.departmentName}
                  onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                  placeholder="Ví dụ: Kỹ thuật phần mềm"
                  hasError={Boolean(fieldErrors.departmentName)}
                  disabled={isSubmitting}
                  maxLength={100}
                />
              </FormField>

              <FormField
                label="Mô tả chức năng"
                name="departmentDescription"
                required
                error={fieldErrors.departmentDescription}
                hint="Tối đa 300 ký tự"
              >
                <Textarea
                  id="departmentDescription"
                  value={formData.departmentDescription}
                  onChange={(e) => setFormData({ ...formData, departmentDescription: e.target.value })}
                  placeholder="Mô tả trách nhiệm, phạm vi công việc của phòng ban..."
                  rows={4}
                  hasError={Boolean(fieldErrors.departmentDescription)}
                  disabled={isSubmitting}
                  maxLength={300}
                />
              </FormField>

              <Checkbox
                id="isActive"
                label="Kích hoạt hoạt động (Active)"
                description="Chỉ những phòng ban active mới hiển thị trong các danh sách và cho phép tạo dự án."
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
                  <span>{modalMode === "create" ? "Tạo phòng ban" : "Lưu thay đổi"}</span>
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
        title="Xác nhận xóa phòng ban"
        message={`Bạn có chắc chắn muốn xóa phòng ban "${deletingDepartment?.departmentName}" (#${deletingDepartment?.departmentId})? Lưu ý: Nếu phòng ban vẫn còn Dự án liên kết, hệ thống sẽ từ chối thao tác.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        isDangerous
        isLoading={isDeleting}
      />
    </main>
  );
}
