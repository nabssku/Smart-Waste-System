'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Trash2,
  Edit3,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { StatusBadge, WasteTypeBadge } from '@/components/Badges';
import WasteMap from '@/components/WasteMap';
import { reportsApi } from '@/lib/api';
import { Report, ReportStatus, WasteType } from '@/lib/types';
import {
  formatDateTime,
  resolveImageUrl,
  STATUS_CONFIG,
  WASTE_TYPE_CONFIG,
} from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

export default function AdminReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<ReportStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWasteType, setEditWasteType] = useState<WasteType>('organic');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!params?.id) return;
    try {
      setLoading(true);
      const data = await reportsApi.getById(params.id);
      setReport(data);
      setStatus(data.status);
      setAdminNotes(data.adminNotes || '');
      setEditTitle(data.title);
      setEditDesc(data.description);
      setEditAddress(data.address || '');
      setEditWasteType(data.wasteType);
    } catch (err: any) {
      showToast(err.message || 'Laporan tidak ditemukan.', 'error');
    } finally {
      setLoading(false);
    }
  }, [params?.id, showToast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    if (status === 'rejected' && !adminNotes.trim()) {
      showToast('Wajib mengisi catatan jika menolak laporan.', 'error');
      return;
    }

    try {
      setSavingStatus(true);
      const updated = await reportsApi.updateStatus(report.id, status, adminNotes.trim());
      setReport(updated);
      showToast('Status dan catatan laporan berhasil disimpan.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui status.', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    try {
      setSavingEdit(true);
      const updated = await reportsApi.update(report.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        address: editAddress.trim(),
        waste_type: editWasteType,
      });
      setReport(updated);
      setEditModalOpen(false);
      showToast('Detail laporan berhasil diperbarui.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan perubahan.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    const ok = window.confirm(`Hapus laporan "${report.title}" secara permanen?`);
    if (!ok) return;

    try {
      await reportsApi.remove(report.id);
      showToast('Laporan berhasil dihapus.', 'success');
      router.push('/admin/reports');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus laporan.', 'error');
    }
  };

  if (loading) {
    return (
      <AppShell role="admin" title="Detail Laporan">
        <div className="bg-white border border-[#DCDCD4] p-12 flex items-center justify-center gap-2 text-xs text-[#525860]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data laporan...
        </div>
      </AppShell>
    );
  }

  if (!report) {
    return (
      <AppShell role="admin" title="Laporan Tidak Ditemukan">
        <div className="bg-white border border-[#DCDCD4] p-10 text-center space-y-3">
          <p className="text-xs text-[#525860]">Data laporan tidak ditemukan.</p>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#111315] text-white text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Daftar
          </Link>
        </div>
      </AppShell>
    );
  }

  const confidencePct =
    report.aiConfidence !== null && report.aiConfidence !== undefined
      ? Math.round(report.aiConfidence * 100)
      : 85;
  const wasteCfg = WASTE_TYPE_CONFIG[report.wasteType] || WASTE_TYPE_CONFIG.unknown;

  return (
    <AppShell
      role="admin"
      title={report.title}
      subtitle={`Dilaporkan pada ${formatDateTime(report.createdAt)}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#DCDCD4] bg-white text-xs font-medium text-[#111315]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </Link>
          <button
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#DCDCD4] bg-white text-xs font-medium text-[#111315]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#FECACA] bg-[#FEE2E2] text-xs font-medium text-[#991B1B]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Visual Evidence, Classification Data, Map, Audit Log */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#DCDCD4]">
            <div className="bg-[#111315] h-72 sm:h-96 overflow-hidden">
              <img
                src={resolveImageUrl(report.imageUrl)}
                alt={report.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-[#DCDCD4] bg-[#FAF9F6] divide-y sm:divide-y-0 sm:divide-x divide-[#DCDCD4] text-xs">
              <div className="p-3.5">
                <span className="text-[11px] text-[#525860] block">Status Saat Ini</span>
                <div className="mt-1">
                  <StatusBadge status={report.status} size="sm" />
                </div>
              </div>
              <div className="p-3.5">
                <span className="text-[11px] text-[#525860] block">Kategori Material</span>
                <div className="mt-1">
                  <WasteTypeBadge type={report.wasteType} size="sm" />
                </div>
              </div>
              <div className="p-3.5">
                <span className="text-[11px] text-[#525860] block">Skor Keyakinan Model</span>
                <span className="font-mono font-semibold text-sm text-[#111315] mt-1 block tabular-nums">
                  {confidencePct}%
                </span>
              </div>
              <div className="p-3.5">
                <span className="text-[11px] text-[#525860] block">Pelapor</span>
                <span className="font-semibold text-[#111315] mt-1 block truncate">
                  {report.user?.name || 'Warga'}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-[#111315]">
                Keterangan Lapangan
              </h2>
              <p className="text-sm text-[#111315] leading-relaxed whitespace-pre-line">
                {report.description}
              </p>
              <p className="text-xs text-[#525860] pt-2 border-t border-[#DCDCD4]">
                Catatan Klasifikasi ({wasteCfg.label}): {wasteCfg.description}
              </p>
            </div>
          </div>

          {/* Geolocation & Map */}
          <div className="bg-white border border-[#DCDCD4] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-[#111315]">
                  Titik Koordinat Lokasi
                </h2>
                <p className="text-xs text-[#525860]">
                  {report.address || 'Alamat detail tidak dicantumkan'}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs font-medium text-[#111315] self-start"
              >
                Buka Google Maps
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-2 border border-[#DCDCD4] divide-x divide-[#DCDCD4] bg-[#FAF9F6] text-xs font-mono">
              <div className="p-2.5">
                <span className="text-[10px] text-[#525860] block">LATITUDE</span>
                <span className="font-semibold text-[#111315] tabular-nums">
                  {report.latitude.toFixed(6)}
                </span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-[#525860] block">LONGITUDE</span>
                <span className="font-semibold text-[#111315] tabular-nums">
                  {report.longitude.toFixed(6)}
                </span>
              </div>
            </div>

            <WasteMap
              latitude={report.latitude}
              longitude={report.longitude}
              zoom={15}
              heightClass="h-72"
            />
          </div>

          {/* Audit Log Table */}
          <div className="bg-white border border-[#DCDCD4]">
            <div className="p-4 border-b border-[#DCDCD4]">
              <h2 className="font-display text-base font-bold text-[#111315]">
                Riwayat Perubahan Status
              </h2>
            </div>

            {!report.logs || report.logs.length === 0 ? (
              <p className="p-5 text-xs text-[#525860]">
                Belum ada riwayat perubahan status pada laporan ini.
              </p>
            ) : (
              <div className="divide-y divide-[#DCDCD4]">
                {report.logs.map((log) => (
                  <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={log.oldStatus} size="sm" />
                        <span className="text-[#525860]">→</span>
                        <StatusBadge status={log.newStatus} size="sm" />
                        <span className="text-[#525860] ml-1">
                          oleh <strong className="text-[#111315]">{log.changedBy?.name || 'Admin'}</strong>
                        </span>
                      </div>
                      {log.notes && (
                        <p className="text-[#525860]">{log.notes}</p>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-[#525860] shrink-0">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Columns: Decision Form & Reporter Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#DCDCD4] p-5 space-y-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#111315]">
                Tindak Lanjut Laporan
              </h2>
              <p className="text-xs text-[#525860]">
                Perbarui status penanganan dan catatan petugas.
              </p>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div className="space-y-1.5">
                {(['pending', 'in_progress', 'completed', 'rejected'] as ReportStatus[]).map(
                  (st) => {
                    const cfg = STATUS_CONFIG[st];
                    const selected = status === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatus(st)}
                        className={`w-full flex items-start gap-2.5 p-3 rounded border text-left transition-colors ${
                          selected
                            ? 'border-[#111315] bg-[#FAF9F6]'
                            : 'border-[#DCDCD4] hover:bg-[#FAF9F6]'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1 shrink-0 ${cfg.dotClass}`}
                        />
                        <div>
                          <div className="text-xs font-semibold text-[#111315]">{cfg.label}</div>
                          <div className="text-[11px] text-[#525860] leading-snug mt-0.5">
                            {cfg.description}
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Catatan Petugas {status === 'rejected' && '(Wajib diisi)'}
                </label>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Tulis instruksi lapangan atau alasan penolakan..."
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] bg-[#FAF9F6] text-xs focus:outline-none focus:border-[#111315]"
                />
              </div>

              <button
                type="submit"
                disabled={savingStatus}
                className="w-full py-2.5 px-4 rounded bg-[#111315] hover:bg-[#272B30] text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {savingStatus ? 'Menyimpan...' : 'Simpan Perubahan Status'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#DCDCD4] p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#111315]">
              Identitas Pelapor
            </h2>
            <div className="divide-y divide-[#DCDCD4] text-xs border-t border-[#DCDCD4]">
              <div className="py-2 flex justify-between">
                <span className="text-[#525860]">Nama</span>
                <span className="font-semibold text-[#111315]">{report.user?.name || '-'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-[#525860]">Email</span>
                <span className="font-mono text-[#111315]">{report.user?.email || '-'}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-[#525860]">Telepon</span>
                <span className="font-mono text-[#111315]">{report.user?.phone || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#DCDCD4] max-w-md w-full">
            <div className="px-5 py-3.5 border-b border-[#DCDCD4] bg-[#FAF9F6] flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#111315]">
                Edit Informasi Laporan
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-xs text-[#525860] hover:text-[#111315]"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Judul Laporan
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Kategori Material
                </label>
                <select
                  value={editWasteType}
                  onChange={(e) => setEditWasteType(e.target.value as WasteType)}
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] text-xs"
                >
                  <option value="organic">Organik</option>
                  <option value="plastic">Plastik</option>
                  <option value="paper">Kertas / Kardus</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Alamat Lokasi
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111315] mb-1">
                  Deskripsi
                </label>
                <textarea
                  rows={3}
                  required
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-[#DCDCD4] text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#DCDCD4] text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-3.5 py-1.5 rounded bg-[#111315] text-white text-xs font-medium"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
