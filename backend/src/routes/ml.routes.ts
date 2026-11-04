import { Router, Request, Response, NextFunction } from 'express';
import { predictWaste, healthCheck } from '../controllers/ml.controller';
import { uploadImage } from '../middleware/upload';

const router = Router();

export const acceptMlUpload = (req: Request, res: Response, next: NextFunction) => {
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

router.post('/predict', acceptMlUpload, predictWaste);
router.get('/health', healthCheck);

export default router;
