import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { prisma } from './client';
import { ReportStatus, WasteType } from '@prisma/client';

async function generateSampleImage(
  filename: string,
  title: string,
  category: string,
  bgColor: string,
  accentColor: string
): Promise<string> {
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filePath = path.join(uploadsDir, filename);

  const safeTitle = title.replace(/&/g, '&amp;');
  const svg = `
    <svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgColor}" />
          <stop offset="100%" stop-color="${accentColor}" />
        </linearGradient>
      </defs>
      <rect width="640" height="480" fill="url(#bg)" />
      <circle cx="520" cy="110" r="140" fill="rgba(255,255,255,0.1)" />
      <circle cx="120" cy="390" r="180" fill="rgba(0,0,0,0.12)" />
      <rect x="48" y="48" width="544" height="384" rx="24" fill="rgba(15,23,42,0.45)" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
      <text x="88" y="140" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#e2e8f0" letter-spacing="2">SMART WASTE REPORT PHOTO</text>
      <text x="88" y="220" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#ffffff">${category.toUpperCase()} WASTE</text>
      <text x="88" y="280" font-family="Arial, sans-serif" font-size="24" fill="#cbd5e1">${safeTitle}</text>
      <rect x="88" y="330" width="220" height="48" rx="12" fill="rgba(255,255,255,0.2)" />
      <text x="112" y="361" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#ffffff">AI Verified Sample</text>
    </svg>
  `;

  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(filePath);
  return `/uploads/${filename}`;
}

