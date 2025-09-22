# Renewable Energy Forecasting API Documentation

## Overview

This document provides comprehensive documentation for the Renewable Energy Forecasting API. The API follows REST principles and provides endpoints for managing renewable energy sites, portfolios, and forecasting operations.

## Base Information

- **Base URL**: `http://localhost:8000/api/` (development)
- **Authentication**: Session-based (extensible to JWT)
- **Content Type**: `application/json`
- **API Version**: v1

## Authentication

Currently using Django's session authentication. Include session cookies with requests or use the browsable API for testing.

### Future Authentication (Recommended for Production)
```http
Authorization: Bearer <jwt_token>
```

## Response Format

### Success Response
```json
{
  "id": 1,
  "field": "value",
  "nested_object": {
    "field": "value"
  }
}
```

### Error Response
```json
{
  "error": "Error Type",
  "details": "Detailed error message",
  "field_errors": {
    "field_name": ["Field-specific error message"]
  }
}
```

### Paginated Response
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/sites/?page=2",
  "previous": null,
  "results": [...]
}
```

## Sites API

### Site Model
```json
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
```

### List Sites
```http
GET /api/sites/
```

**Query Parameters:**
- `site_type` (string, optional): Filter by site type (`solar` or `wind`)
- `page` (integer, optional): Page number for pagination

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/sites/?site_type=solar&page=1"
```

**Example Response (200 OK):**
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
    },
    {
      "id": 2,
      "name": "Solar Farm Beta",
      "site_type": "solar",
      "latitude": "41.123456",
      "longitude": "-75.123456",
      "capacity_mw": "150.75",
      "created_at": "2024-01-01T13:00:00Z",
      "updated_at": "2024-01-01T13:00:00Z"
    }
  ]
}
```

### Create Site
```http
POST /api/sites/
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Wind Farm Gamma",
  "site_type": "wind",
  "latitude": "42.123456",
  "longitude": "-76.123456",
  "capacity_mw": "200.00"
}
```

**Field Validation:**
- `name`: Required, max 200 characters
- `site_type`: Required, must be "solar" or "wind"
- `latitude`: Required, decimal between -90 and 90
- `longitude`: Required, decimal between -180 and 180
- `capacity_mw`: Optional, positive decimal

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/sites/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wind Farm Gamma",
    "site_type": "wind",
    "latitude": "42.123456",
    "longitude": "-76.123456",
    "capacity_mw": "200.00"
  }'
```

**Example Response (201 Created):**
```json
{
  "id": 3,
  "name": "Wind Farm Gamma",
  "site_type": "wind",
  "latitude": "42.123456",
  "longitude": "-76.123456",
  "capacity_mw": "200.00",
  "created_at": "2024-01-01T14:00:00Z",
  "updated_at": "2024-01-01T14:00:00Z"
}
```

**Error Response (409 Conflict - Duplicate Coordinates):**
```json
{
  "error": "Site too close to existing site",
  "details": "A site already exists within 11 meters of these coordinates",
  "conflicting_sites": [
    {
      "id": 1,
      "name": "Existing Site",
      "latitude": "42.123456",
      "longitude": "-76.123456"
    }
  ]
}
```

### Get Site
```http
GET /api/sites/{id}/
```

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/sites/1/"
```

**Example Response (200 OK):**
```json
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
```

### Update Site
```http
PUT /api/sites/{id}/
Content-Type: application/json
```

**Request Body (Full Update):**
```json
{
  "name": "Updated Solar Farm Alpha",
  "site_type": "solar",
  "latitude": "40.123456",
  "longitude": "-74.123456",
  "capacity_mw": "120.00"
}
```

**Partial Update:**
```http
PATCH /api/sites/{id}/
Content-Type: application/json
```

```json
{
  "capacity_mw": "120.00"
}
```

### Delete Site
```http
DELETE /api/sites/{id}/
```

**Example Request:**
```bash
curl -X DELETE "http://localhost:8000/api/sites/1/"
```

**Success Response (204 No Content)**

**Error Response (409 Conflict - Site in Portfolio):**
```json
{
  "error": "Cannot delete site",
  "details": "Site is part of 2 portfolio(s). Remove from portfolios first.",
  "portfolios": ["East Coast Portfolio", "Main Portfolio"]
}
```

## Portfolios API

### Portfolio Model
```json
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
      "longitude": "-74.123456",
      "capacity_mw": "100.50"
    }
  ],
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### List Portfolios
```http
GET /api/portfolios/
```

