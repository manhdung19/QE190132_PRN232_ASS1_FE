"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, ApiError, saveSession } from "@/lib/api";
import { validateLogin, type LoginFormValues } from "@/lib/auth-form-validation";
import { FormField, Input } from "@/components/ui/form-controls";
import { ErrorAlert } from "@/components/ui/error-alert";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});
  const [requestError, setRequestError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validation = validateLogin(values);
    setErrors(validation);
    setRequestError(null);
    if (Object.keys(validation).length) return;
    setSubmitting(true);
    try {
      const response = await apiClient.auth.login({ email: values.email.trim().toLowerCase(), password: values.password });
      saveSession(response);
      setValues({ email: "", password: "" });
      router.replace("/admin");
    } catch (error) {
      setRequestError(error instanceof ApiError && error.status === 401
        ? "Email hoặc mật khẩu không đúng." : error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-indigo-600">TaskTrack</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Đăng nhập</h1>
        <p className="mt-2 text-sm text-slate-600">Dùng tài khoản Staff hoặc Admin để quản lý dữ liệu.</p>
        {searchParams.get("registered") === "1" && (
          <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Đăng ký thành công. Vui lòng đăng nhập.
          </p>
        )}
        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <FormField label="Email" name="email" required error={errors.email}>
            <Input id="email" name="email" type="email" autoComplete="email" required
              value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })}
              hasError={!!errors.email} disabled={submitting} />
          </FormField>
          <FormField label="Mật khẩu" name="password" required error={errors.password}>
            <Input id="password" name="password" type="password" autoComplete="current-password" required
              value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })}
              hasError={!!errors.password} disabled={submitting} />
          </FormField>
          <ErrorAlert error={requestError} />
          <button type="submit" disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">Chưa có tài khoản? <Link href="/register" className="font-semibold text-indigo-700 hover:underline">Đăng ký</Link></p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="mx-auto max-w-md p-8 text-sm text-slate-600">Đang tải…</div>}><LoginForm /></Suspense>;
}
