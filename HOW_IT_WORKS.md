# 🔄 КАК РАБОТАЕТ СИСТЕМА - Пошаговый процесс

## 📱 USER JOURNEY (Путь пользователя)

```
1. РЕГИСТРАЦИЯ
   ↓
   Пользователь → [Register Page]
   ↓
   Вводит: Email, Password, Company Name
   ↓
   Frontend → POST /api/auth/register → Backend
   ↓
   Backend: Создает пользователя → Hash password → Save to DB
   ↓
   Генерирует JWT токен (7 дней)
   ↓
   Frontend: Сохраняет токен → Редирект на Dashboard
   ↓
   
2. ЗАГРУЗКА СЧЕТА
   ↓
   [Upload Page] → Drag & Drop файл (PDF/JPG/PNG)
   ↓
   Frontend: Валидация (размер, тип)
   ↓
   POST /api/upload + FormData → Backend
   ↓
   Backend: Multer сохраняет в /uploads/
   ↓
   Создает запись в DB (status: 'pending')
   ↓
   Возвращает success → Frontend показывает "Processing..."
   ↓
   
3. AI ПАРСИНГ (Асинхронно)
   ↓
   Backend: Читает файл как base64
   ↓
   OpenAI GPT-4 Vision API:
   ↓
   Промпт: "Extract bill data as JSON"
   ↓
   AI анализирует изображение → Возвращает JSON:
   {
     "type": "electricity",
     "provider": "ConEd",
     "consumption": { "value": 500, "unit": "kWh" },
     "period": { "start": "2024-01-01", "end": "2024-01-31" }
   }
   ↓
   Backend: Сохраняет parsed_data → status: 'completed'
   ↓
   
4. РАСЧЕТ ВЫБРОСОВ
   ↓
   Frontend: POST /api/carbon/calculate { documentId }
   ↓
   Backend: Читает parsed_data
   ↓
   Определяет Scope:
   - Electricity → Scope 2
   - Gas/Fuel → Scope 1
   - Supplies → Scope 3
   ↓
   Применяет emission factors:
   - Electricity: 0.385 kg CO2/kWh (US grid)
   - Gas: 1.89 kg CO2/m³
   - Gasoline: 8.89 kg CO2/gallon
   ↓
   Расчет:
   CO2 = consumption × factor.co2
   CH4 = consumption × factor.ch4
   N2O = consumption × factor.n2o
   Total CO2e = CO2 + (CH4 × 25) + (N2O × 298)
   ↓
   Сохраняет в carbon_calculations table
   ↓
   Возвращает результат → Frontend
   ↓
   
5. ГЕНЕРАЦИЯ РЕКОМЕНДАЦИЙ
   ↓
   Frontend: GET /api/carbon/recommendations
   ↓
   Backend: Анализирует все расчеты пользователя
   ↓
   Группирует по категориям:
   - Electricity total > 100 kg? → LED recommendations
   - Fuel total > 50 kg? → Fleet optimization
   - Gas total > 50 kg? → Insulation tips
   ↓
   Генерирует список рекомендаций с:
   - Title, Description
   - Potential reduction %
   - Priority (high/medium/low)
   ↓
   Сортирует по priority
   ↓
   Возвращает → Frontend показывает карточки
   ↓
   
6. DASHBOARD
   ↓
   Frontend: 
   - GET /api/carbon/calculations → все расчеты
   - GET /api/upload → все документы
   ↓
   Обрабатывает данные:
   - Total emissions = SUM(total_co2e_kg)
   - Group by category для графика
   - Recent 5 calculations
   ↓
   Recharts рендерит:
   - Pie chart (emissions by category)
   - Stats cards
   - Recent activity list
```

---

## 🗄️ СТРУКТУРА БАЗЫ ДАННЫХ

```sql
users
├── id (PK)
├── email (unique)
├── password_hash
├── company_name
├── created_at
└── updated_at

documents
├── id (PK)
├── user_id (FK → users)
├── file_name
├── file_path
├── file_type
├── file_size
├── parsed_data (JSONB)  ← AI результат
├── status (pending/processing/completed/failed)
├── created_at
└── updated_at

carbon_calculations
├── id (PK)
├── user_id (FK → users)
├── document_id (FK → documents)
├── emission_type (scope1/scope2/scope3)
├── category (electricity/gas/fuel/supplies)
├── co2_kg
├── ch4_kg
├── n2o_kg
├── total_co2e_kg
├── calculation_date
├── period_start
└── period_end
```

---

## 🔐 АУТЕНТИФИКАЦИЯ FLOW

