import { Request, Response, NextFunction } from 'express';
import { classifyWasteImage } from '../services/ml.service';

export const predictWaste = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        message: 'File gambar wajib diunggah (field: image atau file).',
      });
      return;
    }

    const result = await classifyWasteImage(file.path, file.originalname);

    // Return both top-level PRD format and data wrapper so any client format works seamlessly
    res.json({
      success: true,
      prediction: result.prediction,
      confidence: result.confidence,
      all_predictions: result.all_predictions,
      image_url: `/uploads/${file.filename}`,
      data: {
        prediction: result.prediction,
        confidence: result.confidence,
        all_predictions: result.all_predictions,
        imageUrl: `/uploads/${file.filename}`,
        engine: result.engine,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'ok',
    service: 'smart-waste-unified-backend-ml',
    timestamp: new Date().toISOString(),
  });
};
