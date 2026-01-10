# Carbon Tracker - Скрипты для запуска

## Windows (PowerShell)

### Запуск Backend:
```powershell
cd backend
npm run dev
```

### Запуск Frontend:
```powershell
cd frontend  
npm run dev
```

### Запуск обоих сразу (требует установить concurrently):
```powershell
npm install -g concurrently
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

---

## Быстрая установка всех зависимостей:

```powershell
cd backend; npm install; cd ../frontend; npm install
```

---

## Production Build:

### Backend:
```powershell
cd backend
npm run build
npm start
```

### Frontend:
```powershell
cd frontend
npm run build
npm run preview
```