```
LOGIN REQUEST
   ↓
POST /api/auth/login { email, password }
   ↓
Backend: Find user by email
   ↓
bcrypt.compare(password, user.password_hash)
   ↓
✅ Match? → Generate JWT:
   {
     userId: user.id,
     email: user.email,
     exp: 7 days
   }
   ↓
Frontend: localStorage.setItem('token', token)
   ↓
PROTECTED REQUEST
   ↓
GET /api/carbon/calculations
Headers: { Authorization: "Bearer <token>" }
   ↓
Backend: auth.middleware.ts
   ↓
Verify JWT → Decode → Extract userId
   ↓
Attach to req.userId
   ↓
Controller uses req.userId для запросов в DB
   ↓
Return only user's data
```

---

## 🎨 FRONTEND STATE MANAGEMENT

```
AuthContext (React Context)
   ↓
Управляет:
   - user: { id, email, companyName } | null
   - loading: boolean
   - login(email, password)
   - register(email, password, companyName)
   - logout()
   ↓
App.tsx:
   - AuthProvider оборачивает все
   - ProtectedRoute проверяет user
   - Если user = null → redirect /login
   ↓
Pages используют useAuth():
   const { user, logout } = useAuth();
```

---

## 📡 API REQUEST FLOW

```
Frontend Component
   ↓
import api from '../api/axios'
   ↓
api.get('/carbon/calculations')
   ↓
axios interceptor добавляет:
   headers: { Authorization: "Bearer <token>" }
   ↓
Request → Backend (localhost:5000)
   ↓
Vite proxy перенаправляет /api → http://localhost:5000
   ↓
Backend route: /api/carbon/calculations
   ↓
Middleware: authenticate (проверка токена)
   ↓
Controller: getCalculations()
   ↓
Model: CarbonModel.findByUserId(userId)
   ↓
PostgreSQL query: SELECT * FROM carbon_calculations WHERE user_id = $1
   ↓
Result → Controller → Response JSON
   ↓
Frontend: response.data.data
   ↓
Update state → Re-render component
```

---

## 🤖 AI ПАРСИНГ ДЕТАЛИ

```
parseDocumentWithAI(documentId, filePath)
   ↓
1. Read file as Buffer
   fs.readFileSync(filePath)
   ↓
2. Convert to base64
   buffer.toString('base64')
   ↓
3. OpenAI API call:
   model: "gpt-4-vision-preview"
   messages: [
     {
       role: "user",
       content: [
         { type: "text", text: "Extract JSON..." },
         { type: "image_url", url: "data:image/jpeg;base64,..." }
       ]
     }
   ]
   ↓
4. AI Response (обычно 10-30 сек):
   {
     "type": "electricity",
     "provider": "ConEd",
     "date": "2024-01-15",
     "amount": 125.50,
     "consumption": { "value": 500, "unit": "kWh" },
     "period": {
       "start": "2024-01-01",
       "end": "2024-01-31"
     }
   }
   ↓
5. Save to documents.parsed_data
   status = 'completed'
```

---

## 📊 EMISSION FACTORS REFERENCE

```javascript
ELECTRICITY (US Grid Average):
  CO2: 0.385 kg/kWh
  CH4: 0.0001 kg/kWh
  N2O: 0.0001 kg/kWh
  
NATURAL GAS:
  CO2: 1.89 kg/m³
  CH4: 0.036 kg/m³
  N2O: 0.0004 kg/m³
  
GASOLINE:
  CO2: 8.89 kg/gallon
  CH4: 0.036 kg/gallon
  N2O: 0.029 kg/gallon
  
DIESEL:
  CO2: 10.21 kg/gallon
  CH4: 0.022 kg/gallon
  N2O: 0.032 kg/gallon

CO2e CALCULATION:
  Total = CO2 + (CH4 × 25) + (N2O × 298)
  
  где:
  - CH4 имеет GWP (Global Warming Potential) = 25
  - N2O имеет GWP = 298
```

---

## 🎯 ТИПИЧНЫЙ СЦЕНАРИЙ ИСПОЛЬЗОВАНИЯ

```
День 1: Регистрация
  → Компания "Small Coffee Shop Inc" создает аккаунт
  
День 1: Загрузка счетов
  → Загружают январский счет за электричество (500 kWh)
  → Загружают счет за газ (50 m³)
  → Загружают чек за бензин (30 gallons)
  
День 1: Просмотр результатов
  → Dashboard показывает:
     - Total: 459.3 kg CO2e
     - Breakdown:
       * Electricity (Scope 2): 192.5 kg
       * Gas (Scope 1): 94.5 kg
       * Fuel (Scope 1): 172.3 kg
  
День 1: Рекомендации
  → "Switch to LED bulbs" → 15-20% reduction
  → "Optimize delivery routes" → 10-20% fuel savings
  → "Renewable energy plan" → 50-100% Scope 2 reduction
  
День 30: Повторная загрузка
  → Загружают февральские счета
  → Видят тренд: emissions снизились на 12%
  → Применили LED рекомендацию!
```

---

**Теперь вы понимаете как работает вся система от А до Я!** 🎓
