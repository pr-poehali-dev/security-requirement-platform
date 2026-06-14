# Запуск SecureArch в Docker

## Быстрый старт

### SQLite (рекомендуется для разработки)

```bash
docker compose --profile sqlite up --build
```

### PostgreSQL (production)

```bash
docker compose --profile postgres up --build
```

Приложение: **http://localhost:3000**  
API Swagger: **http://localhost:8000/docs** (только при локальном запуске api)  
MinIO Console: **http://localhost:9001** — `minioadmin / minioadmin`

---

## Локальная разработка без Docker

```bash
# 1. Бэкенд
cd api && pip install -r requirements.txt
cp ../.env.example .env
uvicorn main:app --reload --port 8000

# 2. Фронтенд (в другом терминале, в корне)
bun install && bun run dev
```

Vite автоматически проксирует `/api/*` → `http://localhost:8000`.

---

## Переключение БД

`api/.env`:

```env
# SQLite (по умолчанию)
DATABASE_URL=sqlite:///./secarch.db

# PostgreSQL
DATABASE_URL=postgresql://secarch:secarch@localhost:5432/secarch
```

---

## Структура API (`/api/v1`)

| Метод  | Путь                               | Описание                      |
|--------|------------------------------------|-------------------------------|
| GET    | /requirements                      | Список требований             |
| POST   | /requirements                      | Создать требование            |
| PUT    | /requirements/{id}                 | Обновить                      |
| DELETE | /requirements/{id}                 | Удалить                       |
| POST   | /requirements/{id}/comments        | Добавить комментарий          |
| GET    | /architectures                     | Список архитектур             |
| GET    | /templates                         | Список шаблонов               |
| POST   | /templates/{id}/apply              | Применить шаблон (+счётчик)   |
| GET    | /org-domains                       | Орг. домены                   |
| GET    | /tech-domains                      | Технические домены            |
| GET    | /technologies                      | Технологии                    |
| GET    | /technologies/tags/all             | Все теги (автодополнение)     |
| POST   | /technologies/{id}/tags?tag=...    | Добавить тег                  |
| DELETE | /technologies/{id}/tags/{tag_id}   | Удалить тег                   |
| POST   | /technologies/{id}/mermaid         | Добавить Mermaid-схему        |
| PUT    | /technologies/{id}/mermaid/{mid}   | Обновить схему                |
| DELETE | /technologies/{id}/mermaid/{mid}   | Удалить схему                 |
| POST   | /technologies/{id}/files           | Загрузить файл (base64)       |
| DELETE | /technologies/{id}/files/{fid}     | Удалить файл                  |
| GET    | /users                             | Пользователи                  |
| GET    | /dashboard/stats                   | Статистика для дашборда       |
| GET    | /health                            | Health check                  |
