import winston from 'winston';
import expressWinston from 'express-winston';

export const serverLogger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: winston.format.json(),
    }),
  ],
  format: winston.format.simple(),
});

export const requestLogger = expressWinston.logger({
  transports: [new winston.transports.File({ filename: 'request.log' })],
  format: winston.format.json(),
  requestWhitelist: ['url', 'method', 'httpVersion'],
  responseWhitelist: ['statusCode'],
});

export const errorLogger = expressWinston.errorLogger({
  transports: [new winston.transports.File({ filename: 'error.log' })],
  format: winston.format.json(),
  requestWhitelist: ['url', 'method', 'httpVersion'],
  exceptionToMeta: (error: Error) => ({ message: error.message, name: error.name }),
});
