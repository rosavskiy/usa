# 🌱 Carbon Tracker - Полное описание продукта для инвесторов

## 📋 Содержание

1. [Executive Summary](#executive-summary)
2. [Подробное описание проблемы](#подробное-описание-проблемы)
3. [Продукт и технология](#продукт-и-технология)
4. [Функциональные возможности](#функциональные-возможности)
5. [Технический стек](#технический-стек)
6. [Рыночный анализ](#рыночный-анализ)
7. [Бизнес-модель](#бизнес-модель)
8. [Go-to-Market стратегия](#go-to-market-стратегия)
9. [Конкурентный анализ](#конкурентный-анализ)
10. [Финансовые проекции](#финансовые-проекции)
11. [Риски и митигация](#риски-и-митигация)
12. [Roadmap развития](#roadmap-развития)

---

## Executive Summary

### Обзор компании

**Carbon Tracker** - B2B SaaS платформа, использующая искусственный интеллект для автоматизации расчета и отчетности углеродного следа малого и среднего бизнеса в США.

### Ключевая ценность

Мы превращаем процесс carbon accounting, который обычно требует десятки часов ручной работы или тысячи долларов на консультантов, в простую 5-минутную процедуру загрузки счетов.

### Целевой рынок

- **Primary:** 6.1 миллионов малых компаний США (10-50 сотрудников)
- **Secondary:** 1.2 миллионов средних компаний (50-250 сотрудников)
- **TAM:** $3.6 миллиардов годового рынка

### Бизнес-модель

Подписка **$150-200/год** с маржинальностью **87%** и payback периодом **3 месяца**.

### Текущий статус

MVP готов на **95%**. Полностью функциональная платформа с AI-парсингом, калькулятором выбросов и автоматической генерацией GHG Protocol отчетов.

### Запрос финансирования

**$150,000 pre-seed** раунд для масштабирования команды, маркетинга и деплоя.

---

## Подробное описание проблемы

### Регуляторный контекст

**Новые требования SEC (2024):**

- Публичные компании США обязаны раскрывать climate-related риски
- Scope 1 и Scope 2 emissions - обязательные с 2025
- Scope 3 (цепочка поставок) - с 2026

**Эффект домино на малый бизнес:**

- Крупные компании требуют carbon reporting от всех поставщиков
- 85% малых компаний будут вынуждены отчитываться к 2027
- Нет доступных решений для этого сегмента

### Боли текущего процесса

**Для компаний без автоматизации:**

1. **Ручной сбор данных (15-20 часов):**
   - Собирать все счета за электричество, газ, топливо
   - Искать данные о поставках, командировках
   - Конвертировать разные единицы измерения

2. **Расчеты (10-15 часов):**
   - Находить правильные emission factors (EPA, IPCC)
   - Учитывать региональные различия (grid mix по штатам)
   - Вычислять CO2e для каждой категории
   - Суммировать по Scope 1, 2, 3

3. **Подготовка отчетов (15-25 часов):**
   - Формат GHG Protocol
   - Таблицы, графики
   - Верификация данных

**Итого: 40-80 часов работы + риск ошибок**

**Альтернатива - консультанты:**

- Стоимость: $5,000-15,000 в год
- Долго: 2-3 месяца на первый отчет
- Не масштабируемо для малого бизнеса

**Существующие SaaS:**

- Enterprise focus: Watershed, Persefoni ($500-2000/месяц)
- Сложный onboarding (недели настройки)
- Требуют IT интеграций
- Слишком дорого для малого бизнеса

### Размер проблемы

- **6.1M** малых компаний в США нужна отчетность
- **$5,000-15,000** средние затраты в год на ручную работу/консультантов
- **$30-90 миллиардов** общий рынок pain point

---

## Продукт и технология

### Концепция

**"Загрузи счет → Получи отчет"**

Минимум взаимодействия пользователя, максимум автоматизации через AI.

### Архитектура решения

```
ПОЛЬЗОВАТЕЛЬ
    ↓
[1] UPLOAD LAYER
    → Drag & drop интерфейс
    → Валидация файлов (PDF/JPG/PNG, до 10MB)
    → Secure storage (AWS S3 или локально)
    ↓
[2] AI PARSING LAYER
    → OpenAI GPT-4 Vision API
    → Извлечение структурированных данных:
        • Тип счета (electricity, gas, fuel)
        • Провайдер (ConEd, PG&E, etc)
        • Потребление (значение + единица)
        • Период (даты начала/конца)
        • Адрес (для определения штата)
    ↓
[3] CALCULATION ENGINE
    → Определение Scope (1, 2, или 3)
    → Выбор emission factors:
        • EPA eGRID 2023 (электричество по штатам)
        • IPCC Guidelines (газ, топливо)
        • Региональные коэффициенты
    → Расчет выбросов:
        • CO2 (основной парниковый газ)
        • CH4 (метан, × 25 GWP)
        • N2O (закись азота, × 298 GWP)
        • F-gases (HFCs, PFCs, SF6)
    → Total CO2e (эквивалент в CO2)
    ↓
[4] DATABASE LAYER
    → PostgreSQL
    → Сохранение:
        • Все расчеты
        • История изменений
        • Метаданные документов
    ↓
[5] REPORTING LAYER
    → GHG Protocol Standard отчеты
    → PDF генерация (годовые отчеты)
    → Excel экспорты
    → Визуализация (графики, тренды)
    ↓
ПОЛЬЗОВАТЕЛЬ (Dashboard)
```

### Уникальность технологии

**1. AI-First подход:**

- Не OCR (которому нужен четкий текст), а Vision AI (понимает контекст)
- GPT-4 Vision распознает даже плохо отсканированные документы
- Извлекает не только цифры, но и понимает структуру

**2. Smart Emission Factor Selection:**

- Автоматическое определение штата из адреса в счете
- Использование региональных grid mix данных (CA ≠ WV по выбросам)
- Периодическое обновление factors (EPA обновляет ежегодно)

**3. Compliance-Ready:**

- Отчеты соответствуют GHG Protocol Corporate Standard
- Готовы для SEC, EPA отчетности
- Audit trail (полная история расчетов)

---

## Функциональные возможности

### Модуль 1: Аутентификация и профиль

**Функции:**

- Регистрация компании (email, пароль, название компании)
- Вход с JWT токенами (7-дневная сессия)
- Профиль компании:
  - Штат (для emission factors)
  - Индустрия (для бенчмаркинга)
  - Система измерения (Imperial/Metric)
  - Валюта (USD/EUR/GBP)

**Безопасность:**

- Bcrypt хеширование паролей
- JWT refresh tokens
- Rate limiting на API
- HTTPS обязательный

### Модуль 2: Загрузка документов

**Поддерживаемые форматы:**

- PDF (счета, отчеты)
- JPG, PNG (фото счетов с телефона)
- Размер до 10MB

**Интерфейс:**

- Drag & drop зона
- Превью загруженных файлов
- Batch upload (несколько файлов сразу)
- Статус обработки (pending → processing → completed/failed)

**Типы документов:**

- Electricity bills (счета за электричество)
- Natural gas bills (газ)
- Fuel receipts (топливо - бензин, дизель)
- Office supplies (Scope 3 - бумага, оборудование)
- Travel receipts (командировки)

### Модуль 3: AI Парсинг

**Процесс:**

1. **Предобработка:**
   - Конвертация в base64
   - Сжатие для API (оптимизация стоимости)

2. **AI анализ:**
   - GPT-4 Vision получает промпт:
     ```
     Extract utility bill data as JSON:
     - type (electricity/gas/fuel)
     - provider (company name)
     - consumption (value + unit)
     - period (start/end dates)
     - state (from service address)
     ```

3. **Валидация:**
   - Проверка структуры JSON
   - Валидация значений (consumption > 0)
   - Проверка дат (period_end > period_start)

4. **Результат:**
   ```json
   {
     "type": "electricity",
     "provider": "ConEdison",
     "consumption": { "value": 500, "unit": "kWh" },
     "period": { "start": "2024-01-01", "end": "2024-01-31" },
     "state": "NY",
     "address": "123 Main St, New York, NY 10001"
   }
   ```

**Точность:**

- 85-95% на качественных сканах
- 70-80% на фото с телефона
- Fallback: пользователь может редактировать результат (в roadmap)

### Модуль 4: Калькулятор выбросов

**Emission Factors Database:**

**Электричество (по штатам):**

```
CA: 0.20 kg CO2e/kWh (много renewable)
NY: 0.18 kg CO2e/kWh (hydro + nuclear)
TX: 0.39 kg CO2e/kWh (gas + coal)
WV: 0.72 kg CO2e/kWh (в основном coal)
US Average: 0.385 kg CO2e/kWh
```

**Природный газ:**

```
1.89 kg CO2e per m³
5.3 kg CO2e per therm
53.06 kg CO2e per MMBtu
```

**Топливо:**

```
Gasoline: 8.89 kg CO2e per gallon
Diesel: 10.21 kg CO2e per gallon
Jet fuel: 9.57 kg CO2e per gallon
```

**Расчет:**

```
Total CO2e = CO2 + (CH4 × 25) + (N2O × 298) + F-gases
```

**Scope классификация:**

- **Scope 1:** Прямые выбросы (газ, топливо в собственных машинах)
- **Scope 2:** Косвенные (электричество из grid)
- **Scope 3:** Цепочка поставок (поставки, командировки)

**Периоды отчетности:**

- Создание 12-месячных reporting periods (GHG Protocol стандарт)
- Привязка расчетов к периодам
- Возможность multiple periods (для ретроспективы)

### Модуль 5: Dashboard и Analytics

**Визуализации:**

1. **Главная панель:**
   - Total emissions (kg CO2e)
   - Breakdown по Scope (1, 2, 3)
   - Trend по месяцам
   - Топ категории выбросов

2. **Графики:**
   - Pie chart: распределение по категориям
   - Bar chart: выбросы по месяцам
   - Line chart: тренд за год
   - Stacked bar: Scope 1/2/3 breakdown

3. **Таблицы:**
   - История всех расчетов
   - Детали каждого документа
   - Сортировка, фильтры

**Метрики:**

- Total emissions (year-to-date)
- Average emissions per month
- Emissions per employee (если указано)
- Сравнение с прошлым годом

### Модуль 6: Рекомендации

**Автоматическая генерация:**

Система анализирует расчеты и дает рекомендации:

**Категория: Электричество (если > 100 kg CO2e)**

```
✅ Switch to LED lighting
   Potential reduction: 15-20%
   Priority: High

✅ Optimize HVAC schedule
   Potential reduction: 10-15%
   Priority: Medium

✅ Consider renewable energy plan
   Potential reduction: 50-100%
   Priority: Low (зависит от провайдера)
```

**Категория: Топливо (если > 50 kg CO2e)**

```
✅ Fleet optimization routes
   Potential reduction: 10-20%
   Priority: High

✅ Transition to hybrid vehicles
   Potential reduction: 30-40%
   Priority: Medium
```

**Категория: Газ (если > 50 kg CO2e)**

```
✅ Improve building insulation
   Potential reduction: 15-25%
   Priority: High
```

**Приоритизация:**

- High: быстрая окупаемость (< 2 года)
- Medium: средняя окупаемость (2-5 лет)
- Low: долгосрочные инвестиции (> 5 лет)

### Модуль 7: Годовые отчеты (GHG Protocol)

**Автоматическая генерация PDF:**

**Структура отчета:**

1. **Title Page:**
   - Название компании
   - Год отчетности
   - Дата подготовки
   - GHG Protocol compliance statement

2. **Executive Summary:**
   - Total emissions
   - Key highlights
   - Year-over-year comparison

3. **Organizational Boundary:**
   - Company info
   - Reporting period
   - Consolidation approach (Operational Control)

4. **Emissions by Scope:**
   - Scope 1 details (gas, fuel)
   - Scope 2 details (electricity)
   - Scope 3 details (если есть)
   - Breakdown tables

5. **Emissions by Category:**
   - Electricity
   - Natural gas
   - Transportation
   - Supplies
   - Tables + charts

6. **Monthly Trends:**
   - Month-by-month breakdown
   - Seasonal patterns
   - Line charts

7. **Methodology:**
   - Emission factors used
   - Data sources (EPA, IPCC)
   - Calculation methods
   - Assumptions and limitations

8. **Data Quality:**
   - Completeness statement
   - Uncertainty assessment
   - Verification status

9. **Recommendations:**
   - Top reduction opportunities
   - Implementation timeline
   - Expected ROI

10. **Appendices:**
    - Detailed calculations
    - Emission factors reference
    - GHG Protocol compliance checklist

**Export форматы:**

- PDF (professional report)
- Excel (raw data для анализа)
- CSV (для интеграций)

### Модуль 8: Admin Panel

**Функции для админов:**

- Управление пользователями
- Просмотр всех расчетов (aggregated)
- Credits система (для монетизации)
- Статистика использования
- Логи ошибок

**Credits система:**

- Каждый расчет стоит 1 credit
- Подписка дает X credits в месяц
- Pay-as-you-go для дополнительных

---

## Технический стек

### Frontend

**Core:**

- **React 18** - современный UI library
- **TypeScript** - type safety, меньше багов
- **Vite** - быстрый bundler (в 10x быстрее webpack)

**UI Framework:**

- **Tailwind CSS** - utility-first, быстрая разработка
- **Lucide React** - современные SVG иконки
- **React Dropzone** - drag & drop файлов

**Data Visualization:**

- **Recharts** - React charts library
  - Pie charts (breakdown по категориям)
  - Bar charts (месячные данные)
  - Line charts (тренды)
  - Responsive design

**State Management:**

- React Context API (auth state)
- Local state (useState, useEffect)
- (В roadmap: Redux Toolkit для complex state)

**Routing:**

- **React Router v6** - SPA navigation
- Protected routes (auth required)
- Nested layouts

**API Client:**

- **Axios** - HTTP requests
- Interceptors (auto JWT tokens)
- Error handling

### Backend

**Core:**

- **Node.js 20** - runtime
- **Express.js** - web framework
- **TypeScript** - type safety

**Database:**

- **PostgreSQL 15** - relational DB
  - JSON support (JSONB для parsed_data)
  - Full-text search
  - Transactional guarantees
- **pg** - Node.js PostgreSQL driver

**Authentication:**

- **JWT (jsonwebtoken)** - stateless auth
- **bcryptjs** - password hashing (10 rounds)
- **Passport.js** - OAuth готовность (Google, Microsoft)

**File Upload:**

- **Multer** - multipart/form-data
- Local storage или S3 (configurable)
- Размер лимиты, mime type validation

**AI Integration:**

- **OpenAI SDK** - GPT-4 Vision API
- Retry logic (exponential backoff)
- Cost optimization (image compression)

**PDF Generation:**

- **PDFKit** - native Node.js PDF
- Charts, tables, images
- Professional formatting

**Security:**

- **Helmet** - HTTP headers security
- **CORS** - cross-origin control
- **express-rate-limit** - API rate limiting
- Input validation (**Zod** schemas)

**Monitoring:**

- Structured logging (console.log → Winston в roadmap)
- Error tracking (Sentry в roadmap)

### Infrastructure

**Development:**

- Local PostgreSQL или Supabase
- nodemon (auto-reload backend)
- Vite dev server (HMR)

**Production:**

- **Frontend:** Vercel
  - CDN edge locations
  - Automatic HTTPS
  - Preview deployments
  - $0 для старта
- **Backend:** Railway или Render
  - Container deployment
  - Auto-scaling
  - PostgreSQL addon
  - ~$20-50/месяц
- **Database:** Supabase
  - Managed PostgreSQL
  - Automatic backups
  - Connection pooling
  - Free tier: 500MB

**Storage:**

- AWS S3 (uploads)
- CloudFront CDN (optional)

**CI/CD:**

- GitHub Actions
- Automatic tests
- Deployment на main branch

### Scalability

**Current capacity (single server):**

- 1000+ concurrent users
- 10,000+ requests/min
- 100GB+ data

**Scaling план:**

- Horizontal scaling (load balancer)
- Database read replicas
- Redis caching (расчеты)
- Queue system (Bull для async AI parsing)

### Security

**Data Protection:**

- Encryption at rest (S3, PostgreSQL)
- Encryption in transit (TLS 1.3)
- PII handling (GDPR, CCPA ready)

**Authentication:**

- Password policy (min 8 chars)
- JWT expiration (7 days)
- Refresh tokens (30 days)
- Failed login attempts tracking

**API Security:**

- Rate limiting (100 req/15min per IP)
- CORS whitelist
- Input sanitization
- SQL injection protection (parameterized queries)

---

## Рыночный анализ

### Target Market Sizing

**TAM (Total Addressable Market):**

- 6.1M малых компаний в США (10-50 сотрудников)
- Average price: $600/год
- **TAM = $3.66 миллиардов/год**

**SAM (Serviceable Addressable Market):**

- Компании в секторах с high emissions:
  - Manufacturing (600K компаний)
  - Retail (1.2M компаний)
  - Services (800K компаний)
  - Hospitality (400K компаний)
- **SAM = $1.8 миллиардов/год**

**SOM (Serviceable Obtainable Market):**

- 1% market share за 3 года
- 30,000 платных клиентов
- **SOM = $18 миллионов ARR**

### Market Drivers

**1. Регуляторные требования:**

- SEC Climate Disclosure (2024-2026)
- EPA Greenhouse Gas Reporting
- State-level regulations (CA, NY, MA)
- Corporate Sustainability Reporting Directive (CSRD) - EU, но влияет на US компании

**2. Corporate Pressure:**

- 90% Fortune 500 требуют Scope 3 отчетность от поставщиков
- Walmart, Amazon, Apple - обязательные carbon reports
- Контракты зависят от ESG compliance

**3. Financial Incentives:**

- ESG-linked financing (lower interest rates)
- Carbon credits trading
- Tax incentives для green businesses
- Investor pressure (BlackRock, Vanguard ESG funds)

**4. Consumer Demand:**

- 73% millennials готовы платить больше за sustainable products
- B2B clients выбирают green поставщиков
- Brand reputation risks

### Market Trends

**2024-2026:**

- Обязательная отчетность для 85% компаний
- Рост на 40% year-over-year (carbon accounting software market)

**2026-2030:**

- Carbon tax введение (вероятность 60%)
- Real-time emissions monitoring
- AI-driven sustainability optimization

### Competitive Landscape

**Category 1: Enterprise Solutions**

- **Watershed** ($500-2000/мес)
  - Pros: Comprehensive, integrations
  - Cons: Слишком дорого и сложно для малого бизнеса
- **Persefoni** ($1000+/мес)
  - Pros: Financial-grade accuracy
  - Cons: Enterprise-only, долгий onboarding

**Category 2: Spreadsheet Templates**

- Free или $50-100 one-time
- Pros: Cheap
- Cons: Полностью ручная работа, ошибки, не scalable

**Category 3: Consultants**

- $5,000-15,000/год
- Pros: Expert guidance
- Cons: Expensive, slow, не recurring service

**Our Position:**

- **Pricing:** $150-200/год (10x дешевле конкурентов)
- **Ease of use:** 5 минут vs 40 часов
- **AI automation:** Единственные с GPT-4 Vision
- **Target:** Малый бизнес (недооцененный сегмент)

---

## Бизнес-модель

### Pricing Strategy

**Модель:** Pay-per-use кредитная система

**1 кредит = 1 обработка счета:**

- AI парсинг документа (PDF/фото)
- Автоматический расчет выбросов
- Добавление в dashboard
- Включение в годовые отчеты

**Тарифные пакеты:**

**Free Trial**

- 5 кредитов бесплатно
- Полный функционал
- Тестирование платформы

**Starter** - $149

- 10 кредитов ($14.90/кредит)
- Dashboard и analytics
- 1 годовой GHG отчет
- Email support
- Для компаний с 8-12 счетами/год

**Business** - $699

- 50 кредитов ($13.98/кредит)
- Экономия 6% vs Starter
- Multiple reporting periods
- Unlimited GHG отчеты
- Recommendations engine
- Priority support
- Для компаний с 40-60 счетами/год

**Enterprise** - $1,929

- 150 кредитов ($12.86/кредит)
- Экономия 14% vs Starter
- API access
- Custom emission factors
- Dedicated support manager
- Audit trail для compliance
- Multi-location support
- Для компаний с 120-180 счетами/год

**Custom Enterprise** (Индивидуально)

- 500+ кредитов
- White-label опция
- On-premise deployment
- SLA guarantees
- Volume discounts до 20%

### Revenue Projections

**Year 1:**

- 1,000 customers
- Mix: 60% Starter ($149), 30% Business ($699), 10% Enterprise ($1,929)
- Average revenue: $427/customer
- Repeat purchases: 1.8x/год (клиенты докупают кредиты)
- **ARR: $769,000**

**Year 2:**

- 5,000 customers
- Mix улучшается: 40% Starter, 40% Business, 20% Enterprise
- Average revenue: $782/customer
- Repeat: 2.2x/год
- **ARR: $4.3M**

**Year 3:**

- 15,000 customers
- Mix: 30% Starter, 45% Business, 25% Enterprise
- Average revenue: $889/customer
- Repeat: 2.5x/год
- **ARR: $13.3M**

### Unit Economics

**Customer Acquisition Cost (CAC):**

- Google Ads: $30-40 per signup
- Conversion rate: 65% (free trial → первая покупка)
- **CAC = $50**

**Lifetime Value (LTV):**

- ARPU: $427-889/год (в зависимости от tier)
- Average: $650/год
- Repeat purchases: 2x/год
- Churn rate: 12% (годовой)
- Lifetime: ~6 лет
- **LTV = $3,900**

**LTV/CAC = 78x** (исключительно, target > 3x)

**Payback Period:** 1-2 месяца

**Margins:**

- COGS per credit: $2 (OpenAI API ~$1.50, infrastructure $0.50)
- Average кредитов/customer/год: 50
- COGS per customer: $100/год
- Gross margin: **85%**
- Operating margin (с учетом R&D, marketing): **65%** (через 2 года)

---

## Go-to-Market стратегия

### Phase 1: Beta Launch (Месяцы 1-3)

**Goal:** 50 beta customers

**Tactics:**

1. **Direct Outreach:**
   - LinkedIn outreach к small business owners
   - Local business associations
   - Free first year для feedback

2. **Content Marketing:**
   - Blog: "How to calculate carbon footprint"
   - SEO для "carbon accounting small business"
   - YouTube tutorials

3. **Product Hunt launch:**
   - Top 5 product of the day (goal)
   - Press coverage

### Phase 2: Paid Growth (Месяцы 4-12)

**Goal:** 1,000 paying customers

**Channels:**

1. **Google Ads:**
   - Keywords: "carbon accounting software", "ghg protocol calculator"
   - Budget: $5,000/месяц
   - Expected: 150 signups/месяц

2. **LinkedIn Ads:**
   - Target: small business owners, sustainability managers
   - Budget: $3,000/месяц
   - Expected: 80 signups/месяц

3. **SEO & Content:**
   - 2 blog posts/неделя
   - Keyword clustering (carbon, sustainability, compliance)
   - Backlink building
   - Expected: 100 organic signups/месяц

4. **Partnerships:**
   - Accounting firms (referral program 20%)
   - Business consultants
   - Industry associations

### Phase 3: Scale (Год 2)

**Goal:** 5,000 customers

**New Channels:**

1. **Integrations:**
   - QuickBooks app marketplace
   - Xero integration
   - Gusto (payroll → employee commute emissions)

2. **Affiliate Program:**
   - 30% recurring commission
   - Target: sustainability bloggers, consultants

3. **Webinars:**
   - Monthly "Carbon Accounting 101"
   - Partnerships с industry experts

4. **PR:**
   - TechCrunch, VentureBeat coverage
   - Sustainability publications
   - Small business media

### Customer Success

**Onboarding:**

- 5-minute interactive tutorial
- Sample bill для теста
- Welcome email sequence (7 emails)

**Retention:**

- Quarterly impact reports ("You've calculated X tons!")
- Monthly tips для reduction
- Annual review call (Business tier)

**Expansion:**

- In-app upsell prompts (расчеты close to limit)
- Feature announcements (new capabilities)

---

## Конкурентный анализ

### Competitive Matrix

| Feature          | Carbon Tracker  | Watershed     | Persefoni     | Spreadsheets | Consultants      |
| ---------------- | --------------- | ------------- | ------------- | ------------ | ---------------- |
| **Цена (год)**   | $149-1,929      | $6K-24K       | $12K+         | $0-100       | $5K-15K          |
| **Setup time**   | 5 мин           | 2-4 недели    | 4-8 недель    | 1 час        | 2-3 месяца       |
| **AI парсинг**   | ✅ GPT-4 Vision | ❌ Manual     | ❌ Manual     | ❌ Manual    | ❌ Manual        |
| **Малый бизнес** | ✅ Designed for | ❌ Enterprise | ❌ Enterprise | ✅ DIY       | ❌ Too expensive |
| **GHG Protocol** | ✅ Automatic    | ✅ Yes        | ✅ Yes        | ⚠️ Template  | ✅ Yes           |
| **Scope 1/2/3**  | ✅ All          | ✅ All        | ✅ All        | ✅ Manual    | ✅ All           |
| **Support**      | Email           | Dedicated     | Dedicated     | None         | Included         |
| **API**          | ✅ Roadmap      | ✅ Yes        | ✅ Yes        | ❌ No        | ❌ No            |

### Competitive Advantages

**1. AI-First:**

- Единственное решение с GPT-4 Vision парсингом
- 40x faster чем ручной ввод
- Continuously improving (модель обучается)

**2. Price Point:**

- 10-100x дешевле enterprise solutions
- Accessible для малого бизнеса
- Annual vs monthly billing (lower churn)

**3. Simplicity:**

- No IT integration required
- No training needed
- Instant value (first report за 5 минут)

**4. Compliance-Ready:**

- GHG Protocol стандарт из коробки
- SEC-ready отчеты
- Audit trail

### Barriers to Entry

**For us (to defend):**

1. **Data moat:**
   - Thousands of parsed bills → fine-tuned model
   - Proprietary emission factors database
   - Regional variations knowledge

2. **Regulatory expertise:**
   - Deep GHG Protocol understanding
   - Compliance templates
   - Partnerships с auditors

3. **Brand & Trust:**
   - First-mover в AI carbon accounting
   - Customer testimonials
   - Case studies

4. **Integrations:**
   - API ecosystem (QuickBooks, Xero, etc)
   - Lock-in effect

**For competitors (to enter our market):**

1. **AI expertise:**
   - GPT-4 Vision integration non-trivial
   - Prompt engineering для accuracy
   - Cost optimization

2. **Price point:**
   - Enterprise players не могут снизить до $150 (канибализация)
   - Consultants не scalable для SaaS

3. **Market focus:**
   - Малый бизнес - сложный сегмент (high CAC, low ARPU traditionally)
   - Мы решили через AI automation (low COGS)

---

## Финансовые проекции

### Revenue Forecast (3 года)

| Метрика           | Year 1 | Year 2 | Year 3 |
| ----------------- | ------ | ------ | ------ |
| **Customers**     | 1,000  | 5,000  | 15,000 |
| **ARPU**          | $250   | $280   | $300   |
| **ARR**           | $250K  | $1.4M  | $4.5M  |
| **MRR (год end)** | $25K   | $140K  | $450K  |
| **Growth rate**   | -      | 460%   | 221%   |

### Expense Forecast

**Year 1 ($150K budget):**

- Engineering: $60K (2 разработчика part-time)
- Marketing: $40K (Google Ads, content)
- Operations: $30K (infrastructure, legal, accounting)
- Reserves: $20K

**Year 2 (при $250K revenue):**

- Team: $150K (3 full-time: CTO, Marketing, Support)
- Marketing: $80K
- Operations: $50K
- **Burn: -$30K** (почти breakeven)

**Year 3 (при $1.4M revenue):**

- Team: $400K (8 человек)
- Marketing: $200K
- Operations: $100K
- Sales: $100K
- **Profit: +$600K** (profitable!)

### Cash Flow

**Month 0-6:**

- Fundraise $150K
- Build MVP → Launch
- Burn $25K/месяц
- Cash: $150K → $0

**Month 7-12:**

- Revenue ramp: $5K → $25K MRR
- Burn: $20K/месяц
- Need: +$100K bridge round ИЛИ reduce burn

**Year 2:**

- Revenue: $50K → $140K MRR
- Approaching breakeven (Month 18-20)

**Year 3:**

- Profitable: $600K+ net income
- Series A готовность ($5-10M raise для scale)

### Key Assumptions

**Optimistic scenario (+20%):**

- Faster customer acquisition (viral growth)
- Higher conversion rates (70%)
- Lower churn (10%)
- **Year 3 ARR: $6M**

**Base scenario:**

- As outlined above
- **Year 3 ARR: $4.5M**

**Conservative scenario (-30%):**

- Slower growth (marketing underperforms)
- Higher churn (20%)
- Lower ARPU ($200)
- **Year 3 ARR: $2M** (still profitable)

---

## Риски и митигация

### Risk 1: AI Accuracy

**Риск:** GPT-4 Vision делает ошибки → неправильные расчеты → compliance issues

**Вероятность:** Medium (10-15% error rate)

**Митигация:**

1. **Human-in-the-loop review:**
   - Confidence score от AI
   - Low confidence → manual review
   - Пользователь видит parsed data перед расчетом

2. **Insurance:**
   - Professional liability insurance
   - Errors & omissions coverage

3. **Disclaimer:**
   - "This is an estimation tool, not financial advice"
   - User должен verify данные

4. **Continuous improvement:**
   - User feedback loop
   - Fine-tuning модели на real data
   - Error tracking и fixing

### Risk 2: OpenAI API Changes

**Риск:** OpenAI повысит цены или закроет доступ

**Вероятность:** Low (но impact High)

**Митигация:**

1. **Multi-provider strategy:**
   - Anthropic Claude Vision (backup)
   - Google Gemini Vision
   - Azure OpenAI (enterprise SLA)

2. **Cost pass-through:**
   - Tier pricing includes AI costs buffer
   - Если OpenAI +50%, мы можем поднять на 10-15%

3. **Own model (long-term):**
   - Year 2-3: train own OCR model
   - Fine-tuned на utility bills
   - Reduce dependency

### Risk 3: Regulatory Changes

**Риск:** GHG Protocol или SEC меняют требования → наши отчеты не compliant

**Вероятность:** Medium (updates каждые 2-3 года)

**Митигация:**

1. **Advisory board:**
   - Sustainability consultants
   - Ex-EPA experts
   - Monitor regulatory changes

2. **Quarterly updates:**
   - Emission factors refresh
   - Template updates
   - User notifications

3. **Partnerships:**
   - Certification organizations
   - Audit firms (для verification services)

### Risk 4: Competition

**Риск:** Watershed или другой крупный игрок запускает AI-powered малый бизнес tier

**Вероятность:** Medium (within 2 years)

**Митигация:**

1. **First-mover advantage:**
   - Build brand recognition
   - 10,000+ customers = data moat
   - Integrations lock-in

2. **Product velocity:**
   - Ship features быстрее
   - Customer feedback loop
   - Innovation (real-time monitoring, predictive)

3. **Niche focus:**
   - Deep expertise в малом бизнесе
   - Customer support quality
   - Community building

### Risk 5: Market Adoption

**Риск:** Малый бизнес не готов платить за carbon accounting

**Вероятность:** Low (regulatory push сильный)

**Митигация:**

1. **Free tier:**
   - 5 бесплатных расчетов
   - Dashboard доступ
   - Upsell к paid для отчетов

2. **ROI messaging:**
   - "Save $5K+ on consultants"
   - "Get ESG-linked financing"
   - Case studies с savings

3. **Partnership distribution:**
   - Через banks (green loans require carbon data)
   - Через accounting firms
   - B2B2C model

---

## Roadmap развития

### Q1 2026 (Launch)

**Product:**

- ✅ MVP deployment (Vercel + Railway)
- ✅ Stripe integration (payments)
- Privacy policy, ToS
- SSL certificates, security audit

**Marketing:**

- Product Hunt launch
- 5 blog posts (SEO)
- Social media accounts
- First 10 beta customers

**Team:**

- Solo founder
- Part-time contractor (frontend polish)

### Q2 2026 (Growth)

**Product:**

- Manual data correction (если AI ошибся)
- Email notifications (document processed)
- Export to Excel
- Dashboard improvements (more charts)

**Marketing:**

- Google Ads campaign ($5K/month)
- 100 customers milestone
- First case study
- LinkedIn presence

**Team:**

- Hire full-time CTO/developer
- Part-time customer support

### Q3 2026 (Scale)

**Product:**

- Multi-user accounts (team collaboration)
- Role-based access control
- API beta (для integrations)
- Mobile responsive improvements

**Marketing:**

- Partnership с 2-3 accounting firms
- Webinar series
- 500 customers milestone
- Conference presence (Green Biz, Sustainability Summit)

**Team:**

- Marketing/Growth hire
- Full-time customer success

### Q4 2026 (Expansion)

**Product:**

- QuickBooks integration (auto-import bills)
- Xero integration
- Recommendations engine v2 (more detailed)
- Carbon offset marketplace (partner)

**Marketing:**

- 1,000 customers milestone
- PR push (TechCrunch, etc)
- Affiliate program launch
- Year-end reporting push (seasonal demand)

**Team:**

- Sales hire (for Business/Enterprise)
- Part-time accountant/CFO

### 2027 (Year 2) - Features

**Q1:**

- Real-time emissions dashboard
- Supplier carbon tracking (Scope 3 deep-dive)
- Carbon budget alerts
- Mobile app (iOS)

**Q2:**

- Predictive analytics (ML model для forecasting)
- What-if scenarios ("If we switch to renewables...")
- Benchmarking (compare to industry peers)
- White-label option (для partners)

**Q3:**

- Own OCR model (reduce OpenAI dependency)
- Blockchain-based carbon credits (tokenization)
- API marketplace (3rd party integrations)
- International expansion (Canada, UK)

**Q4:**

- IoT integration (smart meters auto-import)
- Carbon offsetting direct purchase
- Sustainability score (overall company rating)
- Series A fundraise ($5-10M)

### 2028+ (Year 3+) - Vision

**Product:**

- AI sustainability advisor (chatbot)
- Supply chain emissions mapping
- Carbon tax calculator (when/if introduced)
- Real-time Scope 1/2/3 monitoring

**Market:**

- 15,000+ customers
- International markets (EU, APAC)
- Enterprise tier (Fortune 500 suppliers)
- Platform ecosystem (developers building on our API)

**Exit Strategy:**

- Acquisition by Intuit (QuickBooks), Xero, или Salesforce
- Or IPO path (if $50M+ ARR)

---

## Заключение

### Why Now?

1. **Regulatory tailwind:** SEC rules create обязательный market
2. **AI breakthrough:** GPT-4 Vision делает автоматизацию возможной
3. **Market gap:** Никто не обслуживает малый бизнес в этом ценовом диапазоне
4. **Climate urgency:** 2030 Paris Agreement targets → pressure на всех

### Why Us?

1. **Technical expertise:** Full-stack AI integration
2. **Market understanding:** Deep research в carbon accounting standards
3. **Execution:** MVP готов за 2 месяца → fast iteration capability
4. **Vision:** Не просто tool, а sustainability platform для SMB

### The Ask

**$150,000 pre-seed** для:

- Launch и first 1,000 customers (12 месяцев)
- Build sustainable revenue base
- Position для Series A

**Return potential:**

- $4.5M ARR in Year 3 → $45M valuation (10x revenue multiple)
- 30x ROI на pre-seed investment

### Next Steps

1. **Due Diligence:**
   - Live demo platform
   - Review code repository
   - Customer discovery interviews

2. **Term Sheet:**
   - SAFE note preferred ($5M cap, 20% discount)
   - Or equity round (10-15%)

3. **Timeline:**
   - 2 weeks due diligence
   - 2 weeks legal
   - **Goal: Close by end of Q1 2026**

---

## Приложения

### Appendix A: Detailed Market Research

[Links to sources: SEC filings, EPA reports, market research]

### Appendix B: Technical Architecture Diagrams

[System architecture, database schema, API documentation]

### Appendix C: Competitive Analysis Deep Dive

[Feature comparison matrix, pricing analysis, customer reviews]

### Appendix D: Financial Model (Excel)

[3-year P&L, cash flow, balance sheet, sensitivity analysis]

### Appendix E: Customer Personas

**Persona 1: "Busy Bob"**

- Small retail shop owner (25 employees)
- No sustainability knowledge
- Needs: Simple, fast, cheap
- Pain: Walmart requires carbon data для vendor status

**Persona 2: "Compliance Claire"**

- Operations manager, manufacturing (50 employees)
- Has some sustainability awareness
- Needs: Accurate, audit-ready reports
- Pain: Current consultant costs $8K/year

**Persona 3: "Green Gary"**

- Restaurant chain (5 locations, 80 employees)
- Wants to market sustainability
- Needs: Public-facing reports, certifications
- Pain: Spreadsheets too manual and error-prone

---

## Контакты

**Основатель:** [Ваше Имя]
**Email:** contact@carbontracker.io
**Phone:** [телефон]
**LinkedIn:** [profile URL]
**Website:** [после деплоя]
**Deck:** [Google Slides pitch deck]

**Запрос встречи:**
Готов к 30-минутному call для детального обсуждения бизнес-модели, демо продукта, и ответов на вопросы.

---

_Документ подготовлен: Январь 2026_
_Версия: 1.0_
_Конфиденциально - Только для потенциальных инвесторов_