**Example Response (200 OK):**
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
          "longitude": "-74.123456",
          "capacity_mw": "100.50"
        }
      ],
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Create Portfolio
```http
POST /api/portfolios/
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "West Coast Portfolio",
  "description": "Renewable sites on the west coast",
  "site_ids": [1, 2, 3]
}
```

**Field Validation:**
- `name`: Required, max 200 characters
- `description`: Optional, text field
- `site_ids`: Optional, array of valid site IDs

### Add Site to Portfolio
```http
POST /api/portfolios/{id}/add_site/
Content-Type: application/json
```

**Request Body:**
```json
{
  "site_id": 3
}
```

**Example Response (200 OK):**
```json
{
  "message": "Site \"Wind Farm Gamma\" added to portfolio \"East Coast Portfolio\""
}
```

### Remove Site from Portfolio
```http
DELETE /api/portfolios/{id}/remove_site/
Content-Type: application/json
```

**Request Body:**
```json
{
  "site_id": 3
}
```

### Get Portfolio Sites
```http
GET /api/portfolios/{id}/sites/
```

**Example Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Solar Farm Alpha",
    "site_type": "solar",
    "latitude": "40.123456",
    "longitude": "-74.123456",
    "capacity_mw": "100.50"
  }
]
```

## Forecasting API

### Forecast Job Model
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

### Trigger Portfolio Forecast
```http
POST /api/forecasts/portfolio/{portfolio_id}/trigger/
Content-Type: application/json
```

**Request Body (Optional):**
```json
{
  "forecast_horizon": 48
}
```

**Parameters:**
- `forecast_horizon`: Optional integer, number of hours to forecast (default: 24)

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/forecasts/portfolio/1/trigger/" \
  -H "Content-Type: application/json" \
  -d '{"forecast_horizon": 48}'
```

**Example Response (201 Created):**
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

**Error Response (400 Bad Request - Empty Portfolio):**
```json
{
  "error": "Empty portfolio",
  "details": "Portfolio must contain at least one site to run forecasts"
}
```

### Get Job Status
```http
GET /api/forecasts/jobs/{job_id}/status/
```

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/forecasts/jobs/123e4567-e89b-12d3-a456-426614174000/status/"
```

**Example Response (200 OK):**
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

**Job Status Values:**
- `pending`: Job is queued for processing
- `running`: Job is currently being processed
- `completed`: Job finished successfully
- `failed`: Job encountered an error

### Get Portfolio Forecast Results
```http
GET /api/forecasts/portfolio/{portfolio_id}/results/
```

**Query Parameters:**
- `job_id` (UUID, optional): Specific job ID to get results for (uses latest if not provided)

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/forecasts/portfolio/1/results/?job_id=123e4567-e89b-12d3-a456-426614174000"
```

