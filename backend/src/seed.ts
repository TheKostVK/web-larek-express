import mongoose from 'mongoose';
import { readFile } from 'fs/promises';
import path from 'path';
import { DB_ADDRESS } from './config';
import Product, { IProduct } from './models/product';
import { serverLogger } from './middlewares/logger';

mongoose.connect(DB_ADDRESS)
  .then(() => readFile(path.resolve(__dirname, '../src/data/product.json'), 'utf8'))
  .then((data: string) => {
    const products: IProduct[] = JSON.parse(data);
    return Product.bulkWrite(products.map((product) => ({
      updateOne: {
        filter: { title: product.title },
        update: { $setOnInsert: product },
        upsert: true,
      },
    })));
  })
  .then((result) => serverLogger.info(`Добавлено товаров: ${result.upsertedCount}`))
  .catch((error: Error) => {
    serverLogger.error(`Не удалось загрузить товары: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
