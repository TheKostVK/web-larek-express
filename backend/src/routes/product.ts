import { Router } from 'express';
import {
  createProduct, deleteProduct, getProduct, getProducts, updateProduct,
} from '../controllers/product';
import auth from '../middlewares/auth';
import {
  validateAuthorization, validateProduct, validateProductId, validateProductUpdate,
} from '../middlewares/validation';

const productRouter = Router();

productRouter.get('/', getProducts);
productRouter.get('/:productId', validateProductId, getProduct);
productRouter.post('/', validateAuthorization, auth, validateProduct, createProduct);
productRouter.patch('/:productId', validateAuthorization, auth, validateProductId, validateProductUpdate, updateProduct);
productRouter.delete('/:productId', validateAuthorization, auth, validateProductId, deleteProduct);

export default productRouter;
