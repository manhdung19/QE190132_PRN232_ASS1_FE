"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiClient } from "@/lib/api";
import type { AccountResponse } from "@/lib/types";
import { useAdminSession } from "@/components/admin-session-context";
import { useToast } from "@/components/toast-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorAlert } from "@/components/ui/error-alert";

export default function AccountsPage() {
  const { account } = useAdminSession();
  const toast = useToast();
  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [editing, setEditing] = useState<AccountResponse | null>(null);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<0 | 1>(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<unknown>(null);
  const [deleting, setDeleting] = useState<AccountResponse | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await apiClient.accounts.getAll());
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (account.role !== 1) return;
    let cancelled = false;
    apiClient.accounts.getAll()
      .then((items) => { if (!cancelled) setAccounts(items); })
      .catch((cause) => { if (!cancelled) setError(cause); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [account.role]);

  if (account.role !== 1) {
    return <main className="mx-auto max-w-4xl px-4 py-16" role="alert">
      <h1 className="text-2xl font-bold text-slate-900">403 — Không có quyền truy cập</h1>
      <p className="mt-3 text-slate-600">Trang quản lý tài khoản chỉ dành cho Admin.</p>
    </main>;
  }

  function openEdit(item: AccountResponse) {
    setEditing(item);
    setFullName(item.fullName);
    setRole(item.role);
    setFormError(null);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) return;
    if (!fullName.trim()) {
      setFormError("Họ tên không được để trống.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await apiClient.accounts.update(editing.accountId, { fullName: fullName.trim(), role });
      setEditing(null);
      toast.success("Đã cập nhật tài khoản.");
      await loadAccounts();
    } catch (cause) {
      setFormError(cause);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting || deletePending) return;
    setDeletePending(true);
    setError(null);
    try {
      await apiClient.accounts.delete(deleting.accountId);
      setDeleting(null);
      toast.success("Đã xóa tài khoản.");
      await loadAccounts();
    } catch (cause) {
      setError(cause);
      setDeleting(null);
    } finally {
      setDeletePending(false);
    }
  }

  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Quản lý tài khoản</h1>
        <p className="mt-2 text-sm text-slate-600">Xem tài khoản, cập nhật họ tên và vai trò, hoặc xóa tài khoản hợp lệ.</p>
      </div>
      <button type="button" onClick={() => void loadAccounts()} disabled={loading}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Làm mới</button>
    </div>
    <ErrorAlert error={error} onRetry={loadAccounts} className="mb-5" />
    {loading ? <p role="status" className="text-sm text-slate-600">Đang tải tài khoản…</p> :
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>
            <th scope="col" className="px-4 py-3">Họ tên</th>
            <th scope="col" className="px-4 py-3">Email</th>
            <th scope="col" className="px-4 py-3">Vai trò</th>
            <th scope="col" className="px-4 py-3">Ngày tạo</th>
            <th scope="col" className="px-4 py-3">Thao tác</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map((item) => <tr key={item.accountId}>
              <td className="px-4 py-3 font-medium text-slate-900">{item.fullName}</td>
              <td className="px-4 py-3 text-slate-600">{item.email}</td>
              <td className="px-4 py-3">{item.role === 1 ? "Admin" : "Staff"}</td>
              <td className="px-4 py-3 text-slate-600">{new Date(item.createdDate).toLocaleDateString("vi-VN")}</td>
              <td className="px-4 py-3"><div className="flex gap-3">
                <button type="button" onClick={() => openEdit(item)} className="font-medium text-indigo-700 hover:underline">Sửa</button>
                <button type="button" onClick={() => setDeleting(item)} disabled={item.accountId === account.accountId}
                  title={item.accountId === account.accountId ? "Không thể xóa tài khoản đang đăng nhập" : undefined}
                  className="font-medium text-rose-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40">Xóa</button>
              </div></td>
            </tr>)}
          </tbody>
        </table>
        {accounts.length === 0 && <p className="p-6 text-center text-slate-500">Chưa có tài khoản.</p>}
      </div>}

    {editing && <div role="dialog" aria-modal="true" aria-labelledby="account-edit-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={save} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <h2 id="account-edit-title" className="text-xl font-semibold text-slate-900">Sửa tài khoản</h2>
        <p className="text-sm text-slate-600">{editing.email}</p>
        <label className="block text-sm font-medium text-slate-700" htmlFor="account-full-name">Họ tên</label>
        <input id="account-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={150}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <label className="block text-sm font-medium text-slate-700" htmlFor="account-role">Vai trò</label>
        <select id="account-role" value={role} onChange={(e) => setRole(Number(e.target.value) as 0 | 1)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value={0}>Staff</option><option value={1}>Admin</option>
        </select>
        <ErrorAlert error={formError} />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setEditing(null)} disabled={saving}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Hủy</button>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Đang lưu…" : "Lưu thay đổi"}</button>
        </div>
      </form>
    </div>}
    <ConfirmDialog isOpen={deleting !== null} onClose={() => setDeleting(null)} onConfirm={() => void confirmDelete()}
      title="Xác nhận xóa tài khoản" message={`Bạn có chắc muốn xóa tài khoản ${deleting?.fullName ?? ""}? Tài khoản đã tạo Task sẽ không thể xóa.`}
      confirmText="Xác nhận xóa" isDangerous isLoading={deletePending} />
  </main>;
}
