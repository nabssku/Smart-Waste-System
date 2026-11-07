'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { user } = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      showToast(`Registrasi berhasil. Selamat datang, ${user.name}.`, 'success');
      window.location.href = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    } catch (err: any) {
      const msg = err.message || 'Gagal mendaftarkan akun.';
      setErrorMsg(msg);
      showToast(msg, 'error');
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
            <span className="font-mono text-xs text-[#525860]">REGISTRASI PELAPOR</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[#111315]">
            Buat Akun Warga
          </h1>
          <p className="text-xs text-[#525860] mt-1">
            Daftarkan identitas Anda untuk mengirim dan memantau laporan titik sampah.
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
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ahmad Hidayat"
              className="w-full px-3 py-2 rounded-md border border-[#DCDCD4] bg-white text-sm focus:outline-none focus:border-[#111315]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111315] mb-1">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-3 py-2 rounded-md border border-[#DCDCD4] bg-white text-sm focus:outline-none focus:border-[#111315]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111315] mb-1">
              Nomor Telepon / WhatsApp (Opsional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812xxxxxxxx"
              className="w-full px-3 py-2 rounded-md border border-[#DCDCD4] bg-white text-sm focus:outline-none focus:border-[#111315]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111315] mb-1">
              Password (Minimal 6 karakter)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-md border border-[#DCDCD4] bg-white text-sm focus:outline-none focus:border-[#111315]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md bg-[#111315] hover:bg-[#272B30] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Warga'}
          </button>
        </form>

        <div className="pt-3 border-t border-[#DCDCD4] text-center text-xs text-[#525860]">
          Sudah memiliki akun?{' '}
          <Link href="/login" className="font-semibold text-[#111315] hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto text-center text-[11px] font-mono text-[#525860] pb-4">
        SISPEL-SAMPAH v1.0
      </div>
    </div>
  );
}
