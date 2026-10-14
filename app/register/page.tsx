"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api";
import { validateRegister, type RegisterFormValues } from "@/lib/auth-form-validation";
import { FormField, Input } from "@/components/ui/form-controls";
import { ErrorAlert } from "@/components/ui/error-alert";

const initialValues: RegisterFormValues = { fullName: "", email: "", password: "", confirmPassword: "" };

export default function RegisterPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormValues, string>>>({});
  const [requestError, setRequestError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const validation = validateRegister(values);
    setErrors(validation);
    setRequestError(null);
    if (Object.keys(validation).length) return;
    setSubmitting(true);
    try {
      await apiClient.auth.register({
        fullName: values.fullName.trim(), email: values.email.trim().toLowerCase(), password: values.password,
      });
      setValues(initialValues);
      router.replace("/login?registered=1");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409)
        setErrors({ email: "Email này đã được đăng ký." });
      else if (error instanceof ApiError && error.status === 400)
        setErrors({
          fullName: error.getFieldError("fullName") ?? undefined,
          email: error.getFieldError("email") ?? undefined,
          password: error.getFieldError("password") ?? undefined,
        });
      setRequestError(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-indigo-600">TaskTrack</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Tạo tài khoản Staff</h1>
        <p className="mt-2 text-sm text-slate-600">Đăng ký để quản lý phòng ban, dự án, công việc và nhãn.</p>
        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <FormField label="Họ tên" name="fullName" required error={errors.fullName}>
            <Input id="fullName" name="fullName" autoComplete="name" maxLength={150} required
              value={values.fullName} onChange={(e) => setValues({ ...values, fullName: e.target.value })}
              hasError={!!errors.fullName} disabled={submitting} />
          </FormField>
          <FormField label="Email" name="email" required error={errors.email}>
            <Input id="email" name="email" type="email" autoComplete="email" maxLength={320} required
              value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })}
              hasError={!!errors.email} disabled={submitting} />
          </FormField>
          <FormField label="Mật khẩu" name="password" required error={errors.password} hint="Ít nhất 8 ký tự.">
            <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required
              value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })}
              hasError={!!errors.password} disabled={submitting} />
          </FormField>
          <FormField label="Xác nhận mật khẩu" name="confirmPassword" required error={errors.confirmPassword}>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required
              value={values.confirmPassword} onChange={(e) => setValues({ ...values, confirmPassword: e.target.value })}
              hasError={!!errors.confirmPassword} disabled={submitting} />
          </FormField>
          <ErrorAlert error={requestError} />
          <button type="submit" disabled={submitting}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Đang đăng ký…" : "Đăng ký"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">Đã có tài khoản? <Link href="/login" className="font-semibold text-indigo-700 hover:underline">Đăng nhập</Link></p>
      </div>
    </main>
  );
}
