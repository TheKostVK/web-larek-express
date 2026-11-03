import { Schema, model } from 'mongoose';
import validator from 'validator';

export interface IUser {
  name: string;
  email: string;
  password: string;
  tokens: { token: string }[];
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    minlength: [2, 'Имя должно содержать не менее 2 символов'],
    maxlength: [30, 'Имя должно содержать не более 30 символов'],
    default: 'Ё-мое',
  },
  email: {
    type: String,
    required: [true, 'Укажите электронную почту'],
    unique: true,
    validate: {
      validator: (value: string) => validator.isEmail(value),
      message: 'Укажите корректную электронную почту',
    },
  },
  password: {
    type: String,
    required: [true, 'Укажите пароль'],
    minlength: [6, 'Пароль должен содержать не менее 6 символов'],
    select: false,
  },
  tokens: {
    type: [{
      token: { type: String, required: true },
      _id: false,
    }],
    default: [],
    select: false,
  },
});

export default model<IUser>('user', userSchema);
