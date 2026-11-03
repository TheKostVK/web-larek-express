import { randomUUID } from 'crypto';
import { RequestHandler } from 'express';
import multer from 'multer';
import { MAX_FILE_SIZE, UPLOAD_PATH_TEMP } from '../config';
import BadRequestError from '../errors/bad-request-error';

const extensions: Record<string, string> = {
  'image/png': '.png',
  'image/jpg': '.jpg',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

const fileMiddleware = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_PATH_TEMP,
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${extensions[file.mimetype]}`),
  }),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 0,
  },
  fileFilter: (_req, file, callback) => {
    if (!Object.prototype.hasOwnProperty.call(extensions, file.mimetype)) {
      return callback(new BadRequestError('Допустимы изображения PNG, JPG, JPEG, GIF и SVG'));
    }

    return callback(null, true);
  },
});

const uploadSingleFile = fileMiddleware.single('file');
const multipartErrorMessages = new Set([
  'Multipart: Boundary not found',
  'Malformed content type',
  'Malformed part header',
  'Unexpected end of file',
  'Unexpected end of form',
]);

/**
 * Передаёт ошибки формата multipart в общий обработчик как ошибки запроса.
 * @param req Запрос с загружаемым изображением.
 * @param res Ответ Express.
 * @param next Продолжает обработку или передаёт ошибку.
 */
export const uploadImage: RequestHandler = (req, res, next) => {
  uploadSingleFile(req, res, (error: unknown) => {
    if (error instanceof Error && !('code' in error)
      && multipartErrorMessages.has(error.message)) {
      next(new BadRequestError('Некорректные данные загрузки изображения'));
      return;
    }

    next(error);
  });
};

export default fileMiddleware;
