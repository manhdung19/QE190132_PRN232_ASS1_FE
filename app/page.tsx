import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ApiVerification } from "@/components/api-verification";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Header */}
      <div className="rounded-3xl border border-slate-200/80 bg-linear-to-b from-white to-slate-50/50 p-8 sm:p-12 shadow-xs">
        <PageHeader />
        
        {/* Quick Nav Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/departments"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
              Phòng ban
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Xem danh sách phòng ban và các dự án trực thuộc
            </p>
          </Link>

          <Link
            href="/search"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 group-hover:text-blue-600">
              Tìm kiếm Task
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Bộ lọc đa điều kiện theo tiêu đề, trạng thái, độ ưu tiên, tag
            </p>
          </Link>

          <Link
            href="/tasks/manage"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 group-hover:text-emerald-600">
              Quản lý Task
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Thêm mới, cập nhật, gắn thẻ nhãn và xóa mềm công việc
            </p>
          </Link>

          <Link
            href="/projects/manage"
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900 group-hover:text-amber-600">
              Quản lý Dự án
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Theo dõi tiến độ, phòng ban phụ trách và thời hạn dự án
            </p>
          </Link>
        </div>
      </div>

      {/* Task 001 Real API Verification Panel */}
      <ApiVerification />
    </main>
  );
}
