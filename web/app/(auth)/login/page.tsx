'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { user } = await authApi.login(email.trim(), password);
      showToast(`Selamat datang, ${user.name}`, 'success');
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Gagal melakukan autentikasi.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    setLoading(true);
    try {
      const { user } = await authApi.login(demoEmail, demoPass);
      showToast(`Masuk sebagai ${user.name}`, 'success');
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk akun demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F0] text-[#111315] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-md w-full mx-auto pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#525860] hover:text-[#111315]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Halaman Utama
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-8 bg-white border border-[#DCDCD4] p-6 sm:p-8 space-y-6">
        <div className="border-b border-[#DCDCD4] pb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-[#111315] text-white font-mono text-[11px] font-semibold flex items-center justify-center rounded-sm">
              SW
            </div>
            <span className="font-mono text-xs text-[#525860]">SISPEL SAMPAH</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#111315]">
            Masuk ke Sistem
          </h1>
          <p className="text-xs text-[#525860] mt-1">
            Gunakan akun terdaftar untuk mengakses panel laporan.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded border border-[#FECACA] bg-[#FEE2E2] text-xs text-[#991B1B]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#111315] mb-1">
              Alamat Email
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
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full pl-3 pr-9 py-2 rounded-md border border-[#DCDCD4] bg-white text-sm focus:outline-none focus:border-[#111315]"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#525860] hover:text-[#111315]"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-[#111315] hover:bg-[#272B30] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>

        {/* Demo Accounts Ledger */}
        <div className="pt-5 border-t border-[#DCDCD4] space-y-2">
          <div className="text-[11px] font-mono text-[#525860]">
            AKUN PENGUJI (1-KLIK LOGIN)
          </div>
          <div className="divide-y divide-[#DCDCD4] border border-[#DCDCD4] rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => loginDemo('admin@smartwaste.id', 'Admin123!')}
              disabled={loading}
              className="w-full px-3 py-2.5 flex items-center justify-between text-left bg-[#FAF9F6] hover:bg-[#F4F4F0] transition-colors"
            >
              <div>
                <div className="text-xs font-semibold text-[#111315]">Admin Dinas</div>
                <div className="text-[11px] font-mono text-[#525860]">admin@smartwaste.id</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#525860]" />
            </button>

            <button
              type="button"
              onClick={() => loginDemo('user@smartwaste.id', 'User123!')}
              disabled={loading}
              className="w-full px-3 py-2.5 flex items-center justify-between text-left bg-[#FAF9F6] hover:bg-[#F4F4F0] transition-colors"
            >
              <div>
                <div className="text-xs font-semibold text-[#111315]">Budi Santoso (Warga)</div>
                <div className="text-[11px] font-mono text-[#525860]">user@smartwaste.id</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#525860]" />
            </button>

            <button
              type="button"
              onClick={() => loginDemo('siti@smartwaste.id', 'User123!')}
              disabled={loading}
              className="w-full px-3 py-2.5 flex items-center justify-between text-left bg-[#FAF9F6] hover:bg-[#F4F4F0] transition-colors"
            >
              <div>
                <div className="text-xs font-semibold text-[#111315]">Siti Aminah (Warga)</div>
                <div className="text-[11px] font-mono text-[#525860]">siti@smartwaste.id</div>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#525860]" />
            </button>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-[#525860]">
          Belum memiliki akun?{' '}
          <Link href="/register" className="font-semibold text-[#111315] hover:underline">
            Registrasi Warga
          </Link>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto text-center text-[11px] font-mono text-[#525860] pb-4">
        SISPEL-SAMPAH v1.0
      </div>
    </div>
  );
}
