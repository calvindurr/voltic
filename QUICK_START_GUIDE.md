# Quick Start Guide - Local Development

This guide will get you up and running with both frontend and backend on your local machine in under 10 minutes.

## 🚀 Option 1: Docker (Recommended - Easiest)

If you have Docker installed, this is the fastest way:

```bash
# 1. Start all services (database, backend, frontend)
docker-compose up --build

# 2. In another terminal, run migrations
docker-compose exec backend python manage.py migrate

# 3. Create sample data (optional)
docker-compose exec backend python manage.py demo_forecast

# 4. Create admin user (optional)
docker-compose exec backend python manage.py createsuperuser
```

**That's it!** 
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin: http://localhost:8000/admin

## 🛠 Option 2: Manual Setup

### Prerequisites
- Python 3.8+ 
- Node.js 16+
- Git

### Backend Setup (5 minutes)

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate it
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Your .env file is already configured for SQLite, so just run:
python manage.py migrate

# 5. Create sample data (optional)
python manage.py demo_forecast

# 6. Start backend
python manage.py runserver
```

Backend will be running at: http://localhost:8000

### Frontend Setup (3 minutes)

```bash
# 1. Go to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start frontend
npm start
```

Frontend will be running at: http://localhost:3000

## ✅ Verify Everything Works

1. **Open http://localhost:3000** - You should see the renewable energy app
2. **Check the map loads** - Interactive map should appear
3. **Test API** - Try creating a site by clicking on the map
4. **Check backend** - Visit http://localhost:8000/api/sites/ to see API response

## 🧪 Run Tests

### Backend Tests
```bash
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests (requires both frontend and backend running)
```bash
cd frontend
npm run test:e2e
```

## 🔧 Environment Variables

Your `.env` file is already configured for local development with SQLite. If you want to use PostgreSQL:

1. **Start PostgreSQL with Docker:**
```bash
docker run --name postgres-dev -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=renewable_forecasting -p 5432:5432 -d postgres:13
```

2. **Update your `.env`:**
```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=renewable_forecasting
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

3. **Install PostgreSQL adapter:**
```bash
pip install psycopg2-binary
```

4. **Run migrations:**
```bash
python manage.py migrate
```

## 🐛 Common Issues

**Port already in use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**CORS errors:**
- Make sure your `.env` has: `CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`

**Map not loading:**
- Check your internet connection (map tiles come from OpenStreetMap)

**API calls failing:**
- Make sure backend is running on port 8000
- Check `frontend/.env` has: `REACT_APP_API_BASE_URL=http://localhost:8000/api`

## 📱 What You Can Do Now

1. **Create Sites**: Click anywhere on the map to add solar/wind sites
2. **Manage Portfolios**: Group sites into portfolios
3. **Run Forecasts**: Generate energy forecasts for portfolios
4. **View Results**: See forecast charts and data
5. **Admin Interface**: Visit http://localhost:8000/admin (if you created a superuser)

## 🎯 Next Steps

- Check out the full [README.md](README.md) for detailed documentation
- Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API details
- Look at [USER_GUIDE.md](USER_GUIDE.md) for feature explanations
- Run E2E tests to see the full workflow in action

## 💡 Pro Tips

- Use `docker-compose up -d` to run in background
- Use `docker-compose logs -f backend` to see backend logs
- Use `docker-compose logs -f frontend` to see frontend logs
- The SQLite database file `db.sqlite3` will be created in your project root
- Sample data includes 2 sites and 1 portfolio with forecast results

Happy coding! 🚀