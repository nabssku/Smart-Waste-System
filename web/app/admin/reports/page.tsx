'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  RotateCcw,
  Trash2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { StatusBadge, WasteTypeBadge } from '@/components/Badges';
import { reportsApi } from '@/lib/api';
import { PaginationMeta, Report, ReportStatus } from '@/lib/types';
import {
  formatDateTime,
  resolveImageUrl,
  STATUS_CONFIG,
} from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

export default function AdminReportsPage() {
  const { showToast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 8,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>('pending');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [updating, setUpdating] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getAll({
        page,
        limit: 8,
        status: statusFilter,
        waste_type: wasteTypeFilter,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setReports(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat daftar laporan.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, wasteTypeFilter, search, startDate, endDate, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setWasteTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const openStatusModal = (report: Report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setAdminNotes(report.adminNotes || '');
  };

  const handleQuickUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    if (newStatus === 'rejected' && !adminNotes.trim()) {
      showToast('Catatan admin wajib diisi sebagai alasan penolakan laporan.', 'error');
      return;
    }

    try {
      setUpdating(true);
      await reportsApi.updateStatus(selectedReport.id, newStatus, adminNotes.trim());
      showToast('Status laporan berhasil diperbarui.', 'success');
      setSelectedReport(null);
      fetchReports();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui status laporan.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReport = async (report: Report) => {
    const confirmed = window.confirm(
      `Hapus laporan "${report.title}" secara permanen?`
    );
    if (!confirmed) return;

    try {
      await reportsApi.remove(report.id);
      showToast('Laporan berhasil dihapus.', 'success');
      fetchReports();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus laporan.', 'error');
    }
  };

  return (
    <AppShell
      role="admin"
      title="Daftar Laporan Sampah"
      subtitle="Filter, verifikasi klasifikasi citra, dan perbarui status tindak lanjut."
      actions={
        <span className="font-mono text-xs text-[#525860] px-2.5 py-1 border border-[#DCDCD4] bg-white rounded">
          {pagination.total} Laporan
        </span>
      }
    >
      <div className="space-y-4">
        {/* Filter Bar */}
        <section className="bg-white border border-[#DCDCD4] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-3.5 h-3.5 text-[#525860] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari judul, deskripsi, alamat, atau pelapor..."
                className="w-full pl-9 pr-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#111315]"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs font-medium text-[#111315] focus:outline-none focus:border-[#111315]"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="in_progress">Diproses</option>
                <option value="completed">Selesai</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>

            <div>
              <select
                value={wasteTypeFilter}
                onChange={(e) => {
                  setWasteTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs font-medium text-[#111315] focus:outline-none focus:border-[#111315]"
              >
                <option value="all">Semua Material</option>
                <option value="organic">Organik</option>
                <option value="plastic">Plastik</option>
                <option value="paper">Kertas / Kardus</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="flex-1 px-2.5 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs font-mono text-[#111315]"
              />
              <span className="text-xs text-[#525860]">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="flex-1 px-2.5 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs font-mono text-[#111315]"
              />
              {(search ||
                statusFilter !== 'all' ||
                wasteTypeFilter !== 'all' ||
                startDate ||
                endDate) && (
                <button
                  onClick={handleResetFilters}
                  title="Reset Filter"
                  className="p-2 rounded border border-[#DCDCD4] bg-white hover:bg-[#FAF9F6] text-[#991B1B]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Reports Table */}
        <section className="bg-white border border-[#DCDCD4] overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center gap-2 text-xs text-[#525860]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat data laporan...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm font-semibold text-[#111315]">
                Tidak ada laporan yang cocok dengan filter
              </p>
              <p className="text-xs text-[#525860]">
                Ubah kata kunci pencarian atau atur ulang filter di atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DCDCD4] bg-[#FAF9F6] text-[11px] font-mono uppercase text-[#525860]">
                    <th className="py-3 px-4">Laporan & Titik Lokasi</th>
                    <th className="py-3 px-4">Pelapor</th>
                    <th className="py-3 px-4">Klasifikasi</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCDCD4] text-sm">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-[#FAF9F6] transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-3">
                          <img
                            src={resolveImageUrl(report.imageUrl)}
                            alt={report.title}
                            className="w-12 h-12 rounded-sm object-cover border border-[#DCDCD4] shrink-0 bg-[#F4F4F0]"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/reports/${report.id}`}
                              className="font-semibold text-[#111315] hover:underline line-clamp-1"
                            >
                              {report.title}
                            </Link>
                            <p className="text-xs text-[#525860] line-clamp-1 mt-0.5">
                              {report.description}
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-[#525860] mt-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {report.address ||
                                  `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-[#111315]">
                          {report.user?.name || 'Warga'}
                        </div>
                        <div className="text-[11px] font-mono text-[#525860]">
                          {report.user?.email || '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <WasteTypeBadge
                          type={report.wasteType}
                          confidence={report.aiConfidence}
                          showConfidence
                          size="sm"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={report.status} size="sm" />
                        {report.adminNotes && (
                          <div className="text-[11px] text-[#525860] line-clamp-1 mt-1 max-w-[180px]">
                            {report.adminNotes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-[#525860]">
                        {formatDateTime(report.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openStatusModal(report)}
                            className="px-2.5 py-1 rounded border border-[#DCDCD4] bg-white hover:bg-[#F4F4F0] text-xs font-medium text-[#111315]"
                          >
                            Ubah Status
                          </button>
                          <Link
                            href={`/admin/reports/${report.id}`}
                            className="px-2.5 py-1 rounded bg-[#111315] hover:bg-[#272B30] text-xs font-medium text-white"
                          >
                            Periksa
                          </Link>
                          <button
                            onClick={() => handleDeleteReport(report)}
                            className="p-1 rounded text-[#525860] hover:text-[#991B1B] hover:bg-[#FEE2E2]/50"
                            title="Hapus Laporan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-[#DCDCD4] bg-[#FAF9F6] flex items-center justify-between">
              <div className="text-xs font-mono text-[#525860]">
                Halaman {pagination.page} / {pagination.totalPages} ({pagination.total} data)
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DCDCD4] bg-white text-xs font-medium disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Sebelumnya
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DCDCD4] bg-white text-xs font-medium disabled:opacity-40"
                >
                  Berikutnya
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Quick Update Status Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#DCDCD4] max-w-md w-full">
            <div className="px-5 py-3.5 border-b border-[#DCDCD4] flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <h3 className="font-display font-bold text-sm text-[#111315]">
                  Perbarui Status Laporan
                </h3>
                <p className="text-xs text-[#525860] truncate max-w-xs">
                  {selectedReport.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1 text-[#525860] hover:text-[#111315]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickUpdateStatus} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1.5">
                  Status Penanganan Baru
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['pending', 'in_progress', 'completed', 'rejected'] as ReportStatus[]).map(
                    (st) => {
                      const cfg = STATUS_CONFIG[st];
                      const active = newStatus === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`flex items-center gap-2 p-2.5 rounded border text-left transition-colors ${
                            active
                              ? 'border-[#111315] bg-[#111315] text-white'
                              : 'border-[#DCDCD4] hover:bg-[#FAF9F6] text-[#111315]'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotClass}`} />
                          <span className="text-xs font-medium">{cfg.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Catatan Petugas {newStatus === 'rejected' && '(Wajib diisi)'}
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tulis instruksi penanganan atau alasan penolakan..."
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#111315]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="px-3.5 py-1.5 rounded border border-[#DCDCD4] text-xs font-medium text-[#111315]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-3.5 py-1.5 rounded bg-[#111315] text-white text-xs font-medium disabled:opacity-50"
                >
                  {updating ? 'Menyimpan...' : 'Simpan Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
