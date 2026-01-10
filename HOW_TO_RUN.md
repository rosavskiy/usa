# 🚀 КАК ЗАПУСТИТЬ ПРОЕКТ - Для НЕ-программистов

## ⚡ ГЛАВНОЕ: Я не могу запустить за тебя!

Я - это AI помощник в VS Code. Я могу только **писать код** и **объяснять**. 
Запускать программы на твоем компьютере можешь только **ТЫ**.

Но я сделал максимально простую инструкцию! 💪

---

## 📝 ЧТО ДОБАВЛЕНО СЕЙЧАС:

✅ **Всплывающее окно Privacy Policy** - блокирует сайт пока не примешь
✅ **Полная Privacy Policy** - со всеми законами США (CCPA, CPRA, Virginia, Colorado, Connecticut, Utah)
✅ **Terms of Service** - снимает с нас ответственность по максимуму
✅ **Disclaimer** - "расчеты приблизительные, не для официальной отчетности"
✅ **Цена изменена** - теперь $150-200/МЕСЯЦ (а не год)

---

## 🎯 ДВА ВАРИАНТА ЗАПУСКА

### Вариант 1: ЛОКАЛЬНО (на твоем компьютере)
Плюсы: бесплатно, для тестов
Минусы: работает только когда ПК включен, только ты видишь
Ссылка будет: `http://localhost:3000`

### Вариант 2: ПРОДАКШН (в интернете)
Плюсы: работает 24/7, все могут зайти
Минусы: нужно настроить деплой
Ссылка будет: `https://carbontracker.vercel.app` (или свой домен)

---

## 🔥 ВАРИАНТ 1: ЗАПУСК ЛОКАЛЬНО (45 минут)

### ШАГ 1: Установи Node.js (10 мин)

1. Открой браузер
2. Перейди на https://nodejs.org/
3. Нажми большую зеленую кнопку "Download Node.js (LTS)"
4. Скачается файл типа `node-v20.11.0-x64.msi`
5. Запусти его (двойной клик)
6. Жми "Next" → "Next" → "Install"
7. **ОБЯЗАТЕЛЬНО: Перезагрузи компьютер!**

**Проверка:**
- Открой PowerShell (Win+R → напиши `powershell` → Enter)
- Напиши `node --version` → должно показать `v20.11.0` или похожее
- Если не показывает - перезагрузи ПК еще раз

---

### ШАГ 2: Получи OpenAI API ключ (15 мин)

1. Открой https://platform.openai.com/
2. Нажми "Sign up" (или "Log in" если есть аккаунт)
3. Зарегистрируйся (email, пароль)
4. Подтверди email
5. Перейди в "API keys" (слева в меню)
6. Нажми "Create new secret key"
7. **ВАЖНО: Скопируй ключ!** Он начинается с `sk-proj-...`
8. Сохрани в блокнот (показывается только 1 раз!)
9. Перейди в "Billing" → "Add payment method"
10. Привяжи карту
11. Нажми "Add credits" → добавь $10
12. Готово!

**Примерная стоимость:** $0.01-0.03 за обработку одного счета

---

### ШАГ 3: Создай базу данных Supabase (10 мин)

1. Открой https://supabase.com/
2. Нажми "Start your project"
3. Sign up (можно через Google/GitHub)
4. Нажми "New project"
5. Заполни:
   - Organization: создай новую (любое название)
   - Name: `carbon-tracker`
   - Database Password: придумай пароль (ЗАПОМНИ!)
   - Region: выбери ближайший (например `East US`)
6. Нажми "Create new project" → подожди 2-3 минуты
7. Перейди в Settings → Database
8. Найди "Connection string" → выбери "URI"
9. Скопируй строку типа `postgresql://postgres:[YOUR-PASSWORD]@...`
10. **ВАЖНО:** Замени `[YOUR-PASSWORD]` на свой пароль из шага 5
11. Сохрани в блокнот!

---

### ШАГ 4: Настрой проект (10 мин)

1. Открой папку проекта в Проводнике (где файлы backend, frontend)
2. В адресной строке напиши `powershell` и нажми Enter
3. Откроется PowerShell в этой папке

**Установка зависимостей:**

```powershell
# Перейди в backend
cd backend

# Установи зависимости (подожди 1-2 минуты)
npm install

# Вернись назад и перейди в frontend
cd ..
cd frontend

# Установи зависимости (подожди 1-2 минуты)
npm install

# Вернись в корень
cd ..
```

**Настройка .env:**

1. Открой файл `backend\.env` в Блокноте
2. Найди строку `DATABASE_URL=...`
3. Вставь свою строку от Supabase (из Шага 3)
4. Найди строку `OPENAI_API_KEY=...`
5. Вставь свой ключ от OpenAI (из Шага 2)
6. Сохрани (Ctrl+S)

**Создай папку uploads:**

```powershell
cd backend
mkdir uploads
cd ..
```

