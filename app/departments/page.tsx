"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { DepartmentListItem } from "@/lib/types";
import { ActiveBadge } from "@/components/badges";
import { SkeletonBlock } from "@/components/ui/loading";
import { ErrorAlert } from "@/components/ui/error-alert";
import { EmptyState } from "@/components/ui/empty-state";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | string | null>(null);

  const fetchDepartments = useCallback(async (query: string = "") => {
    setIsLoading(true);
    setError(null);
    try {
      let data: DepartmentListItem[];
      const trimmed = query.trim();
      if (trimmed) {
        data = await apiClient.departments.search({ name: trimmed });
      } else {
        data = await apiClient.departments.getAll();
      }
      setDepartments(data);
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDepartments(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchDepartments("");
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-900">Phòng ban</span>
      </nav>

      {/* Page Header with Search & Manage Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Danh sách Phòng ban
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Khám phá các bộ phận trong tổ chức và theo dõi các dự án trực thuộc từng phòng ban.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/departments/manage"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Quản lý Phòng ban</span>
          </Link>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="relative max-w-md">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên phòng ban..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-20 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors shadow-2xs"
          />
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="absolute inset-y-0 right-1 flex items-center gap-1 pr-1">
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              Tìm
            </button>
          </div>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          error={error}
          title="Không thể tải danh sách phòng ban"
          onRetry={() => fetchDepartments(searchQuery)}
        />
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <SkeletonBlock className="h-6 w-2/3" />
                <SkeletonBlock className="h-5 w-20 rounded-full" />
              </div>
              <SkeletonBlock className="h-14 w-full" />
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && departments.length === 0 && (
        <EmptyState
          title={searchQuery ? "Không tìm thấy phòng ban phù hợp" : "Chưa có phòng ban nào"}
          description={
            searchQuery
              ? `Không có phòng ban nào có tên chứa "${searchQuery}". Hãy thử tìm kiếm với từ khóa khác.`
              : "Hệ thống hiện tại chưa có phòng ban nào hoạt động."
          }
          actionText={searchQuery ? "Xóa bộ lọc tìm kiếm" : "Thêm phòng ban mới"}
          onAction={searchQuery ? handleClearSearch : undefined}
          actionHref={searchQuery ? undefined : "/departments/manage"}
        />
      )}

      {/* Department Cards Grid */}
      {!isLoading && !error && departments.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Tìm thấy <strong className="font-semibold text-slate-800">{departments.length}</strong> phòng ban hoạt động
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => (
              <Link
                key={dept.departmentId}
                href={`/departments/${dept.departmentId}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-indigo-400 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {dept.departmentName}
                      </h2>
                    </div>

                    <ActiveBadge isActive={dept.isActive} />
                  </div>

                  <p className="mt-4 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {dept.departmentDescription}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">ID: #{dept.departmentId}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-700">
                    Chi tiết & Dự án
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
