# ❓ FAQ - Часто задаваемые вопросы

## 🚀 УСТАНОВКА И ЗАПУСК

### Q: Нужно ли что-то устанавливать?
**A:** Да, только Node.js. Скачайте с https://nodejs.org/ (LTS версия)

### Q: Сколько стоят API ключи?
**A:** 
- OpenAI: ~$0.01-0.03 за обработку одного счета. $5-10 хватит на 200-500 счетов
- Supabase: Бесплатно до 500MB БД и 2GB transfer
- Итого: ~$5-10 для старта

### Q: Можно ли использовать без OpenAI?
**A:** Нет, OpenAI критичен для AI парсинга счетов. Но можно попробовать бесплатные $5 credit для новых пользователей.

### Q: Что если у меня нет PostgreSQL?
**A:** Используйте Supabase (бесплатно). Это PostgreSQL в облаке, настраивается за 5 минут.

---

## 💻 ТЕХНИЧЕСКИЕ ВОПРОСЫ

### Q: Какие операционные системы поддерживаются?
**A:** Windows, macOS, Linux. Проект кроссплатформенный (Node.js).

### Q: Нужен ли Docker?
**A:** Нет, не обязательно для разработки. Для продакшн деплоя - опционально.

### Q: Можно ли запустить только frontend без backend?
**A:** Нет, frontend зависит от backend API. Нужны оба.

### Q: Почему два терминала?
**A:** Один для backend сервера (порт 5000), второй для frontend dev server (порт 3000).

### Q: Можно ли изменить порты?
**A:** Да:
- Backend: измените `PORT` в `backend/.env`
- Frontend: измените `server.port` в `frontend/vite.config.ts`

---

## 🤖 AI И ПАРСИНГ

### Q: Какие типы счетов поддерживаются?
**A:** 
- Электричество (electricity bills)
- Природный газ (natural gas)
- Бензин/дизель (fuel receipts)
- Поставки (supply chain)
- PDF и изображения (JPG, PNG)

### Q: Насколько точен AI парсинг?
**A:** GPT-4 Vision дает ~85-95% точность на четких счетах. Важно:
- Хорошее освещение фото
- Весь текст виден
- Не размыто

### Q: Что если AI неправильно распознал данные?
**A:** В будущих версиях будет ручная корректировка. Сейчас - переделайте фото или PDF.

### Q: Поддерживаются ли счета не на английском?
**A:** GPT-4 понимает многие языки, но emission factors настроены для США. Для других стран нужно обновить коэффициенты.

---

## 📊 РАСЧЕТЫ ВЫБРОСОВ

### Q: Откуда emission factors?
**A:** 
- EPA (Environmental Protection Agency) США
- IPCC Guidelines
- US EIA (Energy Information Administration)
- Средние значения для US grid mix

### Q: Можно ли изменить emission factors?
**A:** Да, в файле `backend/src/services/carbon.service.ts` в объекте `EMISSION_FACTORS`

### Q: Что такое Scope 1, 2, 3?
**A:** 
- **Scope 1:** Прямые выбросы (ваши машины, газ)
- **Scope 2:** Косвенные от электричества
- **Scope 3:** Цепочка поставок, командировки

### Q: Почему CO2e, а не просто CO2?
**A:** CO2e (эквивалент) учитывает также CH4 и N2O, которые вреднее CO2 (CH4 в 25 раз, N2O в 298 раз)

---

## 💰 МОНЕТИЗАЦИЯ

### Q: Как подключить оплату?
**A:** Интеграция Stripe (не реализовано в MVP). Нужно:
1. Создать Stripe аккаунт
2. Добавить Stripe SDK
3. Создать subscription products
4. Webhook для управления подписками

### Q: Какая цена рекомендуется?
**A:** $150-200/год для малого бизнеса. Конкуренты берут $1000+, так что это конкурентная цена.

### Q: Нужна ли бизнес-лицензия?
**A:** Для продажи SaaS в США желательно зарегистрировать LLC. Проконсультируйтесь с юристом.

---

## 🛡️ БЕЗОПАСНОСТЬ

### Q: Безопасны ли пароли?
**A:** Да, используется bcrypt с 10 раундами хеширования. Пароли не хранятся в открытом виде.

### Q: Что с данными пользователей?
**A:** Хранятся в PostgreSQL. Важно:
- Использовать SSL для production БД
- Регулярные бэкапы
- Соблюдать GDPR/CCPA если есть EU/CA пользователи

