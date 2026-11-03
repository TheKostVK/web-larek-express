let pendingMutation: Promise<void> = Promise.resolve();

/**
 * Последовательно изменяет товары и их изображения в пределах процесса сервера.
 * @param mutation Изменение товара вместе с копированием и очисткой изображений.
 * @returns Результат изменения после завершения предыдущей операции.
 */
const serializeProductMutation = <T>(mutation: () => Promise<T>): Promise<T> => {
  const result = pendingMutation.then(mutation);
  pendingMutation = result.then(() => undefined, () => undefined);
  return result;
};

export default serializeProductMutation;