**Example Response (200 OK):**
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
    },
    {
      "datetime": "2024-01-01T16:00:00Z",
      "total_generation_mwh": 52.125,
      "site_count": 2
    }
  ],
  "site_forecasts": [
    {
      "site_id": 1,
      "site_name": "Solar Farm Alpha",
      "site_type": "solar",
      "forecasts": [
        {
          "datetime": "2024-01-01T15:00:00Z",
          "predicted_generation_mwh": "25.125",
          "confidence_interval_lower": "20.100",
          "confidence_interval_upper": "30.150"
        },
        {
          "datetime": "2024-01-01T16:00:00Z",
          "predicted_generation_mwh": "28.750",
          "confidence_interval_lower": "23.000",
          "confidence_interval_upper": "34.500"
        }
      ]
    },
    {
      "site_id": 2,
      "site_name": "Wind Farm Beta",
      "site_type": "wind",
      "forecasts": [
        {
          "datetime": "2024-01-01T15:00:00Z",
          "predicted_generation_mwh": "20.125",
          "confidence_interval_lower": "15.100",
          "confidence_interval_upper": "25.150"
        }
      ]
    }
  ]
}
```

### Get Site Forecast Results
```http
GET /api/forecasts/site/{site_id}/results/
```

**Query Parameters:**
- `job_id` (UUID, optional): Specific job ID to get results for

**Example Response (200 OK):**
```json
{
  "site": {
    "id": 1,
    "name": "Solar Farm Alpha",
    "site_type": "solar"
  },
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "forecast_horizon": 24,
  "forecasts": [
    {
      "datetime": "2024-01-01T15:00:00Z",
      "predicted_generation_mwh": "25.125",
      "confidence_interval_lower": "20.100",
      "confidence_interval_upper": "30.150"
    }
  ]
}
```

### Cancel Forecast Job
```http
POST /api/forecasts/jobs/{job_id}/cancel/
```

**Example Response (200 OK):**
```json
{
  "message": "Forecast job 123e4567-e89b-12d3-a456-426614174000 has been cancelled"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Cannot cancel job",
  "details": "Job is not in a cancellable state (pending or running)"
}
```

## Error Handling

### HTTP Status Codes

| Status Code | Description | When Used |
|-------------|-------------|-----------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid request data or parameters |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate coordinates, etc.) |
| 500 | Internal Server Error | Unexpected server errors |

### Common Error Responses

#### Validation Error (400)
```json
{
  "error": "Validation failed",
  "field_errors": {
    "latitude": ["This field is required"],
    "site_type": ["Invalid choice. Must be 'solar' or 'wind'"]
  }
}
```

#### Not Found Error (404)
```json
{
  "error": "Site not found",
  "details": "No site found with ID 999"
}
```

#### Conflict Error (409)
```json
{
  "error": "Duplicate coordinates",
  "details": "A site already exists at these exact coordinates"
}
```

## Rate Limiting

Currently no rate limiting is implemented. For production deployment, consider implementing rate limiting based on your requirements.

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

Example:
```http
GET /api/sites/?page=2&page_size=10
```

## Filtering and Searching

### Sites
- `site_type`: Filter by site type (`solar` or `wind`)

Future enhancements may include:
- Geographic bounding box filtering
- Capacity range filtering
- Text search by name

## API Versioning

Currently using implicit v1. Future versions will use URL versioning:
- `/api/v1/sites/`
- `/api/v2/sites/`

## Testing the API

### Using curl

```bash
# Health check
curl -X GET "http://localhost:8000/api/health/"

# List sites
curl -X GET "http://localhost:8000/api/sites/"

# Create site
curl -X POST "http://localhost:8000/api/sites/" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Site", "site_type": "solar", "latitude": "40.0", "longitude": "-74.0"}'

# Trigger forecast
curl -X POST "http://localhost:8000/api/forecasts/portfolio/1/trigger/" \
  -H "Content-Type: application/json" \
  -d '{"forecast_horizon": 24}'
```

### Using the Browsable API

Navigate to `http://localhost:8000/api/` in your browser to use Django REST Framework's browsable API interface.

### Using Postman

Import the following collection for testing:

```json
{
  "info": {
    "name": "Renewable Energy Forecasting API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/health/",
          "host": ["{{base_url}}"],
          "path": ["health", ""]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000/api"
    }
  ]
}
```

## SDK and Client Libraries

Currently no official SDKs are available. Consider creating client libraries for:
- Python
- JavaScript/TypeScript
- Java
- C#

## Webhooks (Future Enhancement)

Future versions may support webhooks for:
- Forecast job completion
- Site updates
- Portfolio changes

## API Changelog

### v1.0.0 (Current)
- Initial API release
- Sites CRUD operations
- Portfolios management
- Forecasting operations
- Job status tracking

---

For more information, see the main [README.md](README.md) file.