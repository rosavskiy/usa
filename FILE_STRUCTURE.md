# 📂 ПОЛНАЯ СТРУКТУРА ПРОЕКТА

```
usa/
│
├── 📄 README.md                    # Главное описание проекта
├── 📄 START_HERE.md                # ⭐ НАЧНИТЕ С ЭТОГО ФАЙЛА
├── 📄 SETUP.md                     # Подробная инструкция по установке
├── 📄 CHECKLIST.md                 # Чеклист для запуска
├── 📄 PROJECT_SUMMARY.md           # Итоговый отчет (что сделано)
├── 📄 HOW_IT_WORKS.md              # Как работает система
├── 📄 FAQ.md                       # Часто задаваемые вопросы
├── 📄 RUN_SCRIPTS.md               # Команды для запуска
├── 📄 .gitignore                   # Git ignore правила
│
├── 📁 .vscode/                     # VS Code настройки
│   ├── settings.json               # Форматирование, ESLint
│   └── extensions.json             # Рекомендуемые расширения
│
├── 📁 backend/                     # 🔧 BACKEND (Node.js + TypeScript)
│   │
│   ├── 📁 src/                     # Исходный код
│   │   │
│   │   ├── 📄 index.ts             # ⚡ Главный файл сервера
│   │   │
│   │   ├── 📁 config/
│   │   │   └── database.ts         # PostgreSQL подключение
│   │   │
│   │   ├── 📁 controllers/         # 🎮 Контроллеры (бизнес-логика)
│   │   │   ├── auth.controller.ts         # Регистрация/вход
│   │   │   ├── upload.controller.ts       # Загрузка файлов
│   │   │   └── carbon.controller.ts       # Расчеты выбросов
│   │   │
│   │   ├── 📁 models/              # 🗄️ Модели базы данных
│   │   │   ├── user.model.ts              # Пользователи
│   │   │   ├── document.model.ts          # Документы/счета
│   │   │   └── carbon.model.ts            # Расчеты выбросов
│   │   │
│   │   ├── 📁 services/            # 🤖 Сервисы (логика)
│   │   │   ├── ai.service.ts              # OpenAI парсинг
│   │   │   ├── carbon.service.ts          # Калькулятор выбросов
│   │   │   └── recommendations.service.ts # Генерация рекомендаций
│   │   │
│   │   ├── 📁 routes/              # 🛣️ API маршруты
│   │   │   ├── auth.routes.ts             # /api/auth/*
│   │   │   ├── upload.routes.ts           # /api/upload/*
│   │   │   └── carbon.routes.ts           # /api/carbon/*
│   │   │
│   │   ├── 📁 middleware/          # 🔒 Middleware
│   │   │   ├── auth.middleware.ts         # JWT проверка
│   │   │   └── error.middleware.ts        # Обработка ошибок
│   │   │
│   │   └── 📁 utils/               # 🛠️ Утилиты
│   │       └── jwt.utils.ts               # JWT функции
│   │
│   ├── 📁 scripts/                 # 📜 Скрипты
│   │   └── init-db.sql             # SQL схема для создания таблиц
│   │
│   ├── 📁 uploads/                 # 📤 Загруженные файлы (создать вручную!)
│   │
│   ├── 📄 package.json             # Зависимости backend
│   ├── 📄 tsconfig.json            # TypeScript конфигурация
│   ├── 📄 nodemon.json             # Nodemon конфигурация
│   ├── 📄 .env.example             # Пример .env
│   ├── 📄 .env                     # ⚠️ НАСТРОИТЬ! API ключи
│   ├── 📄 .gitignore               # Git ignore
│   └── 📄 README.md                # Backend документация
│
└── 📁 frontend/                    # 🎨 FRONTEND (React + TypeScript)
    │
    ├── 📁 src/                     # Исходный код
    │   │
    │   ├── 📄 main.tsx             # ⚡ Entry point
    │   ├── 📄 App.tsx              # Главный компонент + роутинг
    │   ├── 📄 index.css            # Tailwind CSS стили
    │   │
    │   ├── 📁 api/                 # 🌐 API клиент
    │   │   └── axios.ts            # Axios настройки + interceptors
    │   │
    │   ├── 📁 context/             # 🔄 React Context
    │   │   └── AuthContext.tsx     # Управление аутентификацией
    │   │
    │   ├── 📁 components/          # 🧩 UI компоненты
    │   │   └── Layout.tsx          # Главный layout (header, nav)
    │   │
    │   └── 📁 pages/               # 📄 Страницы
    │       ├── Login.tsx           # Страница входа
    │       ├── Register.tsx        # Страница регистрации
    │       ├── Dashboard.tsx       # Главная страница + графики
    │       ├── Upload.tsx          # Загрузка счетов
    │       ├── Calculations.tsx    # История расчетов
    │       └── Recommendations.tsx # Рекомендации
    │
    ├── 📄 index.html               # HTML template
    ├── 📄 package.json             # Зависимости frontend
    ├── 📄 vite.config.ts           # Vite конфигурация + proxy
    ├── 📄 tsconfig.json            # TypeScript конфигурация
    ├── 📄 tsconfig.node.json       # TypeScript для Node
    ├── 📄 tailwind.config.js       # Tailwind CSS конфигурация
    ├── 📄 postcss.config.js        # PostCSS конфигурация
    ├── 📄 .gitignore               # Git ignore
    └── 📄 README.md                # Frontend документация
```

