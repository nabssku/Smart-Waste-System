import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client';
import { Role } from '@prisma/client';

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = (req.query.search as string)?.trim();
    const role = req.query.role as Role | undefined;

    const where: any = {};
    if (role && ['admin', 'user'].includes(role)) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { reports: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: users.map((u) => ({
        ...u,
        reportsCount: u._count.reports,
      })),
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

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { reports: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        ...user,
        reportsCount: user._count.reports,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (email !== undefined) updateData.email = String(email).toLowerCase().trim();
    if (role !== undefined && ['admin', 'user'].includes(role)) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone ? String(phone).trim() : null;
    if (password) {
      updateData.password = await bcrypt.hash(String(password), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Data pengguna berhasil diperbarui.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user!.userId) {
      res.status(400).json({
        success: false,
        message: 'Anda tidak dapat menghapus akun Anda sendiri.',
      });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
      return;
    }

    await prisma.user.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Pengguna berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};
