import { Router } from 'express';
import {
  getCurrentUser,
  login,
  logout,
  refreshAccessToken,
  register,
} from '../controllers/auth';
import auth from '../middlewares/auth';
import checkOrigin from '../middlewares/check-origin';
import { validateAuthorization, validateLogin, validateRegister } from '../middlewares/validation';

const authRouter = Router();

authRouter.post('/login', validateLogin, login);
authRouter.post('/register', validateRegister, register);
authRouter.get('/token', checkOrigin, refreshAccessToken);
authRouter.get('/logout', checkOrigin, logout);
authRouter.get('/user', validateAuthorization, auth, getCurrentUser);

export default authRouter;
