# Carbon Tracker Backend

Backend API для автоматического расчета углеродного следа.

## Установка

```bash
cd backend
npm install
```

## Настройка

1. Скопируйте `.env.example` в `.env`:
```bash
cp .env.example .env
```

2. Настройте переменные окружения в `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - секретный ключ для JWT
- `OPENAI_API_KEY` - API ключ OpenAI

3. Создайте базу данных:
```bash
psql -U postgres -f scripts/init-db.sql
```

## Запуск

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/profile` - Профиль (требует токен)

### Documents
- `POST /api/upload` - Загрузка чека (требует токен)
- `GET /api/upload` - Список документов (требует токен)

### Carbon
- `POST /api/carbon/calculate` - Расчет выбросов (требует токен)
- `GET /api/carbon/calculations` - История расчетов (требует токен)
- `GET /api/carbon/recommendations` - Рекомендации (требует токен)

## Технологии

- Node.js + Express
- TypeScript
- PostgreSQL
- JWT Authentication
- OpenAI GPT-4 Vision API
- Multer (file uploads)
- Bcrypt (password hashing)
