import dotenv from 'dotenv';
import path from 'path';
import ms from 'ms';
import { randomBytes } from 'crypto';

dotenv.config();

const duration = (value: string): number => {
  const milliseconds = ms(value);
  if (!milliseconds || milliseconds < 1000) {
    throw new Error('Срок действия должен быть не меньше секунды');
  }
  return milliseconds;
};

const secret = (name: string): string => {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Укажите ${name} в .env`);
  }
  return value || randomBytes(32).toString('hex');
};

export const PORT = Number(process.env.PORT || 3000);
export const DB_ADDRESS = process.env.DB_ADDRESS || 'mongodb://127.0.0.1:27017/weblarek';
export const ORIGIN_ALLOW = (process.env.ORIGIN_ALLOW || 'http://localhost:5173').split(',');
export const PUBLIC_DIRECTORY = path.resolve(__dirname, '../src/public');
export const UPLOAD_PATH = process.env.UPLOAD_PATH || 'images';
export const IMAGE_DIRECTORY = path.join(PUBLIC_DIRECTORY, UPLOAD_PATH);
export const UPLOAD_PATH_TEMP = path.resolve(__dirname, '..', process.env.UPLOAD_PATH_TEMP || 'temp');
export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024);
export const TEMP_FILE_MAX_AGE = duration(process.env.TEMP_FILE_MAX_AGE || '1d');
export const TEMP_CLEANUP_CRON = process.env.TEMP_CLEANUP_CRON || '0 * * * *';
export const AUTH_ACCESS_TOKEN_SECRET = secret('AUTH_ACCESS_TOKEN_SECRET');
export const AUTH_REFRESH_TOKEN_SECRET = secret('AUTH_REFRESH_TOKEN_SECRET');
export const AUTH_ACCESS_TOKEN_EXPIRY = duration(process.env.AUTH_ACCESS_TOKEN_EXPIRY || '10m') / 1000;
export const AUTH_REFRESH_TOKEN_EXPIRY = duration(process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d') / 1000;
export const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

if (!/^[a-zA-Z0-9_-]+$/.test(UPLOAD_PATH)) {
  throw new Error('UPLOAD_PATH должен содержать имя папки внутри public');
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535
  || !Number.isFinite(MAX_FILE_SIZE) || MAX_FILE_SIZE <= 0) {
  throw new Error('Проверьте PORT и MAX_FILE_SIZE в .env');
}
