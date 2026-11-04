import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ReportStatus, WasteType } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(imageUrl?: string | null): string {
  if (!imageUrl) return '';
  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('blob:') ||
    imageUrl.startsWith('data:')
  ) {
    return imageUrl;
  }
  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${BACKEND_ORIGIN}${normalizedPath}`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDateShort(iso?: string | null): string {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const STATUS_CONFIG: Record<
  ReportStatus,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
    colorHex: string;
    description: string;
  }
> = {
  pending: {
    label: 'Menunggu',
    badgeClass: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    dotClass: 'bg-[#D97706]',
    colorHex: '#D97706',
    description: 'Laporan telah diterima dan menunggu penjadwalan petugas.',
  },
  in_progress: {
    label: 'Diproses',
    badgeClass: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
    dotClass: 'bg-[#2563EB]',
    colorHex: '#2563EB',
    description: 'Petugas lapangan sedang mengangkut sampah di lokasi.',
  },
  completed: {
    label: 'Selesai',
    badgeClass: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
    dotClass: 'bg-[#16A34A]',
    colorHex: '#16A34A',
    description: 'Lokasi telah dibersihkan dan diverifikasi selesai.',
  },
  rejected: {
    label: 'Ditolak',
    badgeClass: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]',
    dotClass: 'bg-[#DC2626]',
    colorHex: '#DC2626',
    description: 'Laporan tidak memenuhi syarat atau data tidak sesuai.',
  },
};

export const WASTE_TYPE_CONFIG: Record<
  WasteType,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    colorHex: string;
    description: string;
  }
> = {
  organic: {
    label: 'Organik',
    shortLabel: 'Organik',
    badgeClass: 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]',
    colorHex: '#15803D',
    description: 'Sisa makanan, dedaunan, sayuran, dan material hayati mudah terurai.',
  },
  plastic: {
    label: 'Plastik',
    shortLabel: 'Plastik',
    badgeClass: 'bg-[#F0F9FF] text-[#075985] border-[#BAE6FD]',
    colorHex: '#0369A1',
    description: 'Botol kemasan, kantong kresek, dan wadah polimer.',
  },
  paper: {
    label: 'Kertas / Kardus',
    shortLabel: 'Kertas',
    badgeClass: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
    colorHex: '#B45309',
    description: 'Kardus kemasan, koran, kertas arsip, dan karton.',
  },
  unknown: {
    label: 'Campuran',
    shortLabel: 'Campuran',
    badgeClass: 'bg-[#F4F4F0] text-[#525860] border-[#DCDCD4]',
    colorHex: '#64748B',
    description: 'Material belum terklasifikasi atau campuran.',
  },
};
