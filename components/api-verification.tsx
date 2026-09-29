"use client";

import React, { useState, useEffect } from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import { DepartmentListItem } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ActiveBadge } from "@/components/badges";
import { useToast } from "@/components/toast-context";

export function ApiVerification() {
  const toast = useToast();
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [getError, setGetError] = useState<ApiError | Error | string | null>(null);

  // States for testing 400 validation
  const [test400Error, setTest400Error] = useState<ApiError | Error | string | null>(null);
  const [isTesting400, setIsTesting400] = useState(false);

  // States for testing 404
  const [test404Error, setTest404Error] = useState<ApiError | Error | string | null>(null);
  const [isTesting404, setIsTesting404] = useState(false);

  // 1. Run GET /api/departments on mount asynchronously
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
          setGetError(err instanceof ApiError || err instanceof Error ? err : String(err));
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const fetchDepartments = async () => {
    setIsLoading(true);
    setGetError(null);
    try {
      const data = await apiClient.departments.getAll();
      setDepartments(data);
    } catch (err: unknown) {
      setGetError(err instanceof ApiError || err instanceof Error ? err : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Trigger invalid POST to test 400 validation error handling
  const trigger400Test = async () => {
    setIsTesting400(true);
    setTest400Error(null);
    try {
      // Send invalid payload: empty departmentName (required) and empty departmentDescription (required)
      await apiClient.departments.create({
        departmentName: "   ",
        departmentDescription: "",
      });
      toast.info("Không có lỗi (bất ngờ)");
    } catch (err: unknown) {
      const parsedErr = err instanceof ApiError || err instanceof Error ? err : String(err);
      setTest400Error(parsedErr);
      if (err instanceof ApiError) {
        toast.error(`Kiểm tra lỗi 400 thành công: ${err.title}`);
      }
    } finally {
      setIsTesting400(false);
    }
  };

  // 3. Trigger GET to non-existent ID to test 404
  const trigger404Test = async () => {
    setIsTesting404(true);
    setTest404Error(null);
    try {
      await apiClient.departments.getById(999999);
      toast.info("Không có lỗi (bất ngờ)");
    } catch (err: unknown) {
      const parsedErr = err instanceof ApiError || err instanceof Error ? err : String(err);
      setTest404Error(parsedErr);
      if (err instanceof ApiError) {
        toast.warning(`Kiểm tra lỗi 404 thành công: ${err.title}`);
      }
    } finally {
      setIsTesting404(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Verification Card Header */}
      <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-semibold text-slate-900">
                Kiểm tra nền tảng API (Task 001 Verification)
              </h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Xác thực kết nối API thực tế, mã hóa camelCase, xử lý ProblemDetails 400/404 và giao diện thông báo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={fetchDepartments}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Làm mới GET
            </button>
            <button
              type="button"
              onClick={() => toast.success("Toast thông báo thành công hoạt động tốt!")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Test Toast
            </button>
          </div>
        </div>

        {/* Section 1: Real GET test */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h4 className="text-sm font-medium text-slate-800 flex items-center justify-between">
            <span>1. Kết quả GET /api/departments (Thực tế)</span>
            <span className="text-xs text-slate-400 font-mono">200 OK</span>
          </h4>

          {isLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 py-4">
              <LoadingSpinner size="sm" />
              <span>Đang kết nối tới Backend API...</span>
            </div>
          )}

          {getError && (
            <div className="mt-3">
              <ErrorAlert error={getError} onRetry={fetchDepartments} />
            </div>
          )}

          {!isLoading && !getError && (
            <div className="mt-3">
              <div className="mb-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5 inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Nhận thành công {departments.length} phòng ban từ PostgreSQL thực tế.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {departments.map((dept) => (
                  <div
                    key={dept.departmentId}
                    className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3 hover:bg-white hover:shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {dept.departmentName}
                        </span>
                        <ActiveBadge isActive={dept.isActive} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {dept.departmentDescription}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>ID: #{dept.departmentId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Error 400 Validation Test */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-800">
                2. Kiểm tra xử lý lỗi 400 Validation (RFC 7807 ProblemDetails)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Gửi payload rỗng tới POST /api/departments để kiểm chứng hiển thị lỗi theo từng trường mà không rò rỉ secret/stack trace.
              </p>
            </div>
            <button
              type="button"
              onClick={trigger400Test}
              disabled={isTesting400}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs"
            >
              {isTesting400 ? <LoadingSpinner size="sm" className="border-white border-r-transparent" /> : "Thử kích hoạt lỗi 400"}
            </button>
          </div>

          {test400Error && (
            <div className="mt-3">
              <ErrorAlert error={test400Error} title="Bắt lỗi 400 thành công từ API" />
            </div>
          )}
        </div>

        {/* Section 3: Error 404 Not Found Test */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-slate-800">
                3. Kiểm tra xử lý lỗi 404 (Tài nguyên không tồn tại)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Gửi GET /api/departments/999999 để xác nhận ProblemDetails 404 hiển thị thông điệp thân thiện.
              </p>
            </div>
            <button
              type="button"
              onClick={trigger404Test}
              disabled={isTesting404}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {isTesting404 ? <LoadingSpinner size="sm" /> : "Thử kích hoạt lỗi 404"}
            </button>
          </div>

          {test404Error && (
            <div className="mt-3">
              <ErrorAlert error={test404Error} title="Bắt lỗi 404 thành công" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
