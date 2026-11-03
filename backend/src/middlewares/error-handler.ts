import { ErrorRequestHandler } from 'express';
import { isCelebrateError, Segments } from 'celebrate';
import mongoose from 'mongoose';
import multer from 'multer';

type ApiError = Error & { statusCode?: number; code?: unknown; status?: number };

/** Отправляет клиенту понятную ошибку без внутренних данных сервера. */
const errorHandler: ErrorRequestHandler = (error: ApiError, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  let statusCode = error.statusCode || 500;
  let message = error.message || 'На сервере произошла ошибка';

  if (isCelebrateError(error)) {
    const authorizationError = error.details.get(Segments.HEADERS)?.details
      .some((detail) => detail.path[0] === 'authorization');
    statusCode = authorizationError ? 401 : 400;
    message = authorizationError ? 'Необходима авторизация'
      : Array.from(error.details.values()).map((detail) => detail.message).join('; ');
  } else if (error instanceof mongoose.Error.ValidationError
    || error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Переданы некорректные данные';
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'Запись с таким названием или email уже существует';
  } else if (error instanceof multer.MulterError) {
    statusCode = 400;
    message = error.code === 'LIMIT_FILE_SIZE'
      ? 'Превышен допустимый размер файла' : 'Некорректная загрузка файла';
  } else if (error instanceof SyntaxError && error.status === 400) {
    statusCode = 400;
    message = 'Некорректный JSON';
  }

  res.status(statusCode).send({
    message: statusCode === 500 ? 'На сервере произошла ошибка' : message,
  });
};

export default errorHandler;
