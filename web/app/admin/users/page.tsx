'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  Edit3,
  Trash2,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { usersApi, getStoredUser } from '@/lib/api';
import { PaginationMeta, Role, User } from '@/lib/types';
import { formatDateShort } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const currentUser = getStoredUser();

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<Role>('user');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await usersApi.getAll({
        page,
        limit: 10,
        search: search.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      });
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat daftar pengguna.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPhone(u.phone || '');
    setEditRole(u.role);
    setEditPassword('');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setSaving(true);
      await usersApi.update(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        role: editRole,
        password: editPassword.trim() ? editPassword.trim() : undefined,
      });
      showToast(`Data pengguna ${editName} berhasil diperbarui.`, 'success');
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui pengguna.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === currentUser?.id) {
      showToast('Tidak dapat menghapus akun sendiri.', 'error');
      return;
    }
    const ok = window.confirm(`Hapus pengguna "${u.name}" (${u.email})?`);
    if (!ok) return;

    try {
      await usersApi.remove(u.id);
      showToast('Pengguna berhasil dihapus.', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus pengguna.', 'error');
    }
  };

  return (
    <AppShell
      role="admin"
      title="Data Pengguna"
      subtitle="Daftar warga pelapor dan administrator sistem."
      actions={
        <span className="font-mono text-xs text-[#525860] px-2.5 py-1 border border-[#DCDCD4] bg-white rounded">
          {pagination.total} Akun
        </span>
      }
    >
      <div className="space-y-4">
        {/* Filter Bar */}
        <section className="bg-white border border-[#DCDCD4] p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#525860] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama atau email..."
              className="w-full pl-9 pr-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#111315]"
            />
          </div>

          <div className="w-full sm:w-52">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs font-medium text-[#111315] focus:outline-none focus:border-[#111315]"
            >
              <option value="all">Semua Role</option>
              <option value="user">Warga (User)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </section>

        {/* Users Table */}
        <section className="bg-white border border-[#DCDCD4] overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-xs text-[#525860]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat daftar pengguna...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#525860]">
              Tidak ada pengguna yang sesuai dengan pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DCDCD4] bg-[#FAF9F6] text-[11px] font-mono uppercase text-[#525860]">
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Email & Telepon</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Laporan</th>
                    <th className="py-3 px-4">Terdaftar</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCDCD4] text-sm">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#111315] flex items-center gap-2">
                          {u.name}
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F4F0] border border-[#DCDCD4]">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-[#525860]">
                          {u.id.slice(0, 8)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-mono text-[#111315]">{u.email}</div>
                        <div className="text-[11px] text-[#525860]">{u.phone || '-'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono uppercase border ${
                            u.role === 'admin'
                              ? 'bg-[#111315] text-white border-[#111315]'
                              : 'bg-[#FAF9F6] text-[#525860] border-[#DCDCD4]'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs tabular-nums text-[#111315]">
                        {u.reportsCount ?? 0}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-[#525860]">
                        {formatDateShort(u.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DCDCD4] bg-white hover:bg-[#F4F4F0] text-xs font-medium text-[#111315]"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 rounded text-[#525860] hover:text-[#991B1B]"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[#DCDCD4] bg-[#FAF9F6] flex items-center justify-between">
              <span className="text-xs font-mono text-[#525860]">
                Halaman {pagination.page} / {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1 rounded border border-[#DCDCD4] bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="p-1 rounded border border-[#DCDCD4] bg-white disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#DCDCD4] max-w-md w-full">
            <div className="px-5 py-3.5 border-b border-[#DCDCD4] bg-[#FAF9F6] flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#111315]">Edit Akun Pengguna</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-[#525860] hover:text-[#111315]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Role Akses
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] text-xs"
                >
                  <option value="user">Warga Pelapor (user)</option>
                  <option value="admin">Administrator (admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Password Baru (Kosongkan bila tidak diubah)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-1.5 rounded border border-[#DCDCD4] text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded bg-[#111315] text-white text-xs font-medium"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
