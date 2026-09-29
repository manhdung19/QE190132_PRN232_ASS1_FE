"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api";
import { DepartmentDetail } from "@/lib/types";
import { ProjectStatusBadge, ActiveBadge } from "@/components/badges";
import { formatDate } from "@/lib/constants";
import { SkeletonBlock } from "@/components/ui/loading";
import { ErrorAlert } from "@/components/ui/error-alert";
import { EmptyState } from "@/components/ui/empty-state";

export default function DepartmentDetailPage() {
  const params = useParams<{ id: string }>();
  const departmentId = Number(params?.id);

  const [department, setDepartment] = useState<DepartmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | string | null>(null);

  const fetchDepartment = useCallback(async () => {
    if (!departmentId || isNaN(departmentId)) {
      setError(new Error("Mã phòng ban không hợp lệ."));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.departments.getById(departmentId);
      setDepartment(data);
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    if (!departmentId || isNaN(departmentId)) {
      return;
    }
    let ignore = false;
    apiClient.departments
      .getById(departmentId)
      .then((data) => {
        if (!ignore) {
          setDepartment(data);
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
  }, [departmentId]);

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
        <span className="font-medium text-slate-900">
          {department ? department.departmentName : `Phòng ban #${departmentId}`}
        </span>
      </nav>

      {/* Error state (404 or connection error) */}
      {error && (
        <div className="space-y-4">
          <ErrorAlert
            error={error}
            title={
              error instanceof ApiError && error.status === 404
                ? "Không tìm thấy phòng ban"
                : "Lỗi tải thông tin chi tiết phòng ban"
            }
            onRetry={fetchDepartment}
          />
          <div>
            <Link
              href="/departments"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Quay lại danh sách phòng ban</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <SkeletonBlock className="h-5 w-2/3" />
                  <SkeletonBlock className="h-10 w-full" />
                  <SkeletonBlock className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Department Info Header */}
      {!isLoading && !error && department && (
        <div className="space-y-8">
          <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {department.departmentName}
                    </h1>
                    <span className="text-xs font-mono text-slate-400">
                      Mã định danh: #{department.departmentId}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed pt-2">
                  {department.departmentDescription}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  <ActiveBadge isActive={department.isActive} />
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 font-medium">
                    {department.projects.length} dự án trực thuộc
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/departments"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Tất cả phòng ban</span>
                </Link>

                <Link
                  href="/departments/manage"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Quản lý / Chỉnh sửa</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Related Projects Section */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Dự án trực thuộc
                  </h2>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {department.projects.length}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Các dự án đang được phân công cho phòng ban {department.departmentName}.
                </p>
              </div>

              <Link
                href="/projects/manage"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs"
              >
                <svg className="h-3.5 w-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Tạo dự án mới</span>
              </Link>
            </div>

            {/* Empty Projects State */}
            {department.projects.length === 0 ? (
              <EmptyState
                title="Chưa có dự án nào"
                description={`Phòng ban "${department.departmentName}" hiện chưa có dự án hoạt động nào.`}
                actionText="Tạo dự án cho phòng ban này"
                actionHref="/projects/manage"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {department.projects.map((project) => (
                  <Link
                    key={project.projectId}
                    href={`/projects/${project.projectId}`}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-indigo-400 hover:shadow-lg transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {project.projectName}
                        </h3>
                        <ProjectStatusBadge status={project.status} />
                      </div>

                      <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {project.description || "Chưa có mô tả chi tiết cho dự án này."}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(project.startDate)}</span>
                        {project.endDate && (
                          <>
                            <span className="text-slate-300">→</span>
                            <span>{formatDate(project.endDate)}</span>
                          </>
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
