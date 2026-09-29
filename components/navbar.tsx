"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manageDropdownOpen, setManageDropdownOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close menus on route change without useEffect setState
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setManageDropdownOpen(false);
  }

  const isHome = pathname === "/";
  const isDepartments = pathname.startsWith("/departments") && !pathname.includes("/manage");
  const isSearch = pathname === "/search";
  const isManage = pathname.includes("/manage");

  const manageLinks = [
    { href: "/departments/manage", label: "Quản lý Phòng ban", desc: "Thêm, sửa, xóa phòng ban" },
    { href: "/projects/manage", label: "Quản lý Dự án", desc: "Thêm, sửa, xóa dự án" },
    { href: "/tasks/manage", label: "Quản lý Công việc", desc: "Thêm, sửa, xóa công việc" },
    { href: "/tags/manage", label: "Quản lý Nhãn", desc: "Thêm, sửa, xóa nhãn phân loại" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm group-hover:bg-indigo-700 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                TaskTrack
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400">
                PRN232
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isHome
                  ? "bg-slate-100 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Trang chủ
            </Link>
            <Link
              href="/departments"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isDepartments
                  ? "bg-slate-100 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Phòng ban
            </Link>
            <Link
              href="/search"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isSearch
                  ? "bg-slate-100 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Tìm kiếm Task
            </Link>

            {/* Manage Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setManageDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isManage
                    ? "bg-slate-100 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                aria-expanded={manageDropdownOpen}
              >
                <span>Quản lý</span>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${
                    manageDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {manageDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setManageDropdownOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 sm:left-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-slate-900/5 z-20 animate-in fade-in zoom-in-95 duration-150">
                    {manageLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                          pathname === item.href
                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                        onClick={() => setManageDropdownOpen(false)}
                      >
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-slate-400">{item.desc}</div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* Right side quick actions / API status indicator */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm
          </Link>
          <Link
            href="/tasks/manage"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo Task
          </Link>
        </div>

        {/* Mobile menu hamburger button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
            aria-label="Mở menu điều hướng"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-1 animate-in slide-in-from-top duration-200">
          <Link
            href="/"
            className={`block rounded-lg px-3 py-2 text-base font-medium ${
              isHome ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            Trang chủ
          </Link>
          <Link
            href="/departments"
            className={`block rounded-lg px-3 py-2 text-base font-medium ${
              isDepartments ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            Phòng ban
          </Link>
          <Link
            href="/search"
            className={`block rounded-lg px-3 py-2 text-base font-medium ${
              isSearch ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            Tìm kiếm Task
          </Link>

          <div className="pt-2 pb-1 border-t border-slate-100">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quản lý tài nguyên
            </p>
          </div>
          {manageLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === item.href
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
