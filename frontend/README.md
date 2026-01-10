# Carbon Tracker Frontend

React + TypeScript frontend для AI-powered калькулятора углеродного следа.

## Установка

```bash
cd frontend
npm install
```

## Запуск

### Development
```bash
npm run dev
```

Приложение откроется на `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

## Функционал

### ✅ Реализовано:

- **Аутентификация** - Регистрация и вход
- **Dashboard** - Общая статистика и визуализация
- **Upload Bills** - Drag & drop загрузка счетов (PDF, JPG, PNG)
- **Calculations** - История всех расчетов выбросов
- **Recommendations** - AI-generated советы по снижению выбросов

### Страницы:

- `/login` - Вход в систему
- `/register` - Регистрация компании
- `/` - Dashboard с графиками
- `/upload` - Загрузка счетов
- `/calculations` - Просмотр расчетов
- `/recommendations` - Рекомендации

## Технологии

- **React 18** + TypeScript
- **Vite** - сборщик
- **Tailwind CSS** - стилизация
- **React Router** - маршрутизация
- **Axios** - HTTP клиент
- **Recharts** - графики
- **Lucide React** - иконки
- **React Dropzone** - загрузка файлов

## Структура

```
src/
├── api/
│   └── axios.ts          # API клиент
├── components/
│   └── Layout.tsx        # Главный layout
├── context/
│   └── AuthContext.tsx   # Контекст аутентификации
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Upload.tsx
│   ├── Calculations.tsx
│   └── Recommendations.tsx
├── App.tsx
├── main.tsx
└── index.css
```
