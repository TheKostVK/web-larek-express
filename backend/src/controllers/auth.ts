import { NextFunction, Request, Response } from 'express';
import { HydratedDocument, isValidObjectId } from 'mongoose';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../models/user';
import BadRequestError from '../errors/bad-request-error';
import UnauthorizedError from '../errors/unauthorized-error';
import NotFoundError from '../errors/not-found-error';
import {
  createTokens,
  readRefreshToken,
  refreshCookieOptions,
  refreshCookieMaxAge,
} from '../utils/tokens';

const sendSession = (user: HydratedDocument<IUser>, res: Response, status = 200) => {
  const { accessToken, refreshToken } = createTokens(user._id.toString());

  return User.findByIdAndUpdate(user._id, {
    $push: { tokens: { token: refreshToken } },
  }, { new: true, runValidators: true })
    .then((updatedUser) => {
      if (!updatedUser) {
        return Promise.reject(new NotFoundError('Пользователь не найден'));
      }

      return res.status(status)
        .cookie('refreshToken', refreshToken, {
          ...refreshCookieOptions,
          maxAge: refreshCookieMaxAge,
        })
        .send({
          user: { email: updatedUser.email, name: updatedUser.name },
          success: true,
          accessToken,
        });
    });
};

export const register = (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;

  return bcrypt.hash(password, 10)
    .then((hash) => User.create({ name, email, password: hash }))
    .then((user) => sendSession(user, res, 201))
    .catch(next);
};

export const login = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  return User.findOne({ email }).select('+password')
    .then((user) => {
      if (!user) {
        return Promise.reject(new UnauthorizedError('Неправильная почта или пароль'));
      }

      return bcrypt.compare(password, user.password).then((matched) => {
        if (!matched) {
          return Promise.reject(new UnauthorizedError('Неправильная почта или пароль'));
        }
        return user;
      });
    })
    .then((user) => sendSession(user, res))
    .catch(next);
};

export const getCurrentUser = (req: Request, res: Response, next: NextFunction) => (
  User.findById(req.user?._id)
    .then((user) => {
      if (!user) {
        return Promise.reject(new NotFoundError('Пользователь не найден'));
      }
      return res.send({ user: { email: user.email, name: user.name }, success: true });
    })
    .catch(next)
);

export const refreshAccessToken = (req: Request, res: Response, next: NextFunction) => (
  readRefreshToken(req)
    .then(({ _id, token }) => {
      if (!isValidObjectId(_id)) {
        return Promise.reject(new UnauthorizedError('Refresh-токен недействителен'));
      }

      return User.findById(_id).then((user) => {
        if (!user) {
          return Promise.reject(new NotFoundError('Пользователь не найден'));
        }

        const { accessToken, refreshToken } = createTokens(_id);

        return User.findOneAndUpdate({ _id, 'tokens.token': token }, {
          $set: { 'tokens.$.token': refreshToken },
        }, { new: true, runValidators: true })
          .then((updatedUser) => {
            if (!updatedUser) {
              return Promise.reject(new UnauthorizedError('Сессия завершена'));
            }

            return res.cookie('refreshToken', refreshToken, {
              ...refreshCookieOptions,
              maxAge: refreshCookieMaxAge,
            }).send({
              user: { email: updatedUser.email, name: updatedUser.name },
              success: true,
              accessToken,
            });
          });
      });
    })
    .catch(next)
);

export const logout = (req: Request, res: Response, next: NextFunction) => (
  readRefreshToken(req)
    .then(({ _id, token }) => {
      if (!isValidObjectId(_id)) {
        return Promise.reject(new BadRequestError('Некорректный идентификатор пользователя'));
      }

      return User.findById(_id).then((user) => {
        if (!user) {
          return Promise.reject(new NotFoundError('Пользователь не найден'));
        }

        return User.findOneAndUpdate({ _id, 'tokens.token': token }, {
          $pull: { tokens: { token } },
        }, { new: true, runValidators: true })
          .then((updatedUser) => {
            if (!updatedUser) {
              return Promise.reject(new UnauthorizedError('Сессия завершена'));
            }

            return res.clearCookie('refreshToken', refreshCookieOptions)
              .send({ success: true });
          });
      });
    })
    .catch(next)
);
