import { Schema, model, HydratedDocument } from 'mongoose';
import { removeImage } from '../utils/files';
import { UPLOAD_PATH } from '../config';
import {
  PRODUCT_CATEGORY_MIN_LENGTH,
  PRODUCT_CATEGORY_MAX_LENGTH,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  IMAGE_FILE_NAME_MAX_LENGTH,
  IMAGE_ORIGINAL_NAME_MAX_LENGTH,
} from '../constants';

export interface IProductImage {
  fileName: string;
  originalName: string;
}

export interface IProduct {
  title: string;
  image: IProductImage;
  category: string;
  description?: string;
  price: number | null;
}

const imageSchema = new Schema<IProductImage>({
  fileName: {
    type: String,
    required: [true, 'Укажите путь изображения'],
    maxlength: [UPLOAD_PATH.length + IMAGE_FILE_NAME_MAX_LENGTH + 2, 'Путь изображения слишком длинный'],
    validate: {
      validator: (value: string) => {
        const prefix = `/${UPLOAD_PATH}/`;
        const name = value.slice(prefix.length);

        return value.startsWith(prefix) && /^[\w.-]+$/.test(name) && name !== '.' && name !== '..';
      },
      message: 'Укажите корректный путь изображения',
    },
  },
  originalName: {
    type: String,
    required: [true, 'Укажите исходное имя изображения'],
    maxlength: [IMAGE_ORIGINAL_NAME_MAX_LENGTH, `Имя изображения должно содержать не более ${IMAGE_ORIGINAL_NAME_MAX_LENGTH} символов`],
  },
}, { _id: false });

const productSchema = new Schema<IProduct>({
  title: {
    type: String,
    required: [true, 'Укажите название товара'],
    unique: true,
    minlength: [2, 'Название товара должно содержать не менее 2 символов'],
    maxlength: [30, 'Название товара должно содержать не более 30 символов'],
  },
  image: {
    type: imageSchema,
    required: [true, 'Укажите изображение товара'],
  },
  category: {
    type: String,
    required: [true, 'Укажите категорию товара'],
    minlength: [PRODUCT_CATEGORY_MIN_LENGTH, `Категория товара должна содержать не менее ${PRODUCT_CATEGORY_MIN_LENGTH} символов`],
    maxlength: [PRODUCT_CATEGORY_MAX_LENGTH, `Категория товара должна содержать не более ${PRODUCT_CATEGORY_MAX_LENGTH} символов`],
  },
  description: {
    type: String,
    maxlength: [PRODUCT_DESCRIPTION_MAX_LENGTH, `Описание товара должно содержать не более ${PRODUCT_DESCRIPTION_MAX_LENGTH} символов`],
  },
  price: {
    type: Number,
    default: null,
    min: [0, 'Цена товара не может быть отрицательной'],
    validate: {
      validator: (value: number | null) => value === null || Number.isFinite(value),
      message: 'Укажите конечное число для цены товара',
    },
  },
}, { versionKey: false });

productSchema.post('findOneAndDelete', function deleteProductImage(product: HydratedDocument<IProduct> | null) {
  if (!product) {
    return Promise.resolve();
  }

  return this.model.exists({ 'image.fileName': product.image.fileName })
    .then((existing) => {
      if (existing) {
        return undefined;
      }

      return removeImage(product.image.fileName);
    });
});

export default model<IProduct>('product', productSchema);
