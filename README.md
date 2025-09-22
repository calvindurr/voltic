# Renewable Energy Forecasting Application

A full-stack web application for managing renewable energy sites, creating portfolios, and running forecasting models. The application provides an interactive map-based interface for site management, portfolio creation, and visualization of forecasting results.

**This is a test of Kiro**

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [API Documentation](#api-documentation)
- [User Guide](#user-guide)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)
- [Contributing](#contributing)

## Overview

The Renewable Energy Forecasting Application is designed to help renewable energy analysts manage renewable energy sites (solar and wind), organize them into portfolios, and run forecasting models to predict energy generation. The system features:

- **Interactive Map Interface**: Click-to-add sites with Leaflet integration
- **Site Management**: Full CRUD operations for renewable energy sites
- **Portfolio Management**: Group sites into portfolios for analysis
- **Forecasting Engine**: Modular forecasting system with pluggable models
- **API-First Design**: RESTful APIs for integration with external systems
- **Real-time Updates**: Asynchronous job processing for forecasting operations

## Architecture

The application follows a modern full-stack architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  React Frontend │    │  Django Backend │    │    Database     │
│                 │    │                 │    │                 │
│  • Map Interface│◄──►│  • REST APIs    │◄──►│  • Sites        │
│  • Site Forms   │    │  • Models       │    │  • Portfolios   │
│  • Dashboards   │    │  • Services     │    │  • Forecasts    │
│  • Charts       │    │  • Forecast Eng │    │  • Jobs         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

- **Frontend (React)**: Interactive user interface with map-based site management
- **Backend (Django)**: RESTful API server with business logic and data management
- **Database**: Persistent storage for sites, portfolios, and forecast results
- **Forecast Engine**: Modular system for running different forecasting models

## Features

### ✅ Implemented Features

- **Site Management**
  - Interactive map with click-to-add functionality
  - CRUD operations for renewable energy sites
  - Coordinate validation and duplicate prevention
  - Support for solar and wind site types

- **Portfolio Management**
  - Create and manage portfolios of sites
  - Add/remove sites from portfolios
  - Visual grouping on map interface
  - Portfolio-level operations

- **Forecasting System**
  - Asynchronous job processing
  - Modular forecast model architecture
  - Random forecast model (MVP implementation)
  - Job status tracking and result storage

- **API Integration**
  - Comprehensive REST API
  - Error handling and validation
  - Job management endpoints
  - Result retrieval endpoints

- **User Interface**
  - Responsive React application
  - Interactive Leaflet maps
  - Chart.js visualizations
  - Loading states and error handling

## Technology Stack

### Backend
- **Django 4.2+**: Web framework
- **Django REST Framework**: API development
- **SQLite**: Development database
- **PostgreSQL**: Production database (recommended)
- **Python 3.8+**: Programming language

### Frontend
- **React 18+**: UI framework
- **TypeScript**: Type safety
- **Leaflet**: Interactive maps
- **Chart.js**: Data visualization
- **Axios**: HTTP client
- **React Router**: Client-side routing

### Development Tools
- **Docker**: Containerization
- **Jest**: Testing framework
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Project Structure

```
renewable_forecasting/
├── README.md                           # This file
├── requirements.txt                    # Python dependencies
├── manage.py                          # Django management script
├── .env.example                       # Environment variables template
├── docker-compose.yml                 # Docker configuration
├── Dockerfile                         # Docker image definition
│
├── renewable_forecasting/             # Main Django project
│   ├── settings.py                   # Django settings
│   ├── urls.py                       # URL routing
│   ├── views.py                      # Basic views
│   └── wsgi.py                       # WSGI configuration
│
├── forecasting/                       # Main Django app
│   ├── models.py                     # Data models
│   ├── views.py                      # API views
│   ├── serializers.py                # DRF serializers
│   ├── services.py                   # Business logic
│   ├── urls.py                       # App URLs
│   ├── forecast_engine.py            # Forecasting engine
│   ├── admin.py                      # Django admin
│   ├── migrations/                   # Database migrations
│   └── management/commands/          # Custom commands
│
├── frontend/                          # React application
│   ├── public/                       # Static assets
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── Map/                 # Map components
│   │   │   ├── Site/                # Site management
│   │   │   ├── Portfolio/           # Portfolio management
│   │   │   ├── Forecast/            # Forecast components
│   │   │   ├── Loading/             # Loading components
│   │   │   └── Error/               # Error handling
│   │   ├── services/                # API services
│   │   ├── hooks/                   # Custom hooks
│   │   ├── types/                   # TypeScript types
│   │   ├── utils/                   # Utility functions
│   │   └── pages/                   # Page components
│   ├── package.json                 # Node dependencies
│   └── tsconfig.json               # TypeScript config
│
└── .kiro/                            # Kiro specifications
    └── specs/renewable-forecasting/
        ├── requirements.md           # Feature requirements
        ├── design.md                # System design
        └── tasks.md                 # Implementation tasks
```

## Local Development Setup

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** for version control
- **Optional**: Docker and Docker Compose

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd renewable_forecasting
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   
   # On macOS/Linux:
   source venv/bin/activate
   
   # On Windows:
   venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

5. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Load sample data (optional):**
   ```bash
   python manage.py demo_forecast
   ```

8. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

The backend API will be available at `http://127.0.0.1:8000/`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:8000/api
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000/`

### Verification

1. **Check backend health:**
   ```bash
   curl http://localhost:8000/api/health/
   ```

2. **Check frontend:**
   Open `http://localhost:3000` in your browser

3. **Run tests:**
   ```bash
   # Backend tests
   python manage.py test
   
   # Frontend tests
   cd frontend && npm test
   ```

## Docker Setup

For easy containerized development, use Docker Compose:

### Prerequisites

- **Docker** and **Docker Compose** installed

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd renewable_forecasting
   ```

2. **Create environment files:**
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```

3. **Build and start services:**
   ```bash
   docker-compose up --build
   ```

4. **Run migrations (in another terminal):**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

5. **Create superuser (optional):**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

### Docker Services

- **backend**: Django API server (port 8000)
- **frontend**: React development server (port 3000)
- **db**: PostgreSQL database (port 5432)

### Docker Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run commands in containers
docker-compose exec backend python manage.py shell
docker-compose exec frontend npm test

# Rebuild services
docker-compose up --build
```

## API Documentation

The application provides a comprehensive REST API for managing sites, portfolios, and forecasting operations.

### Base URL

- **Development**: `http://localhost:8000/api/`
- **Production**: `https://your-domain.com/api/`

### Authentication

Currently using session authentication. For production, consider implementing JWT tokens.

### Response Format

All API responses follow a consistent JSON format:

**Success Response:**
```json
{
  "id": 1,
  "name": "Site Name",
  "data": "..."
}
```

**Error Response:**
```json
{
  "error": "Error type",
  "details": "Detailed error message",
  "field_errors": {
    "field_name": ["Field-specific error"]
  }
}
```

### Sites API

#### List Sites
```http
GET /api/sites/
```

**Query Parameters:**
- `site_type` (optional): Filter by site type (`solar` or `wind`)

**Response:**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Solar Farm Alpha",
      "site_type": "solar",
      "latitude": "40.123456",
      "longitude": "-74.123456",
      "capacity_mw": "100.50",
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### Create Site
```http
POST /api/sites/
Content-Type: application/json

{
  "name": "Wind Farm Beta",
  "site_type": "wind",
  "latitude": "41.123456",
  "longitude": "-75.123456",
  "capacity_mw": "150.75"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "name": "Wind Farm Beta",
  "site_type": "wind",
  "latitude": "41.123456",
  "longitude": "-75.123456",
  "capacity_mw": "150.75",
  "created_at": "2024-01-01T13:00:00Z",
  "updated_at": "2024-01-01T13:00:00Z"
}
```

#### Get Site
```http
GET /api/sites/{id}/
```

#### Update Site
```http
PUT /api/sites/{id}/
Content-Type: application/json

{
  "name": "Updated Site Name",
  "capacity_mw": "200.00"
}
```

#### Delete Site
```http
DELETE /api/sites/{id}/
```

**Response (204 No Content)** or **Error (409 Conflict)** if site is in portfolios.

### Portfolios API

#### List Portfolios
```http
GET /api/portfolios/
```

**Response:**
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "name": "East Coast Portfolio",
      "description": "Solar and wind sites on the east coast",
      "sites": [
        {
          "id": 1,
          "name": "Solar Farm Alpha",
          "site_type": "solar",
          "latitude": "40.123456",
          "longitude": "-74.123456"
        }
      ],
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

#### Create Portfolio
```http
POST /api/portfolios/
Content-Type: application/json

{
  "name": "West Coast Portfolio",
  "description": "Renewable sites on the west coast",
  "site_ids": [1, 2]
}
```

#### Add Site to Portfolio
```http
POST /api/portfolios/{id}/add_site/
Content-Type: application/json

{
  "site_id": 3
}
```

#### Remove Site from Portfolio
```http
DELETE /api/portfolios/{id}/remove_site/
Content-Type: application/json

{
  "site_id": 3
}
```

#### Get Portfolio Sites
```http
GET /api/portfolios/{id}/sites/
```

### Forecasting API

#### Trigger Portfolio Forecast
```http
POST /api/forecasts/portfolio/{portfolio_id}/trigger/
Content-Type: application/json

{
  "forecast_horizon": 48
}
```

**Response (201 Created):**
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "portfolio_id": 1,
  "portfolio_name": "East Coast Portfolio",
  "status": "pending",
  "created_at": "2024-01-01T14:00:00Z",
  "message": "Forecast job created for portfolio \"East Coast Portfolio\""
}
```

#### Get Job Status
```http
GET /api/forecasts/jobs/{job_id}/status/
```

**Response:**
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "portfolio_id": 1,
  "portfolio_name": "East Coast Portfolio",
  "status": "completed",
  "forecast_horizon": 24,
  "created_at": "2024-01-01T14:00:00Z",
  "completed_at": "2024-01-01T14:05:00Z",
  "sites_processed": 5,
  "total_results": 120
}
```

#### Get Portfolio Forecast Results
```http
GET /api/forecasts/portfolio/{portfolio_id}/results/
```

**Query Parameters:**
- `job_id` (optional): Specific job ID (uses latest if not provided)

**Response:**
```json
{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "portfolio": {
    "id": 1,
    "name": "East Coast Portfolio"
  },
  "forecast_horizon": 24,
  "total_sites": 2,
  "aggregated_forecast": [
    {
      "datetime": "2024-01-01T15:00:00Z",
      "total_generation_mwh": 45.250,
      "site_count": 2
    }
  ],
  "site_forecasts": [
    {
      "site_id": 1,
      "site_name": "Solar Farm Alpha",
      "forecasts": [
        {
          "datetime": "2024-01-01T15:00:00Z",
          "predicted_generation_mwh": "25.125",
          "confidence_interval_lower": "20.100",
          "confidence_interval_upper": "30.150"
        }
      ]
    }
  ]
}
```

#### Get Site Forecast Results
```http
GET /api/forecasts/site/{site_id}/results/
```

#### Cancel Forecast Job
```http
POST /api/forecasts/jobs/{job_id}/cancel/
```

### Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

### Rate Limiting

Currently no rate limiting is implemented. For production, consider implementing rate limiting based on your requirements.

## User Guide

### Getting Started

1. **Access the Application**
   - Open your browser and navigate to `http://localhost:3000`
   - You'll see the main dashboard with an interactive map

2. **Navigation**
   - Use the navigation menu to switch between different sections:
     - **Dashboard**: Overview and main map interface
     - **Sites**: Manage renewable energy sites
     - **Portfolios**: Create and manage site portfolios
     - **Forecasts**: View and manage forecasting results

### Managing Sites

#### Adding a New Site

1. **Using the Map Interface:**
   - Navigate to the Dashboard or Sites page
   - Click on any location on the map where you want to add a site
   - A popup form will appear
   - Fill in the required information:
     - **Name**: Descriptive name for the site
     - **Type**: Select either "Solar" or "Wind"
     - **Capacity**: Optional capacity in megawatts
   - Click "Add Site" to save

2. **Using the Site Form:**
   - Go to the Sites page
   - Click "Add New Site"
   - Fill in all required fields including coordinates
   - Click "Save"

#### Editing Sites

1. Click on a site marker on the map, or
2. Go to the Sites page and click "Edit" next to a site
3. Modify the information in the form
4. Click "Save Changes"

#### Deleting Sites

1. Click on a site marker and select "Delete", or
2. Go to the Sites page and click "Delete" next to a site
3. Confirm the deletion in the popup dialog

**Note**: Sites that are part of portfolios must be removed from portfolios before deletion.

### Managing Portfolios

#### Creating a Portfolio

1. Navigate to the Portfolios page
2. Click "Create New Portfolio"
3. Enter a name and optional description
4. Select sites to include in the portfolio
5. Click "Create Portfolio"

#### Adding Sites to Portfolios

1. Open an existing portfolio
2. Click "Add Sites"
3. Select sites from the available list
4. Click "Add Selected Sites"

#### Removing Sites from Portfolios

1. Open the portfolio
2. Find the site you want to remove
3. Click "Remove" next to the site
4. Confirm the removal

### Running Forecasts

#### Triggering a Forecast

1. Navigate to the Forecasts page
2. Select a portfolio from the dropdown
3. Optionally set the forecast horizon (default: 24 hours)
4. Click "Run Forecast"
5. The system will create a forecast job and show the job ID

#### Monitoring Forecast Progress

1. After triggering a forecast, you'll see the job status
2. The status will update automatically:
   - **Pending**: Job is queued
   - **Running**: Forecast is being generated
   - **Completed**: Forecast is ready
   - **Failed**: An error occurred

#### Viewing Forecast Results

1. Once a forecast is completed, click "View Results"
2. You'll see:
   - **Aggregated Portfolio Forecast**: Total predicted generation
   - **Individual Site Forecasts**: Breakdown by site
   - **Charts**: Visual representation of the forecast data
   - **Confidence Intervals**: Upper and lower bounds (if available)

### Tips and Best Practices

1. **Site Placement**: Ensure sites are placed at realistic locations with proper coordinates
2. **Portfolio Organization**: Group sites logically (e.g., by region, type, or project)
3. **Forecast Timing**: Allow sufficient time for forecast jobs to complete
4. **Data Validation**: Double-check site information before saving
5. **Regular Monitoring**: Check forecast job status if they seem to be taking too long

## Testing

### Backend Testing

The Django backend includes comprehensive test coverage:

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test forecasting

# Run with coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

### Frontend Testing

The React frontend uses Jest and React Testing Library:

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- SiteManager.test.tsx
```

### Integration Testing

End-to-end tests can be run using the integration test files:

```bash
# Backend integration tests
python manage.py test forecasting.test_integration

# Frontend integration tests
cd frontend && npm test -- integration.test.tsx
```

### Test Data

Use the demo command to create test data:

```bash
python manage.py demo_forecast
```

This creates:
- Sample sites (solar and wind)
- A sample portfolio
- Sample forecast jobs and results

## Troubleshooting

### Common Issues

#### Backend Issues

**Issue**: `ModuleNotFoundError: No module named 'rest_framework'`
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

**Issue**: `django.db.utils.OperationalError: no such table`
```bash
# Solution: Run migrations
python manage.py migrate
```

**Issue**: `CORS error when accessing API from frontend`
```bash
# Solution: Check CORS_ALLOWED_ORIGINS in .env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Issue**: `Secret key not set`
```bash
# Solution: Set SECRET_KEY in .env
SECRET_KEY=your-secret-key-here
```

#### Frontend Issues

**Issue**: `npm ERR! peer dep missing`
```bash
# Solution: Install dependencies
npm install
```

**Issue**: `API calls failing with network error`
```bash
# Solution: Check REACT_APP_API_BASE_URL in frontend/.env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

**Issue**: `Map not loading`
```bash
# Solution: Check internet connection for OpenStreetMap tiles
# Or configure alternative tile server
```

#### Docker Issues

**Issue**: `docker-compose command not found`
```bash
# Solution: Install Docker Compose
# On macOS: brew install docker-compose
# On Ubuntu: sudo apt-get install docker-compose
```

**Issue**: `Port already in use`
```bash
# Solution: Stop conflicting services or change ports
docker-compose down
# Or modify ports in docker-compose.yml
```

**Issue**: `Database connection refused`
```bash
# Solution: Ensure database service is running
docker-compose up db
# Wait for database to be ready, then start other services
```

### Performance Issues

**Issue**: Slow API responses
- Check database indexes
- Monitor query performance with Django Debug Toolbar
- Consider database optimization

**Issue**: Frontend loading slowly
- Check network requests in browser dev tools
- Optimize bundle size with webpack-bundle-analyzer
- Implement code splitting

### Debugging Tips

1. **Enable Debug Mode**: Set `DEBUG=True` in `.env` for detailed error messages
2. **Check Logs**: 
   ```bash
   # Django logs
   python manage.py runserver --verbosity=2
   
   # Docker logs
   docker-compose logs -f backend
   ```
3. **Use Browser Dev Tools**: Check Network tab for API call issues
4. **Database Inspection**:
   ```bash
   python manage.py shell
   >>> from forecasting.models import Site
   >>> Site.objects.all()
   ```

### Getting Help

1. **Check the logs** for detailed error messages
2. **Review the API documentation** for correct request formats
3. **Verify environment variables** are set correctly
4. **Check network connectivity** between frontend and backend
5. **Ensure all services are running** (database, backend, frontend)

If issues persist:
1. Check the GitHub issues page
2. Review the design and requirements documents in `.kiro/specs/`
3. Contact the development team

## Production Deployment

### Environment Configuration

1. **Backend Environment Variables**:
   ```env
   SECRET_KEY=your-production-secret-key
   DEBUG=False
   ALLOWED_HOSTS=your-domain.com,www.your-domain.com
   CORS_ALLOWED_ORIGINS=https://your-domain.com
   
   # Database (PostgreSQL recommended)
   DB_ENGINE=postgresql
   DB_NAME=renewable_forecasting
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=your_db_host
   DB_PORT=5432
   ```

2. **Frontend Environment Variables**:
   ```env
   REACT_APP_API_BASE_URL=https://your-domain.com/api
   ```

### Database Setup

1. **PostgreSQL Configuration**:
   ```bash
   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   
   # Create database and user
   sudo -u postgres psql
   CREATE DATABASE renewable_forecasting;
   CREATE USER your_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE renewable_forecasting TO your_user;
   ```

2. **Run Migrations**:
   ```bash
   python manage.py migrate
   python manage.py collectstatic
   ```

### Deployment Options

#### Option 1: Traditional Server Deployment

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   pip install gunicorn psycopg2-binary
   ```

2. **Configure Gunicorn**:
   ```bash
   gunicorn renewable_forecasting.wsgi:application --bind 0.0.0.0:8000
   ```

3. **Configure Nginx**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location /api/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location / {
           root /path/to/frontend/build;
           try_files $uri $uri/ /index.html;
       }
   }
   ```

#### Option 2: Docker Deployment

1. **Production Docker Compose**:
   ```yaml
   version: '3.8'
   services:
     db:
       image: postgres:13
       environment:
         POSTGRES_DB: renewable_forecasting
         POSTGRES_USER: your_user
         POSTGRES_PASSWORD: your_password
       volumes:
         - postgres_data:/var/lib/postgresql/data
     
     backend:
       build: .
       environment:
         - DEBUG=False
         - DB_ENGINE=postgresql
       depends_on:
         - db
       ports:
         - "8000:8000"
     
     frontend:
       build: ./frontend
       ports:
         - "80:80"
   
   volumes:
     postgres_data:
   ```

#### Option 3: Cloud Deployment

**AWS/Heroku/DigitalOcean**: Follow platform-specific deployment guides.

### Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Secret Management**: Use environment variables or secret management services
3. **Database Security**: Restrict database access and use strong passwords
4. **CORS**: Configure CORS properly for your domain
5. **Rate Limiting**: Implement API rate limiting
6. **Authentication**: Consider implementing JWT or OAuth for API access

### Monitoring and Maintenance

1. **Logging**: Configure proper logging for production
2. **Monitoring**: Set up application and infrastructure monitoring
3. **Backups**: Regular database backups
4. **Updates**: Keep dependencies updated for security patches

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/new-feature`
3. **Make changes and add tests**
4. **Run tests**: `python manage.py test && cd frontend && npm test`
5. **Commit changes**: `git commit -m "Add new feature"`
6. **Push to branch**: `git push origin feature/new-feature`
7. **Create Pull Request**

### Code Standards

- **Python**: Follow PEP 8 style guide
- **JavaScript/TypeScript**: Use ESLint and Prettier configurations
- **Documentation**: Update documentation for new features
- **Testing**: Maintain test coverage above 80%

### Project Structure Guidelines

- **Backend**: Follow Django best practices
- **Frontend**: Use functional components with hooks
- **API**: RESTful design principles
- **Database**: Proper normalization and indexing

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation
- Check existing GitHub issues
- Contact the development team

---

*Last updated: January 2024*