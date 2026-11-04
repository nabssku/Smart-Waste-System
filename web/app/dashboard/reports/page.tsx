'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  MapPin,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { StatusBadge, WasteTypeBadge } from '@/components/Badges';
import { reportsApi } from '@/lib/api';
import { PaginationMeta, Report } from '@/lib/types';
import { formatDateTime, resolveImageUrl } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

export default function UserReportsHistoryPage() {
  const { showToast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [wasteTypeFilter, setWasteTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchMyReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getMy({
        page,
        limit: 6,
        status: statusFilter,
        waste_type: wasteTypeFilter,
        search: search.trim() || undefined,
      });
      setReports(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat riwayat laporan Anda.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, wasteTypeFilter, search, showToast]);

  useEffect(() => {
    fetchMyReports();
  }, [fetchMyReports]);

  const handleDelete = async (report: Report) => {
    const ok = window.confirm(`Hapus laporan "${report.title}"?`);
    if (!ok) return;

    try {
      await reportsApi.remove(report.id);
      showToast('Laporan berhasil dihapus.', 'success');
      fetchMyReports();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus laporan.', 'error');
    }
  };

  return (
    <AppShell
      role="user"
      title="Riwayat Laporan Saya"
      subtitle="Daftar seluruh laporan sampah yang telah Anda kirimkan."
      actions={
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#111315] hover:bg-[#272B30] text-white text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Buat Laporan
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Filter Bar */}
        <section className="bg-white border border-[#DCDCD4] p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#525860] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari judul atau lokasi..."
                className="w-full pl-9 pr-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#111315]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs font-medium text-[#111315]"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="in_progress">Diproses</option>
              <option value="completed">Selesai</option>
              <option value="rejected">Ditolak</option>
            </select>

            <div className="flex items-center gap-2">
              <select
                value={wasteTypeFilter}
                onChange={(e) => {
                  setWasteTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="flex-1 px-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs font-medium text-[#111315]"
              >
                <option value="all">Semua Material</option>
                <option value="organic">Organik</option>
                <option value="plastic">Plastik</option>
                <option value="paper">Kertas / Kardus</option>
              </select>
              {(search || statusFilter !== 'all' || wasteTypeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setWasteTypeFilter('all');
                    setPage(1);
                  }}
                  title="Reset Filter"
                  className="p-2 rounded border border-[#DCDCD4] bg-white text-[#991B1B]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Reports Grid */}
        {loading ? (
          <div className="bg-white border border-[#DCDCD4] p-12 flex items-center justify-center gap-2 text-xs text-[#525860]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat riwayat laporan...
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-[#DCDCD4] p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-[#111315]">Belum ada laporan ditemukan</p>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#111315] text-white text-xs font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Buat Laporan Baru
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white border border-[#DCDCD4] flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-[#111315] border-b border-[#DCDCD4] overflow-hidden">
                    <img
                      src={resolveImageUrl(report.imageUrl)}
                      alt={report.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={report.status} size="sm" />
                      <WasteTypeBadge
                        type={report.wasteType}
                        confidence={report.aiConfidence}
                        showConfidence
                        size="sm"
                      />
                    </div>

                    <Link
                      href={`/dashboard/reports/${report.id}`}
                      className="block font-display font-bold text-base text-[#111315] hover:underline line-clamp-1 pt-1"
                    >
                      {report.title}
                    </Link>

                    <p className="text-xs text-[#525860] line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#525860] pt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {report.address ||
                          `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                      </span>
                    </div>

                    {report.adminNotes && (
                      <div className="p-2.5 bg-[#FAF9F6] border border-[#DCDCD4] text-xs text-[#111315]">
                        <span className="font-semibold">Catatan Petugas:</span> {report.adminNotes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-[#DCDCD4] bg-[#FAF9F6] flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-[#525860]">
                    {formatDateTime(report.createdAt)}
                  </span>

                  <div className="flex items-center gap-3">
                    {report.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(report)}
                        className="text-[#991B1B] hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Hapus
                      </button>
                    )}
                    <Link
                      href={`/dashboard/reports/${report.id}`}
                      className="font-semibold text-[#111315] hover:underline"
                    >
                      Periksa →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white border border-[#DCDCD4] px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-mono text-[#525860]">
              Halaman {pagination.page} / {pagination.totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DCDCD4] text-xs font-medium disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DCDCD4] text-xs font-medium disabled:opacity-40"
              >
                Berikutnya
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
