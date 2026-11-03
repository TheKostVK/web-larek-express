import { NextFunction, Request, Response } from 'express';
import Product, { IProduct } from '../models/product';
import NotFoundError from '../errors/not-found-error';
import { promoteImage, removeImage } from '../utils/files';
import serializeProductMutation from '../utils/product-mutation';

const removeUnusedImage = (fileName: string) => Product.exists({ 'image.fileName': fileName })
  .then((product) => {
    if (product) {
      return undefined;
    }

    return removeImage(fileName);
  });

export const getProducts = (_req: Request, res: Response, next: NextFunction) => Product.find({})
  .then((items) => res.send({ items, total: items.length }))
  .catch(next);

export const getProduct = (req: Request, res: Response, next: NextFunction) => Product
  .findById(req.params.productId)
  .then((product) => {
    if (!product) {
      return Promise.reject(new NotFoundError('Товар не найден'));
    }

    return res.send(product);
  })
  .catch(next);

/**
 * Сохраняет товар и копирует его изображение в публичную папку.
 * @param req Проверенные данные товара.
 * @param res Ответ с созданным товаром.
 * @param next Централизованная обработка ошибки.
 * @returns Завершение сохранения товара и изображения.
 */
export const createProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => serializeProductMutation(() => {
  const {
    title, image, category, description, price,
  } = req.body as IProduct;
  let copied = false;

  return promoteImage(image.fileName)
    .then((created) => {
      copied = created;
      return Product.create({
        title, image, category, description, price,
      });
    })
    .then((product) => res.status(201).send(product))
    .catch((error: unknown) => {
      if (copied) {
        return removeUnusedImage(image.fileName)
          .then(() => next(error))
          .catch(next);
      }

      return next(error);
    });
});

/**
 * Обновляет товар и удаляет прежнее изображение, если оно больше не используется.
 * @param req Идентификатор и проверенные поля товара.
 * @param res Ответ с обновлённым товаром.
 * @param next Централизованная обработка ошибки.
 * @returns Завершение обновления товара и изображения.
 */
export const updateProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => serializeProductMutation(() => {
  const {
    title, image, category, description, price,
  } = req.body as Partial<IProduct>;
  let previousImage: string;
  let copied = false;
  const fields = Object.fromEntries(Object.entries({
    title, image, category, description, price,
  }).filter(([, value]) => value !== undefined));

  return Product.findById(req.params.productId)
    .then((product) => {
      if (!product) {
        return Promise.reject(new NotFoundError('Товар не найден'));
      }

      previousImage = product.image.fileName;
      return image ? promoteImage(image.fileName) : false;
    })
    .then((created) => {
      copied = created;
      return Product.findByIdAndUpdate(req.params.productId, { $set: fields }, {
        new: true,
        runValidators: true,
      });
    })
    .then((product) => {
      if (!product) {
        return Promise.reject(new NotFoundError('Товар не найден'));
      }

      if (image && image.fileName !== previousImage) {
        return removeUnusedImage(previousImage).then(() => res.send(product));
      }

      return res.send(product);
    })
    .catch((error: unknown) => {
      if (copied && image) {
        return removeUnusedImage(image.fileName)
          .then(() => next(error))
          .catch(next);
      }

      return next(error);
    });
});

/**
 * Удаляет товар и освобождает его изображение в общей очереди изменений.
 * @param req Запрос с идентификатором товара.
 * @param res Ответ с удалённым товаром.
 * @param next Централизованная обработка ошибки.
 * @returns Завершение удаления товара и неиспользуемого изображения.
 */
export const deleteProduct = (
  req: Request,
  res: Response,
  next: NextFunction,
) => serializeProductMutation(() => Product
  .findByIdAndDelete(req.params.productId)
  .then((product) => {
    if (!product) {
      return Promise.reject(new NotFoundError('Товар не найден'));
    }

    return res.send(product);
  })
  .catch(next));
