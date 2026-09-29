import React from "react";
import { ApiError } from "@/lib/api-client";

interface ErrorAlertProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({
  error,
  title,
  onRetry,
  className = "",
}: ErrorAlertProps) {
  if (!error) return null;

  let heading = title;
  let message = "Đã xảy ra lỗi không mong muốn.";
  let fieldErrors: Array<{ field: string; message: string }> = [];

  if (error instanceof ApiError) {
    heading = heading || (error.status === 404 ? "Không tìm thấy" : error.status === 400 ? "Lỗi dữ liệu" : error.title);
    message = error.getUserMessage();

    // Collect field errors if status is 400
    if (error.errors) {
      fieldErrors = Object.entries(error.errors).flatMap(([field, msgs]) =>
        msgs.map((m) => ({ field, message: m }))
      );
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  }

  return (
    <div
      role="alert"
      className={`rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 shrink-0 text-rose-600 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        <div className="flex-1">
          {heading && <h4 className="text-sm font-semibold text-rose-900">{heading}</h4>}
          <p className="mt-1 text-sm text-rose-700">{message}</p>

          {fieldErrors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-rose-700 space-y-1">
              {fieldErrors.map((err, idx) => (
                <li key={idx}>
                  <strong className="font-medium capitalize">{err.field}:</strong> {err.message}
                </li>
              ))}
            </ul>
          )}

          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 rounded-md bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-200 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Thử lại
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
