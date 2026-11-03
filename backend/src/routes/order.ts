import { Router } from 'express';
import createOrder from '../controllers/order';
import { validateOrder } from '../middlewares/validation';

const orderRouter = Router();

orderRouter.post('/', validateOrder, createOrder);

export default orderRouter;