async function main() {
  console.log('🌱 Starting database seed on Neon PostgreSQL...');

  // Clean existing records
  await prisma.reportLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Administrator Bilcode',
      email: 'admin@smartwaste.id',
      password: adminPassword,
      role: 'admin',
      phone: '08111000111',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'Andi Pratama',
      email: 'user@smartwaste.id',
      password: userPassword,
      role: 'user',
      phone: '081234567890',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Siti Rahmawati',
      email: 'siti@smartwaste.id',
      password: userPassword,
      role: 'user',
      phone: '081298765432',
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@smartwaste.id',
      password: userPassword,
      role: 'user',
      phone: '081345678901',
    },
  });

  // Generate sample images
  const imgPlastic = await generateSampleImage(
    'sample-plastic-waste.jpg',
    'Tumpukan Botol PET & Kemasan Plastik',
    'plastic',
    '#0284c7',
    '#1e3a8a'
  );
  const imgOrganic = await generateSampleImage(
    'sample-organic-waste.jpg',
    'Sampah Sisa Sayuran & Daun Pasar',
    'organic',
    '#15803d',
    '#064e3b'
  );
  const imgPaper = await generateSampleImage(
    'sample-paper-waste.jpg',
    'Tumpukan Kardus & Kertas Bekas',
    'paper',
    '#b45309',
    '#78350f'
  );

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const sampleReports: Array<{
    userId: string;
    title: string;
    description: string;
    imageUrl: string;
    latitude: number;
    longitude: number;
    address: string;
    wasteType: WasteType;
    aiConfidence: number;
    status: ReportStatus;
    adminNotes: string | null;
    createdAt: Date;
  }> = [
    {
      userId: user1.id,
      title: 'Tumpukan Botol Plastik di Pinggir Kanal Banjir Timur',
      description:
        'Terdapat banyak botol minuman kemasan plastik PET dan kantong kresek menumpuk di tepi saluran air, berpotensi menyumbat aliran saat hujan.',
      imageUrl: imgPlastic,
      latitude: -6.225014,
      longitude: 106.900447,
      address: 'Jl. Inspeksi Kanal Banjir Timur, Duren Sawit, Jakarta Timur',
      wasteType: 'plastic',
      aiConfidence: 0.94,
      status: 'pending',
      adminNotes: null,
      createdAt: daysAgo(1),
    },
    {
      userId: user1.id,
      title: 'Sampah Organik Sisa Sayur Pasar Minggu',
      description:
        'Sisa sayuran busuk dan kulit buah belum diangkut sejak kemarin sore, menimbulkan bau menyengat di sekitar trotoar pasar.',
      imageUrl: imgOrganic,
      latitude: -6.284122,
      longitude: 106.844511,
      address: 'Jl. Raya Ragunan, Pasar Minggu, Jakarta Selatan',
      wasteType: 'organic',
      aiConfidence: 0.91,
      status: 'in_progress',
      adminNotes: 'Tim kebersihan sektor Selatan sedang menuju lokasi dengan armada pengangkut.',
      createdAt: daysAgo(3),
    },
    {
      userId: user2.id,
      title: 'Limbah Kardus dan Kertas Kemasan di Area Ruko Sudirman',
      description:
        'Tumpukan kardus bekas logistik dan kertas kantor dibiarkan menumpuk di dekat halte busway.',
      imageUrl: imgPaper,
      latitude: -6.208763,
      longitude: 106.822072,
      address: 'Jl. Jend. Sudirman Kav. 21, Setiabudi, Jakarta Selatan',
      wasteType: 'paper',
      aiConfidence: 0.89,
      status: 'completed',
      adminNotes: 'Sudah diangkut ke bank sampah daur ulang kertas pada pukul 09:30 WIB.',
      createdAt: daysAgo(8),
    },
    {
      userId: user2.id,
      title: 'Kantong Plastik dan Gelas Kemasan di Taman Kota',
      description:
        'Banyak sampah gelas plastik sekali pakai berserakan di sekitar bangku taman setelah acara akhir pekan.',
      imageUrl: imgPlastic,
      latitude: -6.175392,
      longitude: 106.827153,
      address: 'Taman Medan Merdeka, Gambir, Jakarta Pusat',
      wasteType: 'plastic',
      aiConfidence: 0.96,
      status: 'completed',
      adminNotes: 'Petugas taman telah membersihkan area dan menambah 2 tempat sampah terpilah.',
      createdAt: daysAgo(18),
    },
    {
      userId: user3.id,
      title: 'Tumpukan Daun Kering & Ranting Pohon Pasca Hujan',
      description:
        'Guguran daun dan sampah organik taman menutupi sebagian jalur sepeda di Jl. Diponegoro.',
      imageUrl: imgOrganic,
      latitude: -6.198412,
      longitude: 106.836981,
      address: 'Jl. Pangeran Diponegoro No. 45, Menteng, Jakarta Pusat',
      wasteType: 'organic',
      aiConfidence: 0.88,
      status: 'in_progress',
      adminNotes: 'Dijadwalkan pengomposan oleh unit Dinas Lingkungan Hidup.',
      createdAt: daysAgo(35),
    },
    {
      userId: user3.id,
      title: 'Sampah Kertas Brosur & Kardus di Dekat Stasiun',
      description:
        'Tumpukan kertas brosur dan boks karton makanan menumpuk di luar tempat sampah stasiun.',
      imageUrl: imgPaper,
      latitude: -6.215678,
      longitude: 106.851234,
      address: 'Jl. Bukit Duri Tanjakan, Tebet, Jakarta Selatan',
      wasteType: 'paper',
      aiConfidence: 0.86,
      status: 'rejected',
      adminNotes: 'Laporan duplikat dengan laporan sebelumnya yang sudah diselesaikan.',
      createdAt: daysAgo(45),
    },
    {
      userId: user1.id,
      title: 'Botol Plastik & Sedotan di Area Kuliner Malam',
      description:
        'Sampah plastik kemasan minuman menumpuk di sudut jalan setelah jam operasional kuliner malam selesai.',
      imageUrl: imgPlastic,
      latitude: -6.168234,
      longitude: 106.831456,
      address: 'Jl. Pecenongan Raya, Sawah Besar, Jakarta Pusat',
      wasteType: 'plastic',
      aiConfidence: 0.92,
      status: 'pending',
      adminNotes: null,
      createdAt: daysAgo(65),
    },
    {
      userId: user2.id,
      title: 'Sampah Sisa Makanan Kantin di Belakang Gedung',
      description:
        'Sampah organik sisa makanan kantin meluber dari bak penampungan sementara.',
      imageUrl: imgOrganic,
      latitude: -6.229728,
      longitude: 106.816635,
      address: 'Jl. Gatot Subroto Kav. 38, Kuningan, Jakarta Selatan',
      wasteType: 'organic',
      aiConfidence: 0.9,
      status: 'completed',
      adminNotes: 'Telah dibersihkan dan diangkut ke fasilitas pengolahan kompos.',
      createdAt: daysAgo(95),
    },
  ];

  for (const item of sampleReports) {
    const created = await prisma.report.create({
      data: item,
    });

    if (item.status !== 'pending') {
      await prisma.reportLog.create({
        data: {
          reportId: created.id,
          changedById: admin.id,
          oldStatus: 'pending',
          newStatus: item.status,
          notes: item.adminNotes,
          createdAt: new Date(item.createdAt.getTime() + 3600 * 1000),
        },
      });
    }
  }

  console.log('✅ Seed completed successfully!');
  console.log('   Admin: admin@smartwaste.id / Admin123!');
  console.log('   User : user@smartwaste.id / User123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
