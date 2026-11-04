'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import AppShell from '@/components/AppShell';
import { StatusBadge, WasteTypeBadge } from '@/components/Badges';
import WasteMap from '@/components/WasteMap';
import { statsApi } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { formatDateTime, resolveImageUrl } from '@/lib/utils';
import { useToast } from '@/components/ToastProvider';

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await statsApi.getAdminDashboard();
      setStats(data);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat statistik dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statusChartData = stats
    ? [
        { name: 'Menunggu', value: stats.byStatus.pending, color: '#D97706' },
        { name: 'Diproses', value: stats.byStatus.in_progress, color: '#2563EB' },
        { name: 'Selesai', value: stats.byStatus.completed, color: '#16A34A' },
        { name: 'Ditolak', value: stats.byStatus.rejected, color: '#DC2626' },
      ]
    : [];

  const wasteTypeChartData = stats
    ? [
        { name: 'Organik', jumlah: stats.byWasteType.organic, fill: '#15803D' },
        { name: 'Plastik', jumlah: stats.byWasteType.plastic, fill: '#0369A1' },
        { name: 'Kertas', jumlah: stats.byWasteType.paper, fill: '#B45309' },
        { name: 'Campuran', jumlah: stats.byWasteType.unknown, fill: '#64748B' },
      ]
    : [];

  return (
    <AppShell
      role="admin"
      title="Ikhtisar Operasional"
      subtitle="Rekapitulasi laporan masuk, distribusi material sampah, dan sebaran titik lokasi."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#DCDCD4] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#111315] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#111315] hover:bg-[#272B30] text-white text-xs font-medium transition-colors"
          >
            Semua Laporan
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      }
    >
      {loading && !stats ? (
        <div className="border border-[#DCDCD4] bg-white p-12 text-center text-xs text-[#525860]">
          Memuat data statistik operasional...
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Unified Architectural KPI Ledger Strip */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-[#DCDCD4] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#DCDCD4]">
            <div className="p-5 bg-[#111315] text-white">
              <div className="text-xs text-[#A0A6AD]">Total Laporan</div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums">
                {stats.totalReports}
              </div>
              <div className="mt-1 text-[11px] text-[#A0A6AD]">Seluruh laporan masuk</div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-[#525860]">
                <span>Menunggu</span>
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#111315]">
                {stats.byStatus.pending}
              </div>
              <div className="mt-1 text-[11px] text-[#525860]">Perlu verifikasi</div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-[#525860]">
                <span>Diproses</span>
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#111315]">
                {stats.byStatus.in_progress}
              </div>
              <div className="mt-1 text-[11px] text-[#525860]">Penanganan lapangan</div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-[#525860]">
                <span>Selesai</span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#111315]">
                {stats.byStatus.completed}
              </div>
              <div className="mt-1 text-[11px] text-[#525860]">Tuntas diangkut</div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between text-xs text-[#525860]">
                <span>Ditolak</span>
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              </div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#111315]">
                {stats.byStatus.rejected}
              </div>
              <div className="mt-1 text-[11px] text-[#525860]">Tidak memenuhi syarat</div>
            </div>

            <div className="p-5">
              <div className="text-xs text-[#525860]">Warga Terdaftar</div>
              <div className="mt-2 font-mono text-3xl font-semibold tabular-nums text-[#111315]">
                {stats.totalUsers}
              </div>
              <div className="mt-1 text-[11px] text-[#525860]">Akun pelapor aktif</div>
            </div>
          </section>

          {/* 3 Charts Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 border border-[#DCDCD4] bg-white divide-y lg:divide-y-0 lg:divide-x divide-[#DCDCD4]">
            {/* 1. Pie Chart — Laporan per Status */}
            <div className="p-5 flex flex-col">
              <h2 className="font-display text-base font-bold text-[#111315]">
                Proporsi Status Penanganan
              </h2>
              <p className="text-xs text-[#525860] mb-4">
                Rasio penyelesaian terhadap total laporan
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '4px',
                        border: '1px solid #DCDCD4',
                        fontSize: '12px',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={28} iconType="square" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Bar Chart — Laporan per Kategori Sampah */}
            <div className="p-5 flex flex-col">
              <h2 className="font-display text-base font-bold text-[#111315]">
                Volume per Jenis Sampah
              </h2>
              <p className="text-xs text-[#525860] mb-4">
                Distribusi hasil klasifikasi citra (Organik, Plastik, Kertas)
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={wasteTypeChartData}
                    margin={{ top: 10, right: 12, left: -20, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke="#ECECE6" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#525860' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#525860' }} />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '4px',
                        border: '1px solid #DCDCD4',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="jumlah" radius={[2, 2, 0, 0]}>
                      {wasteTypeChartData.map((entry, idx) => (
                        <Cell key={`bar-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Line Chart — Tren Laporan per Bulan */}
            <div className="p-5 flex flex-col">
              <h2 className="font-display text-base font-bold text-[#111315]">
                Tren Laporan Bulanan
              </h2>
              <p className="text-xs text-[#525860] mb-4">
                Frekuensi laporan masuk selama 6 bulan terakhir
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.reportsByMonth}
                    margin={{ top: 10, right: 16, left: -20, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke="#ECECE6" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#525860' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#525860' }} />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '4px',
                        border: '1px solid #DCDCD4',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Laporan"
                      stroke="#111315"
                      strokeWidth={2}
                      dot={{ r: 3.5, fill: '#111315', strokeWidth: 1.5, stroke: '#fff' }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Map & Recent Reports Split */}
          <section className="grid grid-cols-1 lg:grid-cols-12 border border-[#DCDCD4] bg-white divide-y lg:divide-y-0 lg:divide-x divide-[#DCDCD4]">
            {/* Geospatial Map */}
            <div className="lg:col-span-5 p-5 flex flex-col justify-between">
              <div className="mb-3">
                <h2 className="font-display text-base font-bold text-[#111315]">
                  Peta Sebaran Titik Laporan
                </h2>
                <p className="text-xs text-[#525860]">
                  Lokasi laporan warga terbaru berdasarkan koordinat GPS
                </p>
              </div>

              <WasteMap
                latitude={stats.recentReports[0]?.latitude || -6.2088}
                longitude={stats.recentReports[0]?.longitude || 106.8456}
                reports={stats.recentReports}
                heightClass="h-80"
              />

              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-[#525860]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Menunggu
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Diproses
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Selesai
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> Ditolak
                </span>
              </div>
            </div>

            {/* Recent Reports Table */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="p-5 border-b border-[#DCDCD4] flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-[#111315]">
                    Laporan Masuk Terbaru
                  </h2>
                  <p className="text-xs text-[#525860]">
                    5 laporan terakhir yang dikirim oleh warga
                  </p>
                </div>
                <Link
                  href="/admin/reports"
                  className="text-xs font-semibold text-[#111315] hover:underline inline-flex items-center gap-1"
                >
                  Lihat Semua ({stats.totalReports})
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DCDCD4] bg-[#FAF9F6] text-[11px] font-mono uppercase text-[#525860]">
                      <th className="py-2.5 px-4">Laporan</th>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCDCD4] text-sm">
                    {stats.recentReports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={resolveImageUrl(rep.imageUrl)}
                              alt={rep.title}
                              className="w-10 h-10 rounded-sm object-cover border border-[#DCDCD4] bg-[#F4F4F0] shrink-0"
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/admin/reports/${rep.id}`}
                                className="font-semibold text-[#111315] hover:underline line-clamp-1"
                              >
                                {rep.title}
                              </Link>
                              <div className="text-xs text-[#525860] truncate max-w-xs">
                                {rep.user?.name || 'Warga'} · {formatDateTime(rep.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <WasteTypeBadge
                            type={rep.wasteType}
                            confidence={rep.aiConfidence}
                            showConfidence
                            size="sm"
                          />
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <StatusBadge status={rep.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/admin/reports/${rep.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#DCDCD4] bg-white hover:bg-[#F4F4F0] text-xs font-medium text-[#111315] transition-colors"
                          >
                            Periksa
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
