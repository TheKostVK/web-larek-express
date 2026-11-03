import { NextFunction, Request, Response } from 'express';
import { UPLOAD_PATH } from '../config';
import BadRequestError from '../errors/bad-request-error';

const uploadFile = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new BadRequestError('Передайте изображение в поле file'));
  }

  return res.send({
    fileName: `/${UPLOAD_PATH}/${req.file.filename}`,
    originalName: req.file.originalname,
  });
};

export default uploadFile;
