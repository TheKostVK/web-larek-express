import { celebrate, Joi, Segments } from 'celebrate';
import { UPLOAD_PATH } from '../config';
import {
  PRODUCT_CATEGORY_MIN_LENGTH,
  PRODUCT_CATEGORY_MAX_LENGTH,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  IMAGE_FILE_NAME_MAX_LENGTH,
  IMAGE_ORIGINAL_NAME_MAX_LENGTH,
  PASSWORD_MAX_BYTES,
} from '../constants';

const productId = Joi.string().hex().length(24);
const password = Joi.string().max(PASSWORD_MAX_BYTES, 'utf8').messages({
  'string.max': `Пароль должен содержать не более ${PASSWORD_MAX_BYTES} байт в UTF-8`,
});
const image = Joi.object({
  fileName: Joi.string().max(UPLOAD_PATH.length + IMAGE_FILE_NAME_MAX_LENGTH + 2)
    .pattern(new RegExp(`^/${UPLOAD_PATH}/[a-zA-Z0-9_-]+\\.(png|jpg|jpeg|gif|svg)$`, 'i'))
    .required(),
  originalName: Joi.string().max(IMAGE_ORIGINAL_NAME_MAX_LENGTH).required(),
}).required();

const productFields = {
  title: Joi.string().min(2).max(30),
  image,
  category: Joi.string().min(PRODUCT_CATEGORY_MIN_LENGTH).max(PRODUCT_CATEGORY_MAX_LENGTH),
  description: Joi.string().max(PRODUCT_DESCRIPTION_MAX_LENGTH).allow(''),
  price: Joi.number().min(0).allow(null),
};

export const validateAuthorization = celebrate({
  [Segments.HEADERS]: Joi.object({
    authorization: Joi.string().pattern(/^Bearer \S+$/i).required(),
  }).unknown(true),
});

export const validateProduct = celebrate({
  [Segments.BODY]: Joi.object({
    ...productFields,
    title: productFields.title.required(),
    category: productFields.category.required(),
  }),
});

export const validateProductUpdate = celebrate({
  [Segments.BODY]: Joi.object({ ...productFields, image: image.optional() }).min(1),
});

export const validateProductId = celebrate({
  [Segments.PARAMS]: Joi.object({ productId: productId.required() }),
});

export const validateOrder = celebrate({
  [Segments.BODY]: Joi.object({
    payment: Joi.string().valid('card', 'online').required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    total: Joi.number().min(0).required(),
    items: Joi.array().items(productId.required()).min(1).unique()
      .required(),
  }),
});

export const validateRegister = celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().min(2).max(30),
    email: Joi.string().email().required(),
    password: password.min(6).required(),
  }),
});

export const validateLogin = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: password.required(),
  }),
});
