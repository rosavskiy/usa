# Azure Computer Vision Setup Guide

## 🔵 Получение БЕСПЛАТНЫХ ключей Azure Computer Vision

### Шаг 1: Создать Azure аккаунт
1. Перейти: https://portal.azure.com
2. Зарегистрироваться (нужна кредитная карта, но 100% бесплатно первые 12 месяцев)
3. Получить **$200 бесплатных кредитов** на 30 дней

### Шаг 2: Создать Computer Vision ресурс
1. В Azure Portal нажать **"Create a resource"**
2. Найти **"Computer Vision"**
3. Нажать **"Create"**
4. Заполнить:
   - **Subscription**: Free Trial
   - **Resource Group**: Создать новый "carbon-tracker-rg"
   - **Region**: East US (или ближайший)
   - **Name**: carbon-tracker-cv-1
   - **Pricing Tier**: **Free F0** (5,000 запросов/месяц БЕСПЛАТНО)
5. Нажать **"Review + Create"** → **"Create"**

### Шаг 3: Получить ключ и endpoint
1. После создания перейти в ресурс
2. Слева выбрать **"Keys and Endpoint"**
3. Скопировать:
   - **KEY 1** → `AZURE_CV_KEY_1`
   - **Endpoint** → `AZURE_CV_ENDPOINT_1`

### Шаг 4: Создать дополнительные ресурсы (опционально)
Повторить Шаг 2-3 еще 2 раза с именами:
- `carbon-tracker-cv-2` → `AZURE_CV_KEY_2`, `AZURE_CV_ENDPOINT_2`
- `carbon-tracker-cv-3` → `AZURE_CV_KEY_3`, `AZURE_CV_ENDPOINT_3`

**ИТОГО:** 3 ключа × 5,000 = **15,000 запросов/месяц БЕСПЛАТНО** ✅

---

## 📝 Настройка .env

Добавьте в файл `.env`:

```env
# Azure Computer Vision (multiple keys for rotation)
AZURE_CV_KEY_1=your_32_character_azure_key_here
AZURE_CV_ENDPOINT_1=https://carbon-tracker-cv-1.cognitiveservices.azure.com/

AZURE_CV_KEY_2=your_32_character_azure_key_here
AZURE_CV_ENDPOINT_2=https://carbon-tracker-cv-2.cognitiveservices.azure.com/

AZURE_CV_KEY_3=your_32_character_azure_key_here
AZURE_CV_ENDPOINT_3=https://carbon-tracker-cv-3.cognitiveservices.azure.com/

# OCR.space (fallback)
OCR_SPACE_API_KEY=K81659123788957
```

---

## 🚀 Как работает система

### Цепочка fallback:
1. **Azure CV Key 1** (точность 95%+, 5000/мес)
2. **Azure CV Key 2** (если Key 1 исчерпан)
3. **Azure CV Key 3** (если Key 2 исчерпан)
4. **OCR.space** (если все Azure ключи исчерпаны, точность 75%)

### Автоматическая ротация:
- Когда ключ получает ошибку 429 (quota exceeded), система автоматически переключается на следующий
- Цикл ротации: Key 1 → Key 2 → Key 3 → Key 1 (по кругу)

---

## 💡 Альтернатива: Google Cloud Vision (еще лучше)

Если хотите еще выше точность:

1. https://console.cloud.google.com
2. Create Project → Enable Vision API
3. Create Credentials → API Key
4. **1,000 запросов/месяц БЕСПЛАТНО** (точность 96%+)

Добавить в .env:
```env
GOOGLE_VISION_API_KEY=your_google_api_key
```

---

## 📊 Сравнение

| Сервис | Бесплатный лимит | Точность | Наша система |
|--------|------------------|----------|--------------|
| Azure CV (3 ключа) | 15,000/мес | 93-95% | ✅ Основной |
| OCR.space | 25,000/мес | 75% | ✅ Fallback |
| Google Vision | 1,000/мес | 96%+ | ⚪ Опционально |

---

## ✅ Проверка работы

Запустить сервер:
```bash
npm run dev
```

Логи покажут:
```
🔵 Trying Azure CV key 1/3...
✅ Azure CV succeeded with key 1
```

Или если ключ не настроен:
```
⚠️ No Azure CV keys configured, using OCR.space
📸 Trying OCR.space API (fallback)...
✅ OCR.space fallback successful
```
