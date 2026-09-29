import React from "react";

// ==================== SPINNER ====================
export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  }[size];

  return (
    <div
      role="status"
      aria-label="Đang tải dữ liệu"
      className={`inline-block animate-spin rounded-full border-solid border-indigo-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses} ${className}`}
    >
      <span className="sr-only">Đang tải...</span>
    </div>
  );
}

// ==================== LOADING OVERLAY / CARD ====================
export function LoadingCard({
  message = "Đang tải dữ liệu...",
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 rounded-xl border border-slate-200 bg-white/70 backdrop-blur-sm shadow-sm ${className}`}
    >
      <LoadingSpinner size="md" />
      <p className="mt-3 text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}

// ==================== SKELETON LOADER ====================
export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-5 w-1/3" />
        <SkeletonBlock className="h-6 w-20 rounded-full" />
      </div>
      <SkeletonBlock className="mt-4 h-4 w-full" />
      <SkeletonBlock className="mt-2 h-4 w-2/3" />
      <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-4 w-16" />
      </div>
    </div>
  );
}
