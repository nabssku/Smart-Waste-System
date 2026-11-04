import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';

export const getDashboardStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalReports,
      totalUsers,
      statusGroups,
      wasteTypeGroups,
      allReportsDates,
      recentReports,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.user.count({ where: { role: 'user' } }),
      prisma.report.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.report.groupBy({
        by: ['wasteType'],
        _count: { wasteType: true },
      }),
      prisma.report.findMany({
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.report.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const byStatus = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      rejected: 0,
    };
    for (const item of statusGroups) {
      byStatus[item.status] = item._count.status;
    }

    const byWasteType = {
      organic: 0,
      plastic: 0,
      paper: 0,
      unknown: 0,
    };
    for (const item of wasteTypeGroups) {
      byWasteType[item.wasteType] = item._count.wasteType;
    }

    // Aggregate last 6 months for line chart
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];
    const now = new Date();
    const monthlyMap = new Map<string, number>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap.set(key, 0);
    }

    for (const r of allReportsDates) {
      const d = new Date(r.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
      }
    }

    const reportsByMonth = Array.from(monthlyMap.entries()).map(([month, count]) => ({
      month,
      count,
    }));

    res.json({
      success: true,
      data: {
        totalReports,
        totalUsers,
        byStatus,
        byWasteType,
        reportsByMonth,
        recentReports: recentReports.map((r) => ({
          ...r,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const [totalReports, statusGroups, wasteTypeGroups, recentReports] =
      await Promise.all([
        prisma.report.count({ where: { userId } }),
        prisma.report.groupBy({
          by: ['status'],
          where: { userId },
          _count: { status: true },
        }),
        prisma.report.groupBy({
          by: ['wasteType'],
          where: { userId },
          _count: { wasteType: true },
        }),
        prisma.report.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    const byStatus = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      rejected: 0,
    };
    for (const item of statusGroups) {
      byStatus[item.status] = item._count.status;
    }

    const byWasteType = {
      organic: 0,
      plastic: 0,
      paper: 0,
      unknown: 0,
    };
    for (const item of wasteTypeGroups) {
      byWasteType[item.wasteType] = item._count.wasteType;
    }

    res.json({
      success: true,
      data: {
        totalReports,
        byStatus,
        byWasteType,
        recentReports: recentReports.map((r) => ({
          ...r,
          latitude: Number(r.latitude),
          longitude: Number(r.longitude),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
