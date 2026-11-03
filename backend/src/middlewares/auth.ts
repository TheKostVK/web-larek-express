import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AUTH_ACCESS_TOKEN_SECRET } from '../config';
import UnauthorizedError from '../errors/unauthorized-error';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { _id: string };
  }
}

/**
 * Проверяет access-токен и сохраняет идентификатор пользователя в запросе.
 * @param req Запрос с заголовком Authorization.
 * @param _res Ответ Express.
 * @param next Передаёт управление обработчику или middleware ошибок.
 */
const auth = (req: Request, _res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization || !/^Bearer \S+$/i.test(authorization)) {
    next(new UnauthorizedError('Необходима авторизация'));
    return;
  }

  try {
    const payload = jwt.verify(authorization.slice(7), AUTH_ACCESS_TOKEN_SECRET, {
      algorithms: ['HS256'],
    });

    if (typeof payload === 'string' || typeof payload._id !== 'string'
      || !/^[a-f\d]{24}$/i.test(payload._id)) {
      next(new UnauthorizedError('Токен недействителен'));
      return;
    }

    req.user = { _id: payload._id };
    next();
  } catch (_error) {
    next(new UnauthorizedError('Токен недействителен'));
  }
};

export default auth;
