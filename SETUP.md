# 🌱 Carbon Tracker - Полное руководство по установке

## 📋 Что нужно установить

### 1. Node.js (обязательно)
Скачайте и установите Node.js 18+ с официального сайта:
- Перейдите на https://nodejs.org/
- Скачайте LTS версию
- Установите (Next → Next → Finish)
- Проверьте установку в командной строке:
  ```bash
  node --version
  npm --version
  ```

### 2. PostgreSQL (база данных)

**Вариант А: Установить локально**
- Скачайте PostgreSQL с https://www.postgresql.org/download/windows/
- Запомните пароль, который укажете при установке
- После установки откройте pgAdmin 4 (автоматически установится)

**Вариант Б: Использовать Supabase (проще, рекомендуется)**
- Перейдите на https://supabase.com
- Нажмите "Start your project"
- Создайте бесплатный аккаунт
- Создайте новый проект
- Скопируйте Connection String (находится в Settings → Database)

### 3. OpenAI API Key (для AI парсинга)
- Перейдите на https://platform.openai.com/api-keys
- Создайте аккаунт или войдите
- Нажмите "Create new secret key"
- Скопируйте ключ (он показывается только один раз!)
- **ВАЖНО:** Положите на баланс минимум $5

---

## 🚀 Установка проекта

### Шаг 1: Установите зависимости

Откройте PowerShell или Command Prompt в папке проекта:

```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Шаг 2: Настройте базу данных

**Если используете Supabase:**
1. Откройте файл `backend/.env`
2. Вставьте ваш Connection String в `DATABASE_URL`

**Если используете локальный PostgreSQL:**
1. Откройте pgAdmin 4
2. Создайте новую базу данных "carbon_tracker"
3. Откройте Query Tool
4. Скопируйте содержимое файла `backend/scripts/init-db.sql`
5. Вставьте и выполните (F5)
6. В `backend/.env` укажите:
   ```
   DATABASE_URL=postgresql://postgres:ваш_пароль@localhost:5432/carbon_tracker
   ```

### Шаг 3: Настройте .env файлы

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development

# Вставьте ваш connection string от Supabase или локальный
DATABASE_URL=postgresql://postgres:password@localhost:5432/carbon_tracker

JWT_SECRET=carbon_tracker_secret_2026_change_this
JWT_EXPIRES_IN=7d

# Вставьте ваш OpenAI API key
OPENAI_API_KEY=sk-ваш-ключ-здесь

MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Шаг 4: Создайте папку для загрузок

```powershell
cd backend
mkdir uploads
```

---

## ▶️ Запуск приложения

### Терминал 1 - Backend:
```powershell
cd backend
npm run dev
```
Должно появиться: `🚀 Server running on port 5000`

### Терминал 2 - Frontend:
```powershell
cd frontend
npm run dev
```
Должно появиться: `Local: http://localhost:3000`

### Откройте браузер:
Перейдите на `http://localhost:3000`

---

## ✅ Проверка работы

1. **Регистрация**: 
   - Откройте `http://localhost:3000/register`
   - Зарегистрируйте тестовую компанию
   - Должно автоматически залогинить

2. **Загрузка счета**:
   - Перейдите в "Upload Bills"
   - Загрузите фото/PDF счета за электричество
   - Подождите обработки (AI парсинг ~10-30 сек)

3. **Просмотр результатов**:
   - Dashboard - графики выбросов
   - Calculations - детальные расчеты
   - Recommendations - советы по снижению

---

## 🐛 Возможные проблемы

### ❌ "Cannot connect to database"
- Проверьте DATABASE_URL в .env
- Убедитесь что PostgreSQL запущен (или Supabase проект активен)
- Проверьте пароль и порт

### ❌ "OpenAI API error"
- Проверьте OPENAI_API_KEY в .env
- Убедитесь что на балансе OpenAI есть деньги
- Проверьте квоты API

### ❌ "Port 5000 already in use"
- Измените PORT в backend/.env на другой (например, 5001)
- Обновите proxy в frontend/vite.config.ts

### ❌ "npm install" падает с ошибкой
- Обновите npm: `npm install -g npm@latest`
- Попробуйте удалить node_modules и package-lock.json, затем снова `npm install`

---

## 📁 Структура проекта

```
usa/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── controllers/  # Бизнес-логика
│   │   ├── models/       # Модели БД
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # AI, расчеты
│   │   └── middleware/   # Auth, errors
│   ├── uploads/          # Загруженные файлы
│   └── .env             # Настройки backend
│
├── frontend/             # React + TypeScript
│   ├── src/
│   │   ├── pages/       # Страницы приложения
│   │   ├── components/  # Компоненты UI
│   │   ├── context/     # React контексты
│   │   └── api/         # API клиент
│   └── package.json
│
└── README.md
```

---

## 🎯 Следующие шаги

1. ✅ Запустите проект локально
2. ⏳ Протестируйте загрузку разных типов счетов
3. ⏳ Проверьте точность AI парсинга
4. ⏳ Настройте деплой (Vercel + Railway)
5. ⏳ Добавьте политику конфиденциальности
6. ⏳ Настройте платежи (Stripe)

---

## 💬 Вопросы?

Если что-то не работает - опишите ошибку и я помогу!
