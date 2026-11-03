import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import { mkdir } from 'fs/promises';
import {
  PORT, DB_ADDRESS, ORIGIN_ALLOW, PUBLIC_DIRECTORY, IMAGE_DIRECTORY,
  UPLOAD_PATH_TEMP, TEMP_CLEANUP_CRON, TEMP_FILE_MAX_AGE,
} from './config';
import productRouter from './routes/product';
import orderRouter from './routes/order';
import authRouter from './routes/auth';
import uploadRouter from './routes/upload';
import { requestLogger, errorLogger, serverLogger } from './middlewares/logger';
import errorHandler from './middlewares/error-handler';
import NotFoundError from './errors/not-found-error';
import { cleanupTemporaryFiles } from './utils/files';

const app = express();

app.use(requestLogger);
app.use(cors({ origin: ORIGIN_ALLOW, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(PUBLIC_DIRECTORY, {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  },
}));
app.use('/product', productRouter);
app.use('/order', orderRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);
app.use((_req, _res, next) => next(new NotFoundError('Маршрут не найден')));
app.use(errorLogger);
app.use(errorHandler);

Promise.all([
  mongoose.connect(DB_ADDRESS),
  mkdir(IMAGE_DIRECTORY, { recursive: true }),
  mkdir(UPLOAD_PATH_TEMP, { recursive: true }),
])
  .then(() => {
    cron.schedule(TEMP_CLEANUP_CRON, () => {
      cleanupTemporaryFiles(TEMP_FILE_MAX_AGE).catch((error: Error) => {
        serverLogger.error(`Не удалось очистить временные файлы: ${error.message}`);
      });
    });
    app.listen(PORT, () => serverLogger.info(`Сервер запущен на порту ${PORT}`));
  })
  .catch((error: Error) => {
    serverLogger.error(`Не удалось запустить сервер: ${error.message}`);
    process.exitCode = 1;
  });
