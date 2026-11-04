'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { authApi, getStoredUser } from '@/lib/api';
import { User } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const handleLogin = async (targetEmail: string, targetPass: string) => {
    try {
      setLoading(true);
      const { user } = await authApi.login(targetEmail.trim(), targetPass);
      showToast(`Masuk sebagai ${user.name}`, 'success');
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Gagal masuk. Periksa koneksi server backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F4F0] text-[#111315]">
      {/* Top Municipal Utility Bar */}
      <header className="border-b border-[#DCDCD4] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#111315] text-white font-mono text-xs font-semibold flex items-center justify-center rounded-sm">
              SW
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="font-display font-bold text-base tracking-tight">
                SISPEL SAMPAH
              </span>
              <span className="hidden sm:inline text-xs text-[#525860] border-l border-[#DCDCD4] pl-2.5">
                Sistem Pelaporan & Klasifikasi Sampah Perkotaan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                href={currentUser.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#111315] hover:bg-[#272B30] text-white text-xs font-medium transition-colors"
              >
                Buka Meja Kerja ({currentUser.name})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-[#111315] hover:underline"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#111315] hover:bg-[#272B30] text-white text-xs font-medium transition-colors"
                >
                  Registrasi Warga
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Architectural Grid */}
      <main className="flex-1 flex items-center">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#DCDCD4] bg-white">
            {/* Left 7 Columns: Operational Thesis & Material Classification Index */}
            <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#DCDCD4]">
              <div className="space-y-6">


                <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.08] text-[#111315]">
                  Sistem Pelaporan Sampah dengan Klasifikasi AI
                </h1>

                <p className="text-sm sm:text-base text-[#525860] leading-relaxed max-w-xl">
                  Warga mengirimkan foto bukti lapangan beserta titik koordinat GPS. Model
                  CNN mengelompokkan jenis timbunan menjadi tiga kelas
                  material untuk memudahkan penjadwalan armada pengangkut.
                </p>
              </div>

              {/* Waste Sorting Specification Ledger */}
              <div className="mt-10 pt-8 border-t border-[#DCDCD4]">
                <div className="text-xs font-mono text-[#525860] mb-3">
                  KODE KLASIFIKASI MATERIAL SAMPAH
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 border border-[#DCDCD4] divide-y sm:divide-y-0 sm:divide-x divide-[#DCDCD4]">
                  <div className="p-4 bg-[#FAF9F6]">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#111315]">
                        01 / Organik
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
                    </div>
                    <p className="text-xs text-[#525860] mt-1.5 leading-normal">
                      Sisa pangan, limbah pasar, dedaunan, dan material kompos.
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF9F6]">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#111315]">
                        02 / Plastik
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0369A1]" />
                    </div>
                    <p className="text-xs text-[#525860] mt-1.5 leading-normal">
                      Botol PET, kantong kemasan, wadah polimer non-hayati.
                    </p>
                  </div>

                  <div className="p-4 bg-[#FAF9F6]">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-[#111315]">
                        03 / Kertas
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
                    </div>
                    <p className="text-xs text-[#525860] mt-1.5 leading-normal">
                      Kardus logistik, kertas arsip, koran, dan karton kemasan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Direct Sign-In & Role Switcher */}
            <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 bg-[#FAF9F6] flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#111315]">
                    Akses Masuk Sistem
                  </h2>
                  <p className="text-xs text-[#525860] mt-1">
                    Masuk menggunakan kredensial terdaftar atau gunakan tombol sesi penguji di
                    bawah.
                  </p>
                </div>

                {/* Form Login Langsung */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLogin(email, password);
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-medium text-[#111315] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@smartwaste.id"
                      className="w-full px-3 py-2 rounded-md border border-[#DCDCD4] bg-white text-sm focus:outline-none focus:border-[#111315]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#111315] mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-md border border-[#DCDCD4] bg-white text-sm focus:outline-none focus:border-[#111315]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-md bg-[#111315] hover:bg-[#272B30] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Masuk ke Portal
                  </button>
                </form>

                {/* Direct Assessor Role Selection */}
                <div className="pt-5 border-t border-[#DCDCD4] space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#525860]">
                    <span>AKUN DEMONSTRASI TERSEDIA</span>
                    <span>KLIK UNTUK MASUK</span>
                  </div>

                  <div className="divide-y divide-[#DCDCD4] border border-[#DCDCD4] bg-white rounded-md overflow-hidden">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleLogin('admin@smartwaste.id', 'Admin123!')}
                      className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-[#F4F4F0] transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#111315]">
                          Administrator Dinas (Full RBAC)
                        </div>
                        <div className="text-[11px] font-mono text-[#525860]">
                          admin@smartwaste.id
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#525860]" />
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleLogin('user@smartwaste.id', 'User123!')}
                      className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-[#F4F4F0] transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#111315]">
                          Warga Pelapor — Budi Santoso
                        </div>
                        <div className="text-[11px] font-mono text-[#525860]">
                          user@smartwaste.id
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-[#525860]" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#DCDCD4] flex items-center justify-between text-xs text-[#525860]">
                <span>Warga baru?</span>
                <Link
                  href="/register"
                  className="font-semibold text-[#111315] hover:underline inline-flex items-center gap-1"
                >
                  Buat Akun Pelapor
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
