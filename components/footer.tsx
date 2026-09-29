import React from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">TaskTrack</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">PRN232 Assignment 1 — Team & Task Management</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Trang chủ
            </Link>
            <Link href="/departments" className="hover:text-slate-900 transition-colors">
              Phòng ban
            </Link>
            <Link href="/search" className="hover:text-slate-900 transition-colors">
              Tìm kiếm
            </Link>
            <Link href="/tasks/manage" className="hover:text-slate-900 transition-colors">
              Quản lý Task
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>API:</span>
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 font-mono text-[11px]">
              {API_BASE_URL}
            </code>
          </div>
        </div>
      </div>
    </footer>
  );
}