---

### ШАГ 5: Создай таблицы в базе данных (5 мин)

1. Открой Supabase → твой проект
2. Слева найди "SQL Editor"
3. Нажми "New query"
4. Открой файл `backend\scripts\init-db.sql` в Блокноте
5. Скопируй ВСЕ содержимое (Ctrl+A → Ctrl+C)
6. Вставь в Supabase SQL Editor (Ctrl+V)
7. Нажми "Run" (или Ctrl+Enter)
8. Должно написать "Success. No rows returned"
9. Готово!

---

### ШАГ 6: ЗАПУСК! (2 мин)

**Открой 2 PowerShell окна:**

**Окно 1 (Backend):**
```powershell
cd путь\к\проекту\backend
npm run dev
```

Должно появиться:
```
✅ Database connected
🚀 Server running on port 5000
📊 Environment: development
```

**Окно 2 (Frontend):**
```powershell
cd путь\к\проекту\frontend
npm run dev
```

Должно появиться:
```
VITE v5.0.11  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

---

### ШАГ 7: Открой браузер! 🎉

1. Открой Google Chrome
2. В адресной строке напиши: `http://localhost:3000`
3. Нажми Enter
4. **ДОЛЖНО ПОЯВИТЬСЯ ВСПЛЫВАЮЩЕЕ ОКНО С ПОЛИТИКОЙ!**
5. Прочитай (или пролистай) и нажми "Accept & Continue"
6. Попадешь на страницу входа!

**Теперь:**
- Нажми "Sign up"
- Зарегистрируй тестовую компанию
- Загрузи фото счета за электричество
- Посмотри результаты!

---

## 🌐 ВАРИАНТ 2: ДЕПЛОЙ В ИНТЕРНЕТ (получить ссылку)

Чтобы получить настоящую ссылку типа `carbontracker.com`, нужно:

### Шаг 1: Деплой Frontend на Vercel (бесплатно)

1. Зарегистрируйся на https://vercel.com/ (можно через GitHub)
2. Нажми "Add New" → "Project"
3. Импортируй свой проект (загрузи на GitHub сначала)
4. Root Directory: `frontend`
5. Framework Preset: Vite
6. Build Command: `npm run build`
7. Output Directory: `dist`
8. Нажми "Deploy"
9. Подожди 2-3 минуты
10. Получишь ссылку типа `https://carbon-tracker-123.vercel.app`

### Шаг 2: Деплой Backend на Railway

1. Зарегистрируйся на https://railway.app/
2. New Project → Deploy from GitHub
3. Выбери папку `backend`
4. Railway автоматически определит Node.js
5. Добавь Environment Variables:
   - `DATABASE_URL` - от Supabase
   - `OPENAI_API_KEY` - от OpenAI
   - `JWT_SECRET` - любая длинная строка
   - `ALLOWED_ORIGINS` - ссылка от Vercel
6. Deploy!
7. Получишь ссылку типа `https://carbon-backend.railway.app`

### Шаг 3: Свой домен (опционально)

1. Купи домен на Namecheap/GoDaddy (например `carbontracker.ai`)
2. В Vercel: Settings → Domains → Add domain
3. Следуй инструкциям по настройке DNS
4. Готово! Теперь сайт на `https://carbontracker.ai`

**Стоимость:**
- Vercel: бесплатно (hobby plan)
- Railway: $5-10/месяц
- Домен: $10-15/год

---

## 💬 ЧТО ДАЛЬШЕ?

После локального запуска:

1. **Протестируй** - загрузи несколько счетов
2. **Проверь** - точность AI парсинга
3. **Добавь Stripe** - я могу помочь с кодом
4. **Задеплой** - на Vercel + Railway
5. **Маркетинг** - запускай рекламу!

---

## ❌ ЧАСТЫЕ ПРОБЛЕМЫ

### "npm not found"
→ Не установлен Node.js или не перезагрузил ПК

### "Cannot connect to database"
→ Неправильный DATABASE_URL в .env

### "OpenAI error 401"
→ Неправильный API key или нет денег на балансе

### "Port 5000 already in use"
→ Измени PORT в backend/.env на 5001

### Всплывающее окно не появляется
→ Очисти cookies браузера (Ctrl+Shift+Delete)

---

## 📞 ИТОГО:

**Я СДЕЛАЛ:**
✅ Весь код (backend + frontend)
✅ Privacy Policy с всплывающим окном
✅ Terms of Service
✅ Защиту от ответственности
✅ Инструкции по запуску

**ТЫ ДЕЛАЕШЬ:**
⏳ Установить Node.js (10 мин)
⏳ Получить API ключи (25 мин)
⏳ Настроить .env (5 мин)
⏳ Запустить (2 мин)

**ВСЕГО: 45 минут до первого запуска!**

---

**Все готово! Начинай с Шага 1.** 🚀

Если что-то не понятно - спрашивай!