---

## 🎯 КЛЮЧЕВЫЕ ФАЙЛЫ ДЛЯ НАСТРОЙКИ

### ⚠️ КРИТИЧЕСКИ ВАЖНЫЕ:

1. **`backend/.env`**
   - DATABASE_URL (Supabase connection string)
   - OPENAI_API_KEY (OpenAI API key)
   - JWT_SECRET (секретный ключ)

2. **`backend/uploads/`**
   - Папка для загруженных файлов
   - СОЗДАТЬ ВРУЧНУЮ: `mkdir backend/uploads`

3. **База данных**
   - Выполнить `backend/scripts/init-db.sql` в Supabase

---

## 📊 ФАЙЛЫ ПО КАТЕГОРИЯМ

### 📚 Документация (читать сначала):
- START_HERE.md ⭐
- SETUP.md
- CHECKLIST.md
- FAQ.md
- HOW_IT_WORKS.md
- PROJECT_SUMMARY.md

### 🔧 Backend код:
- src/index.ts (главный сервер)
- src/controllers/* (API логика)
- src/services/ai.service.ts (OpenAI парсинг)
- src/services/carbon.service.ts (расчеты выбросов)

### 🎨 Frontend код:
- src/App.tsx (роутинг)
- src/pages/Dashboard.tsx (главная страница)
- src/pages/Upload.tsx (загрузка)
- src/context/AuthContext.tsx (аутентификация)

### ⚙️ Конфигурация:
- backend/package.json
- backend/tsconfig.json
- backend/.env
- frontend/package.json
- frontend/vite.config.ts
- frontend/tailwind.config.js

---

## 📝 ИТОГО:

**Всего файлов:** 50+
**Backend файлов:** 25+
**Frontend файлов:** 20+
**Документации:** 8 файлов
**Строк кода:** ~3500+

---

## 🚀 БЫСТРЫЙ СТАРТ:

```bash
# 1. Прочитать
START_HERE.md

# 2. Настроить
backend/.env (API ключи)

# 3. Установить
cd backend && npm install
cd ../frontend && npm install

# 4. Создать
mkdir backend/uploads

# 5. База данных
# Выполнить backend/scripts/init-db.sql в Supabase

# 6. Запустить
# Терминал 1: cd backend && npm run dev
# Терминал 2: cd frontend && npm run dev

# 7. Открыть
http://localhost:3000
```

**Готово! 🎉**
