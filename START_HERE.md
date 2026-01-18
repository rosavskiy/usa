# 📝 ЧТО ДЕЛАТЬ ДАЛЬШЕ - Краткая инструкция

## ✅ ЧТО УЖЕ СДЕЛАНО (за вас):

Создан **полноценный MVP** Carbon Tracker:

**Backend:**
- Регистрация и вход пользователей
- Загрузка файлов (счета, чеки)
- AI парсинг через OpenAI GPT-4 Vision
- Расчет углеродного следа (CO2, CH4, N2O)
- Автоматические рекомендации по снижению выбросов
- REST API для frontend

**Frontend:**
- Красивый интерфейс (React + Tailwind)
- Страница входа/регистрации
- Dashboard с графиками
- Загрузка счетов drag & drop
- Просмотр расчетов и рекомендаций

---

## 🎯 ЧТО НУЖНО СДЕЛАТЬ ВАМ:

### 1. Установить Node.js (5 минут)
- Перейдите на https://nodejs.org/
- Скачайте LTS версию
- Установите (просто жмите Next)
- Перезагрузите компьютер

### 2. Получить OpenAI API ключ (10 минут)
- Перейдите на https://platform.openai.com/api-keys
- Зарегистрируйтесь/войдите
- Нажмите "Create new secret key"
- Скопируйте ключ (показывается 1 раз!)
- Положите $5-10 на баланс (Billing)

### 3. Создать базу данных Supabase (5 минут)
- Перейдите на https://supabase.com
- Нажмите "Start your project"
- Создайте аккаунт (бесплатно!)
- Create new project → укажите название и пароль
- Перейдите в Settings → Database
- Скопируйте "Connection string" (URI)

### 4. Настроить проект (10 минут)

Откройте PowerShell в папке проекта:

```powershell
# Установить зависимости backend
cd backend
npm install

# Настроить .env
# Откройте файл backend\.env в блокноте
# Вставьте туда:
# - DATABASE_URL от Supabase
# - OPENAI_API_KEY от OpenAI

# Создать папку для загрузок
mkdir uploads
```

```powershell
# Установить зависимости frontend
cd ..\frontend
npm install
```

 Editor
- Нажмите Run

### 6. Запустить проект (1 минута)

**Терминал 1 (Backend):**
```powershell
cd backend
npm run dev
```
Должно появиться: "Server running on port 5000"

**Терминал 2 (Frontend):**
```powershell
cd frontend
npm run dev
```
Должно появиться: "Local: http://localhost:3000"

### 7. Протестирова### 5. Настроить базу данных (2 минуты)
- Откройте https://supabase.com → ваш проект
- Перейдите в SQL Editor (слева в меню)
- Нажмите "New query"
- Откройте файл `backend\scripts\init-db.sql`
- Скопируйте все содержимое
- Вставьте в Supabase SQLть (5 минут)
- Откройте браузер → http://localhost:3000
- Зарегистрируйтесь (тестовая компания)
- Загрузите фото счета за электричество
- Посмотрите результаты!

---

## 📂 ВАЖНЫЕ ФАЙЛЫ:

- `SETUP.md` - Подробная инструкция со всеми деталями
- `README.md` - Общее описание проекта
- `backend/.env` - **ЗДЕСЬ настраиваете API ключи!**
- `backend/scripts/init-db.sql` - SQL для создания таблиц

---

## 🐛 ЕСЛИ ЧТО-ТО НЕ РАБОТАЕТ:

### "npm не найден"
→ Установите Node.js и перезагрузите компьютер

### "Cannot connect to database"
→ Проверьте DATABASE_URL в `backend/.env`

### "OpenAI API error"
→ Проверьте OPENAI_API_KEY в `backend/.env` и баланс

### "Port 5000 already in use"
→ Измените PORT в `backend/.env` на 5001

---

## 📞 НУЖНА ПОМОЩЬ?

Опишите проблему и я помогу!

---

## ⏭ ПОСЛЕ ЗАПУСКА:

1. Протестируйте разные типы счетов
2. Проверьте точность AI парсинга
3. Настройте деплой на продакшн (Vercel + Railway)
4. Добавьте Privacy Policy и Terms
5. Подключите Stripe для оплаты

**Проект готов на 95%! Осталось только настроить API ключи и запустить.**
