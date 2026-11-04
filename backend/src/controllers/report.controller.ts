import { Request, Response, NextFunction } from 'express';
import { Prisma, ReportStatus, WasteType } from '@prisma/client';
import { prisma } from '../prisma/client';
import { classifyWasteImage } from '../services/ml.service';
import { fileToPersistentImageUrl } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const formatReport = (report: any) => ({
  ...report,
  latitude: Number(report.latitude),
  longitude: Number(report.longitude),
});

export const getAllReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const status = req.query.status as ReportStatus | undefined;
    const wasteType = (req.query.waste_type || req.query.wasteType) as WasteType | undefined;
    const search = (req.query.search as string)?.trim();
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const where: Prisma.ReportWhereInput = {};

    if (status && ['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      where.status = status;
    }

    if (wasteType && ['organic', 'plastic', 'paper', 'unknown'].includes(wasteType)) {
      where.wasteType = wasteType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: reports.map(formatReport),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const status = req.query.status as ReportStatus | undefined;
    const wasteType = (req.query.waste_type || req.query.wasteType) as WasteType | undefined;
    const search = (req.query.search as string)?.trim();

    const where: Prisma.ReportWhereInput = { userId };

    if (status && ['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      where.status = status;
    }

    if (wasteType && ['organic', 'plastic', 'paper', 'unknown'].includes(wasteType)) {
      where.wasteType = wasteType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          logs: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: reports.map(formatReport),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan.',
      });
      return;
    }

    if (req.user!.role !== 'admin' && report.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melihat laporan ini.',
      });
      return;
    }

    res.json({
      success: true,
      data: formatReport(report),
    });
  } catch (error) {
    next(error);
  }
};

export const createReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      title,
      description,
      latitude,
      longitude,
      address,
      waste_type,
      wasteType,
      ai_confidence,
      aiConfidence,
      image_url,
      imageUrl,
    } = req.body;

    if (!title || !description || latitude === undefined || longitude === undefined) {
      res.status(400).json({
        success: false,
        message: 'Judul, deskripsi, latitude, dan longitude wajib diisi.',
      });
      return;
    }

    let finalImageUrl = image_url || imageUrl || '';
    let finalWasteType: WasteType =
      (waste_type as WasteType) || (wasteType as WasteType) || 'unknown';
    let finalConfidence: number | null =
      ai_confidence !== undefined
        ? Number(ai_confidence)
        : aiConfidence !== undefined
        ? Number(aiConfidence)
        : null;

    if (req.file) {
      if (finalWasteType === 'unknown' || finalConfidence === null) {
        try {
          const mlResult = await classifyWasteImage(req.file.path, req.file.originalname);
          if (finalWasteType === 'unknown') {
            finalWasteType = mlResult.prediction;
          }
          if (finalConfidence === null) {
            finalConfidence = mlResult.confidence;
          }
        } catch (err) {
          console.warn('[CreateReport] Auto ML classification failed:', err);
        }
      }
      finalImageUrl = await fileToPersistentImageUrl(
        req.file.path,
        req.file.filename
      );
    } else if (finalImageUrl && finalImageUrl.startsWith('/uploads/')) {
      const localFilePath = path.resolve(
        process.cwd(),
        finalImageUrl.replace(/^\//, '')
      );
      if (fs.existsSync(localFilePath) && (finalWasteType === 'unknown' || finalConfidence === null)) {
        try {
          const mlResult = await classifyWasteImage(localFilePath);
          if (finalWasteType === 'unknown') {
            finalWasteType = mlResult.prediction;
          }
          if (finalConfidence === null) {
            finalConfidence = mlResult.confidence;
          }
        } catch (err) {
          console.warn('[CreateReport] Existing upload ML classification failed:', err);
        }
      }
    }

    if (!finalImageUrl) {
      res.status(400).json({
        success: false,
        message: 'Foto sampah wajib diunggah.',
      });
      return;
    }

    const report = await prisma.report.create({
      data: {
        userId,
        title: String(title).trim(),
        description: String(description).trim(),
        imageUrl: finalImageUrl,
        latitude: Number(latitude),
        longitude: Number(longitude),
        address: address ? String(address).trim() : null,
        wasteType: finalWasteType,
        aiConfidence: finalConfidence,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Laporan sampah berhasil dibuat.',
      data: formatReport(report),
    });
  } catch (error) {
    next(error);
  }
};

export const updateReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.report.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan.',
      });
      return;
    }

    if (req.user!.role !== 'admin' && existing.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengubah laporan ini.',
      });
      return;
    }

    const {
      title,
      description,
      latitude,
      longitude,
      address,
      waste_type,
      wasteType,
    } = req.body;

    const imageUrl = req.file
      ? await fileToPersistentImageUrl(req.file.path, req.file.filename)
      : existing.imageUrl;

    const updated = await prisma.report.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : existing.title,
        description:
          description !== undefined ? String(description).trim() : existing.description,
        latitude: latitude !== undefined ? Number(latitude) : existing.latitude,
        longitude: longitude !== undefined ? Number(longitude) : existing.longitude,
        address: address !== undefined ? String(address).trim() : existing.address,
        wasteType: (waste_type || wasteType || existing.wasteType) as WasteType,
        imageUrl,
      },
    });

    res.json({
      success: true,
      message: 'Laporan berhasil diperbarui.',
      data: formatReport(updated),
    });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, admin_notes, adminNotes, notes } = req.body;

    const validStatuses: ReportStatus[] = [
      'pending',
      'in_progress',
      'completed',
      'rejected',
    ];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status tidak valid. Pilih: pending, in_progress, completed, atau rejected.',
      });
      return;
    }

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan.',
      });
      return;
    }

    const finalNotes = admin_notes ?? adminNotes ?? notes ?? null;

    const [updatedReport] = await prisma.$transaction([
      prisma.report.update({
        where: { id },
        data: {
          status: status as ReportStatus,
          adminNotes: finalNotes !== null ? String(finalNotes) : existing.adminNotes,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          logs: {
            orderBy: { createdAt: 'desc' },
            include: {
              changedBy: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
      }),
      prisma.reportLog.create({
        data: {
          reportId: id,
          changedById: req.user!.userId,
          oldStatus: existing.status,
          newStatus: status as ReportStatus,
          notes: finalNotes !== null ? String(finalNotes) : null,
        },
      }),
    ]);

    res.json({
      success: true,
      message: `Status laporan berhasil diubah menjadi ${status}.`,
      data: formatReport(updatedReport),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.report.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan.',
      });
      return;
    }

    if (req.user!.role !== 'admin' && existing.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk menghapus laporan ini.',
      });
      return;
    }

    await prisma.report.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Laporan berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};
