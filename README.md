# Web-ларёк. Тёмная сторона

Бэкенд на Express, TypeScript и MongoDB. Реализованы каталог и заказы, регистрация, JWT-авторизация с обновлением токенов, загрузка изображений и управление товарами. Фронтенд взят из стартовой ветки `admin`.

## Запуск

1. Запустите MongoDB и установите зависимости: `npm ci --prefix backend` и `npm ci --prefix frontend`.
2. Скопируйте `backend/.env.example` в `backend/.env`, а `frontend/.env.example` — в `frontend/.env`.
3. В `backend/.env` задайте два разных ключа `AUTH_ACCESS_TOKEN_SECRET` и `AUTH_REFRESH_TOKEN_SECRET`. Каждый можно сгенерировать командой `openssl rand -hex 32`.
4. Из папки `backend` выполните `npm run seed`, чтобы добавить учебные товары. Повторный запуск не перезаписывает существующие товары.
5. В отдельных терминалах выполните `npm run dev --prefix backend` и `npm run dev --prefix frontend`.

Если ключи не заданы, в режиме разработки сервер создаёт временные ключи на один запуск. При `NODE_ENV=production` оба ключа обязательны.

Магазин доступен по адресу http://localhost:5173, сервер — http://localhost:3000. В интерфейсе можно зарегистрироваться и перейти в управление товарами. Данные подключения, CORS, сроки токенов, папки загрузок и лимиты задаются в `backend/.env`.

Для Docker в `backend/.env` укажите `DB_ADDRESS=mongodb://root:example@mongo:27017/weblarek?authSource=admin`, `ORIGIN_ALLOW=http://localhost`, а в `frontend/.env` — `VITE_API_ORIGIN=http://localhost/api`. Затем выполните `docker compose up --build`. Магазин откроется на http://localhost. Учебные товары можно загрузить командой `docker compose exec backend npm run seed`.

## Команды бэкенда

- `npm run start` — запуск через ts-node.
- `npm run dev` — запуск с перезагрузкой при изменениях.
- `npm run build` — сборка в `dist`.
- `npm run lint` — проверка ESLint.
- `npm run seed` — загрузка учебного каталога.

## API

Публичные маршруты: `GET /product`, `GET /product/:productId`, `POST /order`, `POST /auth/register`, `POST /auth/login`, `GET /auth/token`, `GET /auth/logout`.

Для `GET /auth/user`, `POST /upload`, `POST /product`, `PATCH /product/:productId` и `DELETE /product/:productId` нужен заголовок `Authorization: Bearer <accessToken>`. Refresh-токен передаётся в cookie `refreshToken` с флагом httpOnly.

Изображения сначала загружаются через `POST /upload` в поле `file`, затем полученные `fileName` и `originalName` передаются при сохранении товара. Старые временные файлы удаляются по расписанию. Запросы и ошибки записываются в `backend/request.log` и `backend/error.log`; эти файлы не включаются в Git.
