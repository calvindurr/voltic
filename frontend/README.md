# Renewable Energy Forecasting Frontend

This is the React TypeScript frontend for the renewable energy forecasting application.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout/         # Layout components (Navigation, Layout)
├── pages/              # Page components (Dashboard, Sites, Portfolios, Forecasts)
├── services/           # API service classes
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## Features

- **React Router**: Client-side routing with nested routes
- **TypeScript**: Full type safety throughout the application
- **API Client**: Axios-based API client with error handling and interceptors
- **Service Layer**: Organized API services for Sites, Portfolios, and Forecasts
- **Custom Hooks**: Reusable hooks for API calls and state management
- **Responsive Design**: Mobile-friendly layout and navigation

## Dependencies

- **React 18+**: Core framework
- **React Router DOM**: Client-side routing
- **Axios**: HTTP client for API calls
- **Leaflet & React-Leaflet**: Interactive maps (ready for implementation)
- **Chart.js & React-ChartJS-2**: Data visualization (ready for implementation)
- **TypeScript**: Type safety

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

3. Update the API base URL in `.env` if needed:
   ```
   REACT_APP_API_BASE_URL=http://localhost:8000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## API Configuration

The application is configured to connect to the Django backend API. The base URL can be configured via the `REACT_APP_API_BASE_URL` environment variable.

## Next Steps

This setup provides the foundation for implementing:
- Interactive map components with Leaflet
- Site management forms and interfaces
- Portfolio management functionality
- Forecast visualization dashboards

Each page component is ready to be enhanced with the specific functionality as outlined in the implementation plan.