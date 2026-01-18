# Обновления проекта - Адрес, Телефон, Логотип и Исправления

## Выполненные изменения

### 1. ✅ Добавлены поля адреса и телефона в настройках

**База данных:**

- Создан скрипт миграции: `backend/scripts/add-address-phone-logo.sql`
- Добавлены поля в таблицу users:
  - `address` (VARCHAR 500) - адрес компании
  - `phone` (VARCHAR 50) - телефон компании
  - `logo_path` (VARCHAR 500) - путь к логотипу

**Backend:**

- Обновлена модель User (`backend/src/models/user.model.ts`)
- Обновлен контроллер Settings (`backend/src/controllers/settings.controller.ts`)

**Frontend:**

- Добавлены поля в форму настроек (`frontend/src/pages/Settings.tsx`)
- Помечены как обязательные для полноты отчетов (\*)
- Добавлены подсказки под полями

### 2. ✅ Добавлено поле для загрузки логотипа

**Frontend:**

- Поле для ввода URL или пути к логотипу
- Рекомендуемый размер: 180x60px
- Отображается в настройках с подсказкой

**Backend:**

- Логотип сохраняется в поле `logo_path` в таблице users
- PDF сервис обновлен для отображения логотипа

### 3. ✅ Данные добавлены в GHG шаблон

**Файл:** `backend/src/services/pdf.service.ts`

**Изменения:**

- Адрес и телефон берутся из профиля пользователя (user.address, user.phone)
- Логотип отображается на титульной странице отчета
- Если логотип не загружен, показывается placeholder "COMPANY LOGO"

### 4. ✅ Исправлен период отчетности (Reporting Period)

**Проблема:** Период действовал один день

**Решение:**

- По стандарту GHG Protocol период отчетности должен быть 12 месяцев
- Обновлен `backend/src/services/carbon.service.ts`
- Теперь автоматически устанавливается период с 1 января по 31 декабря года
- Если в OCR есть конкретный период, используется он
- Если только дата, создается годовой период (Jan 1 - Dec 31)

**Код:**

```typescript
// Создается 12-месячный период отчетности (стандарт GHG Protocol)
const referenceDate = new Date(parsedData.date || new Date());
periodEnd = new Date(referenceDate.getFullYear(), 11, 31); // 31 декабря
periodStart = new Date(referenceDate.getFullYear(), 0, 1); // 1 января
```

### 5. ✅ Исправлена проблема с "& yes & no"

**Проблема:** Отображались оба варианта вместе

**Решение:**

- Checkbox теперь показывает ☑ No (отмечено) или ☐ Yes (не отмечено)
- Использованы Unicode символы: ☐ (пустой) и ☑ (отмеченный)
- Исправлено в файле `backend/src/services/pdf.service.ts`

**Исправленные места:**

1. Verification checkbox (страница 1): ☑ No, ☐ Yes
2. Scope 3 emissions (страница 2): ☐ Yes, ☑ No

### 6. ✅ Добавлены предупреждения на главной странице

**Файл:** `frontend/src/pages/Dashboard.tsx`

**Изменения:**

- Добавлено предупреждение оранжевого цвета вверху дашборда
- Показывается только если адрес или телефон не заполнены
- Текст: "Complete Your Profile for Full GHG Reports"
- Кнопка "Go to Settings →" ведет в настройки
- Использована иконка AlertCircle

## Как применить изменения

### 1. Запустить миграцию базы данных

```bash
cd backend
node scripts/run-migration.js scripts/add-address-phone-logo.sql
```

Или вручную в PostgreSQL:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS logo_path VARCHAR(500);
```

### 2. Перезапустить backend

```bash
cd backend
npm run dev
```

### 3. Перезапустить frontend

```bash
cd frontend
npm run dev
```

## Что нужно сделать пользователю

1. Зайти в **Settings** (Настройки)
2. Заполнить:
   - **Company Address** (обязательно для полноты отчетов)
   - **Phone Number** (обязательно для полноты отчетов)
   - **Company Logo** (опционально, URL или путь к файлу)
3. Нажать **Save Changes**

## Изменения в отчетах GHG

После заполнения полей, в PDF отчетах будет:

- ✅ Адрес компании в таблице верификации
- ✅ Телефон компании в таблице верификации
- ✅ Логотип компании на титульной странице
- ✅ Корректный период отчетности (12 месяцев)
- ✅ Правильное отображение checkbox (только ДА или НЕТ)

## Стандарт GHG Protocol

Согласно стандарту GHG Protocol Corporate Standard:

- Отчетный период должен быть **12 месяцев** (обычно календарный год)
- Требуются контактные данные компании для верификации
- Рекомендуется независимая верификация третьей стороной

## Файлы изменены

### Backend:

1. `backend/scripts/add-address-phone-logo.sql` - новый файл миграции
2. `backend/src/models/user.model.ts` - добавлены поля
3. `backend/src/controllers/settings.controller.ts` - обработка новых полей
4. `backend/src/services/pdf.service.ts` - использование полей в отчете
5. `backend/src/services/carbon.service.ts` - исправлен период отчетности

### Frontend:

1. `frontend/src/pages/Settings.tsx` - добавлены поля в форму
2. `frontend/src/pages/Dashboard.tsx` - добавлено предупреждение

### Документация:

1. `MIGRATION_INSTRUCTIONS.md` - инструкции по миграции
2. `CHANGES_SUMMARY_RU.md` - этот файл
