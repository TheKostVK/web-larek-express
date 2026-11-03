import { constants, promises as fs } from 'fs';
import path from 'path';
import { IMAGE_DIRECTORY, UPLOAD_PATH, UPLOAD_PATH_TEMP } from '../config';
import BadRequestError from '../errors/bad-request-error';

type FileError = Error & { code?: string };

const imageName = (fileName: string) => {
  const prefix = `/${UPLOAD_PATH}/`;
  const name = fileName.slice(prefix.length);

  if (!fileName.startsWith(prefix) || !/^[\w.-]+$/.test(name) || name === '.' || name === '..') {
    throw new BadRequestError('Некорректный путь изображения');
  }

  return name;
};

const ignoreMissingFile = (error: FileError) => {
  if (error.code !== 'ENOENT') {
    return Promise.reject(error);
  }

  return Promise.resolve();
};

/**
 * Копирует загруженное изображение в публичную папку.
 * @param fileName Публичный путь изображения.
 * @returns Был ли создан новый файл.
 */
export const promoteImage = (fileName: string): Promise<boolean> => Promise.resolve()
  .then(() => {
    const name = imageName(fileName);
    const destination = path.join(IMAGE_DIRECTORY, name);

    return fs.stat(destination)
      .then((file) => {
        if (!file.isFile()) {
          return Promise.reject(new BadRequestError('Изображение не найдено'));
        }

        return false;
      })
      .catch((error: FileError) => {
        if (error.code !== 'ENOENT') {
          return Promise.reject(error);
        }

        return fs.copyFile(path.join(UPLOAD_PATH_TEMP, name), destination, constants.COPYFILE_EXCL)
          .then(() => true)
          .catch((copyError: FileError) => {
            if (copyError.code === 'ENOENT') {
              return Promise.reject(new BadRequestError('Загрузите изображение перед сохранением товара'));
            }

            if (copyError.code === 'EEXIST') {
              return false;
            }

            return Promise.reject(copyError);
          });
      });
  });

/**
 * Удаляет изображение из публичной папки, если оно ещё существует.
 * @param fileName Публичный путь изображения.
 * @returns Завершение удаления файла.
 */
export const removeImage = (fileName: string): Promise<void> => Promise.resolve()
  .then(() => fs.unlink(path.join(IMAGE_DIRECTORY, imageName(fileName))))
  .catch(ignoreMissingFile);

/**
 * Очищает временную папку от старых загрузок.
 * @param maxAge Допустимый возраст файла в миллисекундах.
 * @returns Завершение очистки файлов.
 */
export const cleanupTemporaryFiles = (maxAge: number): Promise<void> => fs.readdir(UPLOAD_PATH_TEMP)
  .then((files) => Promise.all(files.map((name) => {
    const filePath = path.join(UPLOAD_PATH_TEMP, name);

    return fs.stat(filePath)
      .then((file) => {
        if (file.isFile() && Date.now() - file.mtimeMs >= maxAge) {
          return fs.unlink(filePath);
        }

        return undefined;
      })
      .catch(ignoreMissingFile);
  })))
  .then(() => undefined);
