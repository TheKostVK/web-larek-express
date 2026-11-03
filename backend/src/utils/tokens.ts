import { randomUUID } from 'crypto';
import { CookieOptions, Request } from 'express';
import jwt from 'jsonwebtoken';
import {
  AUTH_ACCESS_TOKEN_SECRET,
  AUTH_REFRESH_TOKEN_SECRET,
  AUTH_ACCESS_TOKEN_EXPIRY,
  AUTH_REFRESH_TOKEN_EXPIRY,
  COOKIE_SECURE,
} from '../config';
import UnauthorizedError from '../errors/unauthorized-error';

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: COOKIE_SECURE,
  path: '/',
};

/**
 * Создаёт пару токенов для одной сессии пользователя.
 * @param userId Идентификатор пользователя.
 * @returns Access- и refresh-токены.
 */
export const createTokens = (userId: string) => ({
  accessToken: jwt.sign({ _id: userId }, AUTH_ACCESS_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: AUTH_ACCESS_TOKEN_EXPIRY,
    jwtid: randomUUID(),
  }),
  refreshToken: jwt.sign({ _id: userId }, AUTH_REFRESH_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: AUTH_REFRESH_TOKEN_EXPIRY,
    jwtid: randomUUID(),
  }),
});

/**
 * Проверяет подпись и срок жизни refresh-токена из cookie.
 * @param req Запрос с cookie текущей сессии.
 * @returns Идентификатор пользователя и проверенный токен.
 */
export const readRefreshToken = (req: Request) => {
  const token: unknown = req.cookies?.refreshToken;

  if (typeof token !== 'string' || !token) {
    return Promise.reject(new UnauthorizedError('Необходима авторизация'));
  }

  return Promise.resolve()
    .then(() => jwt.verify(token, AUTH_REFRESH_TOKEN_SECRET, { algorithms: ['HS256'] }))
    .catch(() => Promise.reject(new UnauthorizedError('Refresh-токен недействителен')))
    .then((payload) => {
      if (typeof payload === 'string' || typeof payload._id !== 'string') {
        return Promise.reject(new UnauthorizedError('Refresh-токен недействителен'));
      }
      return { _id: payload._id, token };
    });
};

export const refreshCookieMaxAge = AUTH_REFRESH_TOKEN_EXPIRY * 1000;
