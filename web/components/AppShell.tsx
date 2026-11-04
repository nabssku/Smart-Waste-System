'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  FileText,
  Users,
  Plus,
  Clock,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { clearAuthSession, getStoredUser } from '@/lib/api';
import { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from './ToastProvider';

interface AppShellProps {
  children: React.ReactNode;
  role: 'admin' | 'user';
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AppShell({
  children,
  role,
  title,
  subtitle,
  actions,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace('/login');
      return;
    }
    if (role === 'admin' && stored.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    if (role === 'user' && stored.role === 'admin') {
      router.replace('/admin/dashboard');
      return;
    }
    setUser(stored);
  }, [role, router]);

  const handleLogout = () => {
    clearAuthSession();
    showToast('Sesi berakhir.', 'info');
    router.push('/login');
  };

  const adminNav = [
    {
      label: 'Ikhtisar Operasional',
      href: '/admin/dashboard',
      icon: LayoutGrid,
      exact: true,
    },
    {
      label: 'Daftar Laporan',
      href: '/admin/reports',
      icon: FileText,
      exact: false,
    },
    {
      label: 'Data Pengguna',
      href: '/admin/users',
      icon: Users,
      exact: false,
    },
  ];

  const userNav = [
    {
      label: 'Ringkasan Saya',
      href: '/dashboard',
      icon: LayoutGrid,
      exact: true,
    },
    {
      label: 'Buat Laporan',
      href: '/dashboard/create',
      icon: Plus,
      exact: true,
    },
    {
      label: 'Riwayat Laporan',
      href: '/dashboard/reports',
      icon: Clock,
      exact: false,
    },
  ];

  const navItems = role === 'admin' ? adminNav : userNav;

  return (
    <div className="min-h-screen flex bg-[#F4F4F0] text-[#111315]">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Structural Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white flex flex-col border-r border-[#DCDCD4] transition-transform duration-150 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top Identity Bar */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#DCDCD4]">
          <Link
            href={role === 'admin' ? '/admin/dashboard' : '/dashboard'}
            className="flex items-center gap-2.5"
          >
            <div className="w-7 h-7 bg-[#111315] text-white font-mono text-xs font-semibold flex items-center justify-center rounded-sm">
              SW
            </div>
            <div>
              <div className="font-display font-bold text-sm tracking-tight text-[#111315] leading-none">
                SISPEL SAMPAH
              </div>
              <div className="text-[11px] text-[#525860] mt-0.5">
                {role === 'admin' ? 'Meja Kendali Dinas' : 'Portal Laporan Warga'}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-[#525860] hover:text-[#111315] p-1"
            aria-label="Tutup navigasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#111315] text-white'
                    : 'text-[#525860] hover:bg-[#F4F4F0] hover:text-[#111315]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-[#DCDCD4] bg-[#FAF9F6]">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#111315] truncate">
                {user?.name || 'Memuat...'}
              </div>
              <div className="text-[11px] font-mono text-[#525860] truncate">
                {user?.email || ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar Sesi"
              className="p-2 rounded-md text-[#525860] hover:text-[#991B1B] hover:bg-[#FEE2E2]/60 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-[#F4F4F0]/95 backdrop-blur-xs border-b border-[#DCDCD4] px-4 sm:px-8 h-16 flex items-center">
          <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-1.5 rounded border border-[#DCDCD4] bg-white text-[#111315]"
                aria-label="Buka navigasi"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h1 className="font-display text-lg sm:text-xl font-bold text-[#111315] truncate">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs text-[#525860] truncate hidden sm:block">{subtitle}</p>
                )}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
