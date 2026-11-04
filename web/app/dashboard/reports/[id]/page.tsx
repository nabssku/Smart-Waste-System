'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { StatusBadge, WasteTypeBadge } from '@/components/Badges';
import WasteMap from '@/components/WasteMap';
import { reportsApi } from '@/lib/api';
import { Report, WasteType } from '@/lib/types';
import {
  formatDateTime,
  resolveImageUrl,
  STATUS_CONFIG,
  WASTE_TYPE_CONFIG,
} from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

export default function UserReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWasteType, setEditWasteType] = useState<WasteType>('plastic');
  const [saving, setSaving] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!params?.id) return;
    try {
      setLoading(true);
      const data = await reportsApi.getById(params.id);
      setReport(data);
      setEditTitle(data.title);
      setEditDesc(data.description);
      setEditAddress(data.address || '');
      setEditWasteType(data.wasteType);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat detail laporan.', 'error');
    } finally {
      setLoading(false);
    }
  }, [params?.id, showToast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    try {
      setSaving(true);
      const updated = await reportsApi.update(report.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        address: editAddress.trim(),
        waste_type: editWasteType,
      });
      setReport(updated);
      setEditOpen(false);
      showToast('Laporan berhasil diperbarui.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui laporan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    const ok = window.confirm(`Hapus laporan "${report.title}"?`);
    if (!ok) return;

    try {
      await reportsApi.remove(report.id);
      showToast('Laporan berhasil dihapus.', 'success');
      router.push('/dashboard/reports');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus laporan.', 'error');
    }
  };

  if (loading) {
    return (
      <AppShell role="user" title="Detail Laporan">
        <div className="bg-white border border-[#DCDCD4] p-12 flex items-center justify-center gap-2 text-xs text-[#525860]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat detail laporan...
        </div>
      </AppShell>
    );
  }

  if (!report) {
    return (
      <AppShell role="user" title="Laporan Tidak Ditemukan">
        <div className="bg-white border border-[#DCDCD4] p-10 text-center space-y-3">
          <p className="text-xs text-[#525860]">Laporan tidak ditemukan.</p>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#111315] text-white text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Riwayat
          </Link>
        </div>
      </AppShell>
    );
  }

  const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
  const wasteCfg = WASTE_TYPE_CONFIG[report.wasteType] || WASTE_TYPE_CONFIG.unknown;
  const confidencePct =
    report.aiConfidence !== null && report.aiConfidence !== undefined
      ? Math.round(report.aiConfidence * 100)
      : 85;

  return (
    <AppShell
      role="user"
      title={report.title}
      subtitle={`Dilaporkan pada ${formatDateTime(report.createdAt)}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#DCDCD4] bg-white text-xs font-medium text-[#111315]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali
          </Link>
          {report.status === 'pending' && (
            <>
              <button
                onClick={() => setEditOpen(true)}
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
            </>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-[#DCDCD4]">
            <div className="h-72 sm:h-96 bg-[#111315] overflow-hidden">
              <img
                src={resolveImageUrl(report.imageUrl)}
                alt={report.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-3 border-y border-[#DCDCD4] bg-[#FAF9F6] divide-x divide-[#DCDCD4] text-xs">
              <div className="p-3.5">
                <span className="text-[11px] text-[#525860] block">Status Laporan</span>
                <div className="mt-1">
                  <StatusBadge status={report.status} size="sm" />
                </div>
              </div>
              <div className="p-3.5">
                <span className="text-[11px] text-[#525860] block">Material Sampah</span>
                <div className="mt-1">
                  <WasteTypeBadge type={report.wasteType} size="sm" />
                </div>
              </div>
              <div className="p-3.5">
                <span className="text-[11px] text-[#525860] block">Keyakinan Model</span>
                <span className="font-mono font-semibold text-sm text-[#111315] mt-1 block tabular-nums">
                  {confidencePct}%
                </span>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-[#111315]">
                Deskripsi Laporan
              </h2>
              <p className="text-sm text-[#111315] leading-relaxed whitespace-pre-line">
                {report.description}
              </p>
              <p className="text-xs text-[#525860] pt-2 border-t border-[#DCDCD4]">
                Klasifikasi ({wasteCfg.label}): {wasteCfg.description}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#DCDCD4] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold text-[#111315]">
                  Titik Koordinat Lokasi
                </h2>
                <p className="text-xs text-[#525860]">
                  {report.address || `${report.latitude}, ${report.longitude}`}
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

            <WasteMap
              latitude={report.latitude}
              longitude={report.longitude}
              zoom={15}
              heightClass="h-64"
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#DCDCD4] p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-[#111315]">
              Keterangan Status
            </h2>
            <div className="p-3.5 bg-[#FAF9F6] border border-[#DCDCD4] space-y-1.5">
              <StatusBadge status={report.status} />
              <p className="text-xs text-[#525860] leading-relaxed">{statusCfg.description}</p>
            </div>

            {report.adminNotes && (
              <div className="p-3.5 bg-[#FAF9F6] border border-[#DCDCD4] space-y-1">
                <div className="text-xs font-semibold text-[#111315]">
                  Catatan Petugas Dinas
                </div>
                <p className="text-xs text-[#525860] leading-relaxed">{report.adminNotes}</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#DCDCD4]">
            <div className="p-4 border-b border-[#DCDCD4]">
              <h2 className="font-display text-base font-bold text-[#111315]">
                Riwayat Penanganan
              </h2>
            </div>

            <div className="divide-y divide-[#DCDCD4]">
              {report.logs && report.logs.length > 0 ? (
                report.logs.map((log) => (
                  <div key={log.id} className="p-4 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={log.newStatus} size="sm" />
                      <span className="font-mono text-[11px] text-[#525860]">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                    {log.notes && <p className="text-[#525860]">{log.notes}</p>}
                    <div className="text-[11px] text-[#525860]">
                      Oleh: <strong className="text-[#111315]">{log.changedBy?.name || 'Admin'}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 space-y-1 text-xs">
                  <StatusBadge status={report.status} size="sm" />
                  <p className="text-[#525860] pt-1">
                    Laporan telah diterima sistem dan menunggu pemeriksaan petugas.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-[#DCDCD4] max-w-md w-full">
            <div className="px-5 py-3.5 border-b border-[#DCDCD4] bg-[#FAF9F6] flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#111315]">
                Edit Laporan Sampah
              </h3>
              <button
                onClick={() => setEditOpen(false)}
                className="text-xs text-[#525860]"
              >
                Tutup
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-3.5">
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
                  onClick={() => setEditOpen(false)}
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
