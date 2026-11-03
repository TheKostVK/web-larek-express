import { NextFunction, Request, Response } from 'express';
import { ORIGIN_ALLOW } from '../config';
import UnauthorizedError from '../errors/unauthorized-error';

/** Защищает операции с refresh-cookie от переходов с чужих сайтов. */
const checkOrigin = (req: Request, _res: Response, next: NextFunction) => {
  const origin = req.get('Origin');
  if (req.get('Sec-Fetch-Site') === 'cross-site' || (origin && !ORIGIN_ALLOW.includes(origin))) {
    next(new UnauthorizedError('Недопустимый источник запроса'));
    return;
  }
  next();
};

export default checkOrigin;
