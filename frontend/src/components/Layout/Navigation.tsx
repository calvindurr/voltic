import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/sites', label: 'Sites' },
    { path: '/portfolios', label: 'Portfolios' },
    { path: '/forecasts', label: 'Forecasts' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h2>Renewable Forecasting</h2>
      </div>
      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;