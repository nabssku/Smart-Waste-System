import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllReports,
  getMyReports,
  getReportById,
  createReport,
  updateReport,
  updateReportStatus,
  deleteReport,
} from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { uploadImage } from '../middleware/upload';

const router = Router();

const acceptImageOrFile = (req: Request, res: Response, next: NextFunction) => {
  const uploader = uploadImage.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]);
  uploader(req, res, (err) => {
    if (err) return next(err);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    if (files) {
      req.file = files.image?.[0] || files.file?.[0];
    }
    next();
  });
};

router.get('/', authenticate, authorize('admin'), getAllReports);
router.get('/my', authenticate, getMyReports);
router.get('/:id', authenticate, getReportById);
router.post('/', authenticate, acceptImageOrFile, createReport);
router.put('/:id', authenticate, acceptImageOrFile, updateReport);
router.patch('/:id/status', authenticate, authorize('admin'), updateReportStatus);
router.delete('/:id', authenticate, deleteReport);

export default router;
