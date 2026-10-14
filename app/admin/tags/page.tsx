"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { TagListItem, TagCreateRequest, TagUpdateRequest } from "@/lib/types";
import { TagBadge } from "@/components/badges";
import { useToast } from "@/components/toast-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorAlert } from "@/components/ui/error-alert";
import { SkeletonBlock } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, Input } from "@/components/ui/form-controls";

const PRESET_COLORS = [
  { name: "Blue", hex: "#3B82F6" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Purple", hex: "#8B5CF6" },
  { name: "Rose", hex: "#EF4444" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Cyan", hex: "#06B6D4" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Slate", hex: "#64748B" },
];

export default function ManageTagsPage() {
  const toast = useToast();

  const [tags, setTags] = useState<TagListItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | string | null>(null);

  // Modal Create/Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    tagName: string;
    color: string;
  }>({
    tagName: "",
    color: "#3B82F6",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTag, setDeletingTag] = useState<TagListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Load all tags
  const loadTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.tags.getAll();
      setTags(data);
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    apiClient.tags
      .getAll()
      .then((data) => {
        if (!ignore) {
          setTags(data);
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

  // Filtered tags
  const filteredTags = tags.filter((t) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase().trim();
    return (
      t.tagName.toLowerCase().includes(q) ||
      (t.color && t.color.toLowerCase().includes(q)) ||
      String(t.tagId).includes(q)
    );
  });

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode("create");
    setCurrentId(null);
    setFormData({
      tagName: "",
      color: "#3B82F6",
    });
    setFieldErrors({});
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  // Open Edit Modal (from GET list item directly, as per API contract without GET detail)
  const openEditModal = (tag: TagListItem) => {
    setModalMode("edit");
    setCurrentId(tag.tagId);
    setFormData({
      tagName: tag.tagName,
      color: tag.color || "#3B82F6",
    });
    setFieldErrors({});
    setIsModalOpen(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  // Open Delete Dialog
  const openDeleteDialog = (tag: TagListItem) => {
    setDeletingTag(tag);
    setIsDeleteDialogOpen(true);
  };

  // Validate form client-side
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.tagName.trim()) {
      errors.tagName = "Tên nhãn không được để trống hoặc chỉ chứa khoảng trắng.";
    } else if (formData.tagName.length > 50) {
      errors.tagName = "Tên nhãn không được vượt quá 50 ký tự.";
    }

    if (formData.color && !/^#[0-9a-fA-F]{6}$/.test(formData.color)) {
      errors.color = "Mã màu phải có định dạng #RRGGBB (ví dụ: #3B82F6).";
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
      const normalizedColor = formData.color.trim() ? formData.color.trim() : null;

      if (modalMode === "create") {
        const payload: TagCreateRequest = {
          tagName: formData.tagName.trim(),
          color: normalizedColor,
        };
        await apiClient.tags.create(payload);
        toast.success(`Đã tạo nhãn "${formData.tagName.trim()}" thành công.`);
      } else if (modalMode === "edit" && currentId) {
        const payload: TagUpdateRequest = {
          tagName: formData.tagName.trim(),
          color: normalizedColor,
        };
        await apiClient.tags.update(currentId, payload);
        toast.success(`Đã cập nhật nhãn "${formData.tagName.trim()}" thành công.`);
      }

      setIsModalOpen(false);
      await loadTags();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const newErrors: Record<string, string> = {};
          if (err.getFieldErrors("tagName").length > 0) {
            newErrors.tagName = err.getFieldError("tagName")!;
          }
          if (err.getFieldErrors("color").length > 0) {
            newErrors.color = err.getFieldError("color")!;
          }
          if (err.operationError) {
            toast.error(err.operationError);
          }
          setFieldErrors(newErrors);
        } else {
          toast.error(err.getUserMessage());
        }
      } else {
        toast.error("Đã xảy ra lỗi khi lưu thông tin nhãn.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingTag) return;

    setIsDeleting(true);
    try {
      await apiClient.tags.delete(deletingTag.tagId);
      toast.success(`Đã xóa nhãn "${deletingTag.tagName}" thành công.`);
      setIsDeleteDialogOpen(false);
      setDeletingTag(null);
      await loadTags();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        // Blocked delete with 400 (tag is currently assigned to tasks)
        const opError = err.operationError || err.getUserMessage();
        toast.error(`Không thể xóa: ${opError}`);
      } else {
        toast.error("Đã xảy ra lỗi khi xóa nhãn.");
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
        <span className="font-medium text-slate-900">Quản lý Nhãn phân loại</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Quản lý Nhãn phân loại (Tags)
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tạo và gắn màu các nhãn để phân loại, theo dõi công việc hiệu quả hơn.
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
          <span>Thêm Nhãn mới</span>
        </button>
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Lọc nhãn theo tên hoặc mã màu..."
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
          onClick={loadTags}
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
          title="Không thể tải danh sách nhãn"
          onRetry={loadTags}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <SkeletonBlock className="h-6 w-1/4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonBlock key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && filteredTags.length === 0 && (
        <EmptyState
          title={searchFilter ? "Không tìm thấy nhãn nào" : "Chưa có nhãn nào"}
          description={
            searchFilter
              ? `Không tìm thấy nhãn nào khớp với từ khóa "${searchFilter}".`
              : "Hệ thống chưa có nhãn phân loại nào. Hãy tạo nhãn đầu tiên."
          }
          actionText={searchFilter ? "Xóa bộ lọc" : "Tạo nhãn mới"}
          onAction={searchFilter ? () => setSearchFilter("") : openCreateModal}
        />
      )}

      {/* Tags Data Table */}
      {!isLoading && !error && filteredTags.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4">Mã ID</th>
                  <th scope="col" className="px-6 py-4">Huy hiệu xem trước</th>
                  <th scope="col" className="px-6 py-4">Tên nhãn</th>
                  <th scope="col" className="px-6 py-4">Mã màu HEX</th>
                  <th scope="col" className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTags.map((tag) => (
                  <tr key={tag.tagId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      #{tag.tagId}
                    </td>

                    <td className="px-6 py-4">
                      <TagBadge tag={tag} />
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900">
                      {tag.tagName}
                    </td>

                    <td className="px-6 py-4">
                      {tag.color ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-full border border-slate-300 shadow-2xs"
                            style={{ backgroundColor: tag.color }}
                          />
                          <code className="text-xs font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {tag.color}
                          </code>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Mặc định</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(tag)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                          title="Chỉnh sửa nhãn"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteDialog(tag)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Xóa nhãn"
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

      {/* Modal Create / Edit Tag */}
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
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-900/10 transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {modalMode === "create" ? "Thêm Nhãn mới" : "Chỉnh sửa Nhãn"}
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
                label="Tên nhãn (Tag Name)"
                name="tagName"
                required
                error={fieldErrors.tagName}
                hint="Tối đa 50 ký tự, không được trùng lặp"
              >
                <Input
                  ref={nameInputRef}
                  id="tagName"
                  value={formData.tagName}
                  onChange={(e) => setFormData({ ...formData, tagName: e.target.value })}
                  placeholder="Ví dụ: frontend, backend, bug, devops..."
                  hasError={Boolean(fieldErrors.tagName)}
                  disabled={isSubmitting}
                  maxLength={50}
                />
              </FormField>

              {/* Color Picker & Preset Selection */}
              <div className="space-y-2">
                <label htmlFor="tag-color" className="block text-sm font-medium text-slate-700">
                  Màu sắc (#RRGGBB)
                </label>

                <div className="flex items-center gap-3">
                  <input
                    id="tag-color-picker"
                    type="color"
                    value={formData.color || "#3B82F6"}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value.toUpperCase() })}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-slate-300 p-0.5 shadow-2xs"
                    disabled={isSubmitting}
                  />

                  <Input
                    id="tag-color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value.toUpperCase() })}
                    placeholder="#3B82F6"
                    hasError={Boolean(fieldErrors.color)}
                    disabled={isSubmitting}
                    maxLength={7}
                    className="font-mono"
                  />
                </div>

                {fieldErrors.color && (
                  <p className="text-xs font-medium text-rose-600 animate-in fade-in duration-150">
                    {fieldErrors.color}
                  </p>
                )}

                {/* Quick preset color buttons */}
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Bảng màu gợi ý:</p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c.hex })}
                        className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          formData.color.toUpperCase() === c.hex
                            ? "border-slate-900 ring-2 ring-indigo-400"
                            : "border-white shadow-2xs"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Live Preview */}
                <div className="pt-2">
                  <span className="text-xs text-slate-400 block mb-1">Xem trước hiển thị:</span>
                  <TagBadge
                    tag={{
                      tagId: 0,
                      tagName: formData.tagName.trim() || "preview",
                      color: formData.color,
                    }}
                  />
                </div>
              </div>

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
                  <span>{modalMode === "create" ? "Tạo nhãn" : "Lưu thay đổi"}</span>
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
        title="Xác nhận xóa nhãn"
        message={`Bạn có chắc chắn muốn xóa nhãn "${deletingTag?.tagName}" (#${deletingTag?.tagId})? Lưu ý: Nếu nhãn đang được gắn vào bất kỳ Công việc nào (kể cả công việc inactive), hệ thống sẽ từ chối thao tác.`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy"
        isDangerous
        isLoading={isDeleting}
      />
    </main>
  );
}
