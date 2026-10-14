"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { loadDashboardCounts, type DashboardCounts } from "@/lib/dashboard";
import { useAdminSession } from "@/components/admin-session-context";
import { ErrorAlert } from "@/components/ui/error-alert";

const sections = [
  { key: "departments", label: "Phòng ban", href: "/admin/departments", description: "Quản lý cơ cấu nhóm" },
  { key: "projects", label: "Dự án", href: "/admin/projects", description: "Theo dõi dự án" },
  { key: "tasks", label: "Công việc", href: "/admin/tasks", description: "Cập nhật tiến độ" },
  { key: "tags", label: "Nhãn", href: "/admin/tags", description: "Phân loại công việc" },
] as const;

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const { account } = useAdminSession();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCounts(await loadDashboardCounts());
    } catch (reason) {
      setError(reason);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadDashboardCounts()
      .then((data) => {
        if (active) { setCounts(data); setLoading(false); }
      })
      .catch((reason: unknown) => {
        if (active) { setError(reason); setLoading(false); }
      });
    return () => { active = false; };
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Khu vực quản lý</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Tổng quan TaskTrack</h1>
        <p className="mt-2 text-slate-600">Xin chào {account.fullName}. Chọn mục cần quản lý bên dưới.</p>
      </div>
      <ErrorAlert error={error} onRetry={() => void refresh()} className="mb-6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => (
          <Link key={section.key} href={section.href}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
            <p className="text-sm font-medium text-slate-600">{section.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900" aria-label={`Tổng ${section.label}`}>
              {loading ? "…" : counts?.[section.key] ?? "—"}
            </p>
            <p className="mt-3 text-sm text-slate-500">{section.description}</p>
            <span className="mt-5 inline-block text-sm font-semibold text-indigo-700">Mở quản lý →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
