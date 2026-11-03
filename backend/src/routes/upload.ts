import { Router } from 'express';
import uploadFile from '../controllers/upload';
import auth from '../middlewares/auth';
import { uploadImage } from '../middlewares/file';
import { validateAuthorization } from '../middlewares/validation';

const uploadRouter = Router();

uploadRouter.post('/', validateAuthorization, auth, uploadImage, uploadFile);

export default uploadRouter;
