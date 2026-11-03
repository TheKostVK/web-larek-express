import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import Product from '../models/product';
import BadRequestError from '../errors/bad-request-error';

/**
 * Проверяет состав и сумму заказа без сохранения заказа в базе.
 * @param req Проверенные данные заказа.
 * @param res Ответ с идентификатором и суммой заказа.
 * @param next Централизованная обработка ошибки.
 * @returns Завершение проверки и оформления заказа.
 */
const createOrder = (req: Request, res: Response, next: NextFunction) => {
  const { items, total } = req.body as { items: string[]; total: number };

  return Product.find({ _id: { $in: items } })
    .then((products) => {
      if (products.length !== items.length) {
        return Promise.reject(new BadRequestError('В заказе есть несуществующие товары'));
      }

      if (products.some((product) => product.price === null)) {
        return Promise.reject(new BadRequestError('В заказе есть товар, который не продаётся'));
      }

      const actualTotal = products.reduce((sum, product) => sum + (product.price ?? 0), 0);
      const tolerance = Number.EPSILON * Math.max(1, Math.abs(total)) * items.length;

      if (Math.abs(actualTotal - total) > tolerance) {
        return Promise.reject(new BadRequestError('Сумма заказа не совпадает со стоимостью товаров'));
      }

      return res.send({ id: randomUUID(), total });
    })
    .catch(next);
};

export default createOrder;
