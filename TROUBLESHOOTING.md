# Troubleshooting Guide - Renewable Energy Forecasting Application

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Backend Issues](#backend-issues)
3. [Frontend Issues](#frontend-issues)
4. [Database Issues](#database-issues)
5. [Docker Issues](#docker-issues)
6. [API Issues](#api-issues)
7. [Performance Issues](#performance-issues)
8. [Development Environment Issues](#development-environment-issues)
9. [Production Deployment Issues](#production-deployment-issues)
10. [Common Error Messages](#common-error-messages)

## Quick Diagnostics

### Health Check Commands

Run these commands to quickly identify issues:

```bash
# Check backend health
curl http://localhost:8000/api/health/

# Check frontend accessibility
curl http://localhost:3000

# Check database connection (if using PostgreSQL)
python manage.py dbshell

# Check Django configuration
python manage.py check

# Check for missing migrations
python manage.py showmigrations
```

### Service Status Check

```bash
# Check if services are running
ps aux | grep python  # Django backend
ps aux | grep node    # React frontend
ps aux | grep postgres # PostgreSQL (if used)

# Check port usage
lsof -i :8000  # Backend port
lsof -i :3000  # Frontend port
lsof -i :5432  # PostgreSQL port
```

## Backend Issues

### Django Server Won't Start

#### Issue: `ModuleNotFoundError: No module named 'rest_framework'`

**Cause**: Missing Python dependencies

**Solution**:
```bash
# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt

# Verify installation
pip list | grep djangorestframework
```

#### Issue: `django.core.exceptions.ImproperlyConfigured: The SECRET_KEY setting must not be empty`

**Cause**: Missing or invalid environment variables

**Solution**:
```bash
# Check if .env file exists
ls -la .env

# Create from template if missing
cp .env.example .env

# Edit .env file with proper values
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

#### Issue: `django.db.utils.OperationalError: no such table`

**Cause**: Database migrations not applied

**Solution**:
```bash
# Run migrations
python manage.py migrate

# If migrations are missing, create them
python manage.py makemigrations

# Check migration status
python manage.py showmigrations
```

### Database Connection Issues

#### Issue: `django.db.utils.OperationalError: could not connect to server`

**Cause**: PostgreSQL server not running or incorrect connection settings

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql  # On Linux
brew services list | grep postgres  # On macOS

# Start PostgreSQL if stopped
sudo systemctl start postgresql  # On Linux
brew services start postgresql   # On macOS

# Check connection settings in .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=renewable_forecasting
DB_USER=your_username
DB_PASSWORD=your_password
```

#### Issue: SQLite database locked

**Cause**: Multiple processes accessing SQLite database

**Solution**:
```bash
# Stop all Django processes
pkill -f "python manage.py runserver"

# Remove database lock (if exists)
rm db.sqlite3-journal

# Restart server
python manage.py runserver
```

### CORS Issues

#### Issue: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Cause**: CORS not properly configured for frontend domain

**Solution**:
```bash
# Check CORS settings in .env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Verify django-cors-headers is installed
pip list | grep django-cors-headers

# Check settings.py includes CORS middleware
# Should have 'corsheaders.middleware.CorsMiddleware' in MIDDLEWARE
```

### API Endpoint Issues

#### Issue: `404 Not Found` for API endpoints

**Cause**: URL routing configuration issues

**Solution**:
```bash
# Check URL patterns
python manage.py show_urls  # If django-extensions installed

# Verify URL configuration in urls.py files
# Check renewable_forecasting/urls.py and forecasting/urls.py

# Test specific endpoints
curl -v http://localhost:8000/api/sites/
```

## Frontend Issues

### React Development Server Issues

#### Issue: `npm start` fails with dependency errors

**Cause**: Missing or incompatible Node.js dependencies

**Solution**:
```bash
cd frontend

# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If still failing, check Node.js version
node --version  # Should be 16+ for React 18
```

#### Issue: `EADDRINUSE: address already in use :::3000`

**Cause**: Port 3000 is already in use

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### API Connection Issues

#### Issue: Network errors when calling backend API

**Cause**: Backend not running or incorrect API URL

**Solution**:
```bash
# Check if backend is running
curl http://localhost:8000/api/health/

# Verify API URL in frontend/.env
REACT_APP_API_BASE_URL=http://localhost:8000/api

# Check browser network tab for actual requests
# Open browser dev tools > Network tab
```

#### Issue: API calls return 403 Forbidden

**Cause**: CSRF or authentication issues

**Solution**:
```bash
# Check if CSRF tokens are properly handled
# Verify CORS settings allow credentials

# In Django settings, ensure:
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = ['http://localhost:3000']
```

### Map Loading Issues

#### Issue: Map tiles not loading

**Cause**: Internet connectivity or tile server issues

**Solution**:
```bash
# Check internet connection
ping tile.openstreetmap.org

# Try alternative tile server in MapView component
# Replace OpenStreetMap URL with alternative like:
# https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png
```

#### Issue: Map markers not displaying

**Cause**: Invalid coordinate data or JavaScript errors

**Solution**:
```bash
# Check browser console for JavaScript errors
# Verify site data has valid coordinates
# Check API response format matches expected structure

# Test with sample data
curl http://localhost:8000/api/sites/ | jq
```

## Database Issues

### SQLite Issues (Development)

#### Issue: Database is locked

**Solution**:
```bash
# Stop all Django processes
pkill -f runserver

# Remove lock file
rm db.sqlite3-journal

# Check file permissions
ls -la db.sqlite3
chmod 664 db.sqlite3  # If needed
```

#### Issue: Corrupted database

**Solution**:
```bash
# Backup current database
cp db.sqlite3 db.sqlite3.backup

# Check database integrity
sqlite3 db.sqlite3 "PRAGMA integrity_check;"

# If corrupted, recreate database
rm db.sqlite3
python manage.py migrate
```

### PostgreSQL Issues (Production)

#### Issue: Connection refused

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if PostgreSQL is listening
sudo netstat -tlnp | grep 5432

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### Issue: Authentication failed

**Solution**:
```bash
# Check pg_hba.conf configuration
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Ensure proper authentication method
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5

# Restart PostgreSQL after changes
sudo systemctl restart postgresql
```

## Docker Issues

### Docker Compose Issues

#### Issue: `docker-compose command not found`

**Solution**:
```bash
# Install Docker Compose
# On macOS with Homebrew:
brew install docker-compose

# On Ubuntu:
sudo apt-get install docker-compose

# Or use docker compose (newer syntax):
docker compose up
```

#### Issue: Services fail to start

**Solution**:
```bash
# Check Docker daemon status
sudo systemctl status docker

# Start Docker if stopped
sudo systemctl start docker

# Check logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Rebuild services
docker-compose up --build
```

#### Issue: Port conflicts

**Solution**:
```bash
# Check what's using the ports
lsof -i :8000
lsof -i :3000
lsof -i :5432

# Stop conflicting services
docker-compose down

# Or modify ports in docker-compose.yml
ports:
  - "8001:8000"  # Use different host port
```

### Docker Build Issues

#### Issue: Build fails with dependency errors

**Solution**:
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -t test-build .
```

#### Issue: Volume mount issues

**Solution**:
```bash
# Check volume permissions
ls -la ./

# On Linux, fix ownership
sudo chown -R $USER:$USER ./

# Remove volumes and recreate
docker-compose down -v
docker-compose up
```

## API Issues

### Authentication Issues

#### Issue: 401 Unauthorized responses

**Solution**:
```bash
# Check if authentication is required
# Verify session cookies are being sent
# Check CSRF token handling

# For development, ensure AllowAny permission:
# permission_classes = [AllowAny]
```

### Serialization Issues

#### Issue: Validation errors on API requests

**Solution**:
```bash
# Check request data format
curl -X POST http://localhost:8000/api/sites/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "site_type": "solar", "latitude": 40.0, "longitude": -74.0}' \
  -v

# Verify field requirements in serializers.py
# Check model field constraints
```

### Forecast Job Issues

#### Issue: Forecast jobs stuck in pending status

**Solution**:
```bash
# Check for background task processing
# Verify ForecastService is working
python manage.py shell
>>> from forecasting.services import ForecastService
>>> service = ForecastService()
>>> # Test service methods

# Check for errors in forecast processing
# Look at job error_message field
```

## Performance Issues

### Slow API Responses

#### Issue: Database queries taking too long

**Solution**:
```bash
# Enable Django Debug Toolbar (development only)
pip install django-debug-toolbar

# Add to INSTALLED_APPS and MIDDLEWARE in settings.py

# Check for N+1 queries
# Use select_related() and prefetch_related() in views

# Add database indexes if needed
python manage.py dbshell
CREATE INDEX idx_site_coordinates ON forecasting_site(latitude, longitude);
```

#### Issue: Large dataset performance

**Solution**:
```bash
# Implement pagination
# Add filtering options
# Use database-level aggregation

# Example: Add pagination to views
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
```

### Frontend Performance Issues

#### Issue: Slow map rendering with many sites

**Solution**:
```bash
# Implement marker clustering
npm install react-leaflet-markercluster

# Add virtualization for large lists
npm install react-window

# Optimize bundle size
npm run build
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

## Development Environment Issues

### Python Environment Issues

#### Issue: Import errors or version conflicts

**Solution**:
```bash
# Create fresh virtual environment
python -m venv venv_new
source venv_new/bin/activate
pip install -r requirements.txt

# Check Python version
python --version  # Should be 3.8+

# Verify package versions
pip list
pip check  # Check for dependency conflicts
```

### Node.js Environment Issues

#### Issue: Node.js version compatibility

**Solution**:
```bash
# Check Node.js version
node --version  # Should be 16+

# Use Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Clear npm cache
npm cache clean --force
```

## Production Deployment Issues

### Environment Configuration

#### Issue: Environment variables not loading

**Solution**:
```bash
# Check environment file location
ls -la .env

# Verify environment variables are set
printenv | grep SECRET_KEY

# For production, use system environment variables
export SECRET_KEY="your-production-key"
export DEBUG=False
```

### Static Files Issues

#### Issue: Static files not serving

**Solution**:
```bash
# Collect static files
python manage.py collectstatic --noinput

# Check STATIC_ROOT setting
# Verify web server configuration (Nginx/Apache)

# For development, ensure:
DEBUG = True
# Django will serve static files automatically
```

### Database Migration Issues

#### Issue: Migration conflicts in production

**Solution**:
```bash
# Check migration status
python manage.py showmigrations

# Resolve conflicts
python manage.py migrate --fake-initial

# If needed, reset migrations (DANGER: data loss)
# python manage.py migrate forecasting zero
# python manage.py migrate
```

## Common Error Messages

### Backend Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `ModuleNotFoundError` | Missing Python package | `pip install -r requirements.txt` |
| `ImproperlyConfigured` | Django settings issue | Check settings.py and .env |
| `OperationalError` | Database connection issue | Check database status and settings |
| `ValidationError` | Invalid model data | Check model constraints and input data |
| `PermissionDenied` | Authentication/authorization issue | Check permissions and authentication |

### Frontend Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `Module not found` | Missing npm package | `npm install` |
| `Network Error` | API connection issue | Check backend status and CORS |
| `Unexpected token` | JavaScript syntax error | Check browser console for details |
| `Cannot read property` | Undefined variable/object | Check data structure and API response |
| `CORS policy` | Cross-origin request blocked | Configure CORS in Django settings |

### Docker Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `port is already allocated` | Port conflict | Change ports or stop conflicting services |
| `no such file or directory` | Missing file in build context | Check Dockerfile and .dockerignore |
| `failed to solve` | Build dependency issue | Clear cache and rebuild |
| `connection refused` | Service not ready | Check service dependencies and health |

## Getting Additional Help

### Debugging Steps

1. **Check logs first**: Always start with application logs
2. **Isolate the issue**: Test individual components
3. **Verify configuration**: Double-check all settings
4. **Test with minimal data**: Use simple test cases
5. **Check recent changes**: What changed since it last worked?

### Useful Commands for Debugging

```bash
# Django debugging
python manage.py shell
python manage.py dbshell
python manage.py check --deploy

# Frontend debugging
npm run build  # Check for build errors
npm audit      # Check for security issues

# System debugging
docker-compose logs -f
tail -f /var/log/nginx/error.log  # If using Nginx
```

### When to Seek Help

Contact support or development team when:
- Error persists after following troubleshooting steps
- Data corruption or loss occurs
- Security-related issues are discovered
- Performance degrades significantly
- Multiple users report the same issue

### Information to Provide When Seeking Help

1. **Error message**: Complete error text
2. **Steps to reproduce**: What actions led to the error
3. **Environment details**: OS, Python version, Node.js version
4. **Configuration**: Relevant settings (sanitized)
5. **Logs**: Application and system logs
6. **Recent changes**: What was modified recently

---

For additional support, refer to:
- [README.md](README.md) - General setup and usage
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference
- [USER_GUIDE.md](USER_GUIDE.md) - User instructions