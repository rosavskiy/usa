# 🔑 Настройка ПЛАТНОГО Gemini API

## Как получить платный ключ

1. Перейди на **Google Cloud Console**: https://console.cloud.google.com/
2. Создай новый проект или выбери существующий
3. Включи **Generative Language API**:
   - Перейди в **APIs & Services** → **Enable APIs and Services**
   - Найди "Generative Language API" и включи её
4. Создай API ключ:
   - **APIs & Services** → **Credentials**
   - **Create Credentials** → **API Key**
   - Скопируй ключ (например: `AIzaSyAbc123...`)

## Как вставить ключ в проект

### Вариант 1: Через файл .env (рекомендуется)

1. Открой файл `backend/.env` (создай если нет)
2. Найди строку `GEMINI_API_KEY=`
3. Вставь свой ключ:

```env
GEMINI_API_KEY=AIzaSyAbc123твой_платный_ключ_здесь
```

4. Сохрани файл
5. Перезапусти сервер: `npm run dev`

### Вариант 2: Напрямую в код (НЕ рекомендуется)

Открой `backend/src/services/gemini.service.ts` и замени:

```typescript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
```

на:

```typescript
const genAI = new GoogleGenerativeAI("AIzaSyAbc123твой_ключ_здесь");
```

⚠️ **НЕ коммить ключ в Git!**

## Какие модели доступны на платном API

Платный API поддерживает больше моделей:

- ✅ `gemini-2.0-flash-exp` - новейшая экспериментальная (быстрая)
- ✅ `gemini-1.5-flash` - стабильная быстрая версия
- ✅ `gemini-1.5-pro` - самая мощная
- ✅ `gemini-pro-vision` - для работы с изображениями

## Как работает fallback в коде

Код автоматически пробует модели по порядку:

```typescript
1. gemini-2.0-flash-exp (если доступна)
2. gemini-1.5-flash (если первая не работает)
3. gemini-pro (если обе не работают)
```

## Проверка что ключ работает

После вставки ключа запусти сервер:

```bash
cd backend
npm run dev
```

Загрузи счёт за электричество и смотри в консоли:

- ✅ `Using model: gemini-2.0-flash-exp` — работает!
- ✅ `Gemini Vision parsed successfully` — парсинг прошёл
- ❌ `404` — ключ неправильный или модель недоступна

## Лимиты платного API

- **Бесплатный лимит**: 15 запросов/минуту, 1500 запросов/день
- **После привязки карты**: 360 запросов/минуту, неограниченно в день
- **Цена**: ~$0.00025 за запрос для gemini-1.5-flash

## Где вставить ключ ПРЯМО СЕЙЧАС

📁 **Файл**: `backend/.env`
📝 **Строка**: `GEMINI_API_KEY=здесь_твой_ключ`

Пример:

```env
GEMINI_API_KEY=AIzaSyA2OHBZB-SQufzk-v-UG5Du9nqfpaXJvgI
```

После вставки — перезапусти сервер!
