'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Loader2,
  MapPin,
  ArrowUpRight,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { StatusBadge, WasteTypeBadge } from '@/components/Badges';
import WasteMap from '@/components/WasteMap';
import { statsApi, getStoredUser } from '@/lib/api';
import { UserStats } from '@/lib/types';
import { formatDateTime, resolveImageUrl } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

export default function UserDashboardPage() {
  const { showToast } = useToast();
  const user = getStoredUser();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await statsApi.getMyStats();
      setStats(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat statistik laporan Anda.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const total = stats?.totalReports || 0;
  const organicCount = stats?.byWasteType.organic || 0;
  const plasticCount = stats?.byWasteType.plastic || 0;
  const paperCount = stats?.byWasteType.paper || 0;

  return (
    <AppShell
      role="user"
      title={`Ringkasan Laporan — ${user?.name || 'Warga'}`}
      subtitle="Rekapitulasi laporan titik sampah yang Anda kirimkan beserta status penanganannya."
      actions={
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#111315] hover:bg-[#272B30] text-white text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Buat Laporan Baru
        </Link>
      }
    >
      {loading ? (
        <div className="bg-white border border-[#DCDCD4] p-12 flex items-center justify-center gap-2 text-xs text-[#525860]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat data laporan Anda...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unified KPI Strip */}
          <section className="grid grid-cols-2 lg:grid-cols-4 border border-[#DCDCD4] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#DCDCD4]">
            <div className="p-5 bg-[#111315] text-white">
              <div className="text-xs text-[#A0A6AD]">Total Laporan Saya</div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums">
                {stats?.totalReports || 0}
              </div>
              <div className="mt-1 text-[11px] text-[#A0A6AD]">Laporan terkirim</div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-[#525860]">
                <span>Menunggu</span>
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#111315]">
                {stats?.byStatus.pending || 0}
              </div>
              <div className="mt-1 text-[11px] text-[#525860]">Menunggu verifikasi</div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-[#525860]">
                <span>Diproses</span>
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#111315]">
                {stats?.byStatus.in_progress || 0}
              </div>
              <div className="mt-1 text-[11px] text-[#525860]">Sedang diangkut</div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-[#525860]">
                <span>Selesai</span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#111315]">
                {stats?.byStatus.completed || 0}
              </div>
              <div className="mt-1 text-[11px] text-[#525860]">Tuntas dibersihkan</div>
            </div>
          </section>

          {/* Breakdown & Map Split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 border border-[#DCDCD4] bg-white divide-y lg:divide-y-0 lg:divide-x divide-[#DCDCD4]">
            <div className="lg:col-span-4 p-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-base font-bold text-[#111315]">
                    Komposisi Material
                  </h2>
                  <p className="text-xs text-[#525860]">
                    Klasifikasi jenis sampah dari laporan Anda
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  {[
                    { label: 'Organik', count: organicCount, color: 'bg-[#15803D]' },
                    { label: 'Plastik', count: plasticCount, color: 'bg-[#0369A1]' },
                    { label: 'Kertas / Kardus', count: paperCount, color: 'bg-[#B45309]' },
                  ].map((item) => {
                    const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                      <div key={item.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#111315]">{item.label}</span>
                          <span className="font-mono text-[#525860] tabular-nums">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#F4F4F0] overflow-hidden">
                          <div
                            className={`h-full ${item.color}`}
                            style={{ width: `${Math.max(pct, item.count > 0 ? 6 : 0)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#DCDCD4] flex items-center justify-between">
                <span className="text-xs text-[#525860]">Laporkan titik baru</span>
                <Link
                  href="/dashboard/create"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#111315] hover:underline"
                >
                  Buat Laporan
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-8 p-5 space-y-3">
              <div>
                <h2 className="font-display text-base font-bold text-[#111315]">
                  Peta Sebaran Laporan Saya
                </h2>
                <p className="text-xs text-[#525860]">
                  Titik koordinat lokasi sampah yang pernah Anda laporkan
                </p>
              </div>

              <WasteMap
                latitude={stats?.recentReports?.[0]?.latitude || -6.2088}
                longitude={stats?.recentReports?.[0]?.longitude || 106.8456}
                zoom={12}
                reports={stats?.recentReports || []}
                heightClass="h-64"
              />
            </div>
          </section>

          {/* Recent Reports List */}
          <section className="bg-white border border-[#DCDCD4]">
            <div className="px-5 py-4 border-b border-[#DCDCD4] flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-[#111315]">
                  Laporan Terbaru Saya
                </h2>
                <p className="text-xs text-[#525860]">
                  Klik pada laporan untuk melihat detail dan riwayat penanganan
                </p>
              </div>
              <Link
                href="/dashboard/reports"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#111315] hover:underline"
              >
                Semua Riwayat
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {!stats?.recentReports || stats.recentReports.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-xs text-[#525860]">Anda belum memiliki laporan sampah.</p>
                <Link
                  href="/dashboard/create"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#111315] text-white text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Buat Laporan Pertama
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[#DCDCD4]">
                {stats.recentReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="p-4 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF9F6] transition-colors"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <img
                        src={resolveImageUrl(report.imageUrl)}
                        alt={report.title}
                        className="w-12 h-12 rounded-sm object-cover border border-[#DCDCD4] shrink-0 bg-[#F4F4F0]"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-[#111315] truncate">
                          {report.title}
                        </div>
                        <p className="text-xs text-[#525860] line-clamp-1 mt-0.5">
                          {report.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-[#525860] mt-1">
                          <span className="inline-flex items-center gap-1 truncate max-w-xs">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {report.address ||
                              `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
                          </span>
                          <span className="font-mono">{formatDateTime(report.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <WasteTypeBadge
                        type={report.wasteType}
                        confidence={report.aiConfidence}
                        showConfidence
                        size="sm"
                      />
                      <StatusBadge status={report.status} size="sm" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </AppShell>
  );
}