### Q: Безопасна ли загрузка файлов?
**A:** Да:
- Валидация типов файлов
- Ограничение размера (10MB)
- Файлы не доступны публично
- Только аутентифицированные пользователи

---

## 🌐 ДЕПЛОЙ

### Q: Где хостить production?
**A:** Рекомендуется:
- Frontend: Vercel (бесплатно для hobby projects)
- Backend: Railway ($5-10/мес)
- База: Supabase (бесплатно до лимитов)

### Q: Сколько стоит хостинг?
**A:** 
- Начало: $0-5/мес (бесплатные тиры)
- С ростом: $20-50/мес (Railway + Supabase paid plans)
- При масштабе: $100-500/мес

### Q: Как сделать production build?
**A:** 
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Деплой dist/ на Vercel
```

---

## 📝 LEGAL

### Q: Нужна ли Privacy Policy?
**A:** Да, обязательно для сбора email и данных. Особенно для CCPA (California), GDPR (Europe).

### Q: Где взять шаблон Privacy Policy?
**A:** 
- https://www.termsfeed.com/
- https://www.privacypolicies.com/
- Или hire юриста для кастомной версии

### Q: Что указать в Terms of Service?
**A:** 
- Ограничение ответственности за точность расчетов
- Политика возвратов
- Права на интеллектуальную собственность
- Юрисдикция (какой штат/страна)

---

## 🐛 ПРОБЛЕМЫ И РЕШЕНИЯ

### Q: "npm install" падает с ошибкой
**A:** 
```bash
# Очистите кэш
npm cache clean --force
# Удалите node_modules и package-lock.json
rm -rf node_modules package-lock.json
# Переустановите
npm install
```

### Q: "Cannot find module 'typescript'"
**A:** Установите TypeScript глобально:
```bash
npm install -g typescript ts-node
```

### Q: Frontend не подключается к backend
**A:** Проверьте:
1. Backend запущен на порту 5000?
2. Vite proxy настроен в `vite.config.ts`?
3. CORS разрешен в backend для `http://localhost:3000`?

### Q: "Database connection failed"
**A:** 
1. Проверьте `DATABASE_URL` в `.env`
2. PostgreSQL запущен? (или Supabase проект активен?)
3. Правильный формат: `postgresql://user:password@host:5432/dbname`

### Q: OpenAI возвращает ошибку 401
**A:** 
1. Проверьте `OPENAI_API_KEY` в `.env`
2. Ключ начинается с `sk-`?
3. Есть ли деньги на балансе OpenAI?

---

## 📈 МАСШТАБИРОВАНИЕ

### Q: Сколько пользователей выдержит?
**A:** MVP setup:
- 10-100 пользователей: ✅ без проблем
- 100-1000: нужен paid plan Railway/Supabase
- 1000+: нужен proper production setup (load balancing, CDN)

### Q: Что делать при росте?
**A:** 
1. Перейти на paid DB plan (Supabase Pro)
2. Добавить Redis для кэширования
3. CDN для статики (Cloudflare)
4. Horizontal scaling backend (multiple instances)
5. Очередь для AI парсинга (Bull/Redis)

---

## 🎯 СЛЕДУЮЩИЕ ФИЧИ

### Q: Что добавить в будущем?
**A:** 
- ✅ Email notifications
- ✅ PDF export отчетов
- ✅ API для интеграций
- ✅ Mobile app (React Native)
- ✅ Team accounts (несколько пользователей)
- ✅ Advanced analytics (trends, predictions)
- ✅ Offsetting programs (покупка carbon credits)

### Q: Сколько времени на новые фичи?
**A:** 
- Email notifications: 1-2 дня
- PDF export: 2-3 дня
- Mobile app: 2-3 недели
- Team accounts: 1 неделя
- Advanced analytics: 1-2 недели

---

## 💬 ПОДДЕРЖКА

### Q: Где получить помощь?
**A:** 
1. Прочитайте документацию (START_HERE.md, SETUP.md)
2. Проверьте CHECKLIST.md
3. Опишите проблему - я помогу!

### Q: Можно ли нанять разработчика?
**A:** Да, для дополнительных фич или кастомизации можно найти freelancer на:
- Upwork
- Fiverr
- Toptal

---

**Не нашли ответ? Задайте вопрос!** 💬
