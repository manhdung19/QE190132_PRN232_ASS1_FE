"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiClient, ApiError } from "@/lib/api";
import { ProjectListItem, ProjectStatus } from "@/lib/types";
import { ProjectStatusBadge } from "@/components/badges";
import { formatDate } from "@/lib/constants";
import { ErrorAlert } from "@/components/ui/error-alert";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonBlock } from "@/components/ui/loading";
import { ApiVerification } from "@/components/api-verification";

export default function Home() {
  const [departmentCount, setDepartmentCount] = useState<number | null>(null);
  const [taskCount, setTaskCount] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | Error | string | null>(null);
  const [showDevPanel, setShowDevPanel] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Parallel fetch from the 3 real endpoints: departments, projects, tasks
      const [departmentsData, projectsData, tasksData] = await Promise.all([
        apiClient.departments.getAll(),
        apiClient.projects.getAll(),
        apiClient.tasks.getAll(),
      ]);

      setDepartmentCount(departmentsData.length);
      setProjects(projectsData);
      setTaskCount(tasksData.length);
    } catch (err: unknown) {
      setError(err instanceof ApiError || err instanceof Error ? err : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      apiClient.departments.getAll(),
      apiClient.projects.getAll(),
      apiClient.tasks.getAll(),
    ])
      .then(([departmentsData, projectsData, tasksData]) => {
        if (!ignore) {
          setDepartmentCount(departmentsData.length);
          setProjects(projectsData);
          setTaskCount(tasksData.length);
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

  // Compute breakdown stats for active projects
  const inProgressProjects = projects.filter((p) => p.status === ProjectStatus.InProgress).length;
  const completedProjects = projects.filter((p) => p.status === ProjectStatus.Completed).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* 1. Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-900 via-indigo-800 to-slate-900 p-8 sm:p-12 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Hệ thống Quản lý Task & Đội nhóm
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
            Không gian làm việc <span className="bg-linear-to-r from-indigo-200 to-white bg-clip-text text-transparent">TaskTrack</span>
          </h1>

          <p className="mt-4 text-base text-indigo-100/90 leading-relaxed sm:text-lg">
            Theo dõi phòng ban, dự án, công việc và gắn nhãn phân loại trong một hệ thống đồng nhất. Dữ liệu thời gian thực được đồng bộ trực tiếp với máy chủ.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/departments"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-900 shadow-md hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-900"
            >
              <span>Xem Phòng ban</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500/30 transition-all backdrop-blur-xs"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Tìm kiếm Task</span>
            </Link>

            <Link
              href="/tasks/manage"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500/30 transition-all backdrop-blur-xs"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tạo công việc mới</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Error Display if fetch failed */}
      {error && (
        <section>
          <ErrorAlert
            error={error}
            title="Không thể tải dữ liệu Dashboard"
            onRetry={fetchDashboardData}
          />
        </section>
      )}

      {/* 3. Three KPI Summary Metrics Cards */}
      <section>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Departments */}
          <Link
            href="/departments"
            className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Phòng ban hoạt động
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  {isLoading ? (
                    <SkeletonBlock className="h-9 w-16" />
                  ) : (
                    <span className="text-3xl font-extrabold text-slate-900">
                      {departmentCount ?? 0}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">phòng ban</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
              <span>Xem danh sách chi tiết</span>
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card 2: Projects */}
          <Link
            href="/projects/manage"
            className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Dự án đang theo dõi
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  {isLoading ? (
                    <SkeletonBlock className="h-9 w-16" />
                  ) : (
                    <span className="text-3xl font-extrabold text-slate-900">
                      {projects.length}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">dự án active</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>{inProgressProjects} đang làm • {completedProjects} hoàn thành</span>
              <span className="font-medium text-blue-600 group-hover:text-blue-700">Quản lý</span>
            </div>
          </Link>

          {/* Card 3: Tasks */}
          <Link
            href="/search"
            className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Công việc hoạt động
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  {isLoading ? (
                    <SkeletonBlock className="h-9 w-16" />
                  ) : (
                    <span className="text-3xl font-extrabold text-slate-900">
                      {taskCount ?? 0}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">task trong hệ thống</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600 group-hover:text-emerald-700">
              <span>Tra cứu & Lọc công việc</span>
              <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Active Projects Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Dự án đang hoạt động
              </h2>
              {!isLoading && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {projects.length}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Danh sách các dự án khả dụng cùng phòng ban phụ trách và tiến độ hiện tại.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            >
              <svg
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Làm mới</span>
            </button>
            <Link
              href="/projects/manage"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Thêm dự án</span>
            </Link>
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <SkeletonBlock className="h-5 w-2/3" />
                  <SkeletonBlock className="h-5 w-20 rounded-full" />
                </div>
                <SkeletonBlock className="h-4 w-1/3" />
                <SkeletonBlock className="h-10 w-full" />
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && projects.length === 0 && (
          <EmptyState
            title="Không có dự án nào"
            description="Hiện chưa có dự án hoạt động nào trong hệ thống. Hãy bắt đầu bằng cách thêm dự án mới."
            actionText="Tạo dự án ngay"
            actionHref="/projects/manage"
          />
        )}

        {/* Project Cards Grid */}
        {!isLoading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <Link
                key={project.projectId}
                href={`/projects/${project.projectId}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-indigo-400 hover:shadow-lg transition-all"
              >
                <div>
                  {/* Top: Project Name & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {project.projectName}
                    </h3>
                    <ProjectStatusBadge status={project.status} />
                  </div>

                  {/* Department info */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>{project.departmentName}</span>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {project.description || "Không có mô tả chi tiết cho dự án này."}
                  </p>
                </div>

                {/* Footer: Timeline dates & Details link */}
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

      {/* 5. Collapsible Developer / API Verification Panel */}
      <section className="pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setShowDevPanel((prev) => !prev)}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg
            className={`h-4 w-4 transition-transform ${showDevPanel ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span>{showDevPanel ? "Ẩn công cụ kiểm tra API (Task 001)" : "Hiển thị công cụ kiểm tra API (Task 001 Validation Tool)"}</span>
        </button>

        {showDevPanel && (
          <div className="mt-4 animate-in fade-in duration-200">
            <ApiVerification />
          </div>
        )}
      </section>
    </main>
  );
}
