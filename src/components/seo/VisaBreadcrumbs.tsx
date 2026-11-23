import React from 'react';
import { Link } from 'react-router-dom';
import { getVisaProductPath } from '../../config/visaSlugs';

interface VisaBreadcrumbsProps {
  countryCode: string;
  countryName: string;
}

const VisaBreadcrumbs: React.FC<VisaBreadcrumbsProps> = ({ countryCode, countryName }) => (
  <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600 dark:text-gray-400">
    <ol className="flex flex-wrap items-center gap-1">
      <li>
        <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400">
          Home
        </Link>
      </li>
      <li aria-hidden="true">/</li>
      <li>
        <Link to="/visa/browse" className="hover:text-primary-600 dark:hover:text-primary-400">
          eVisa Destinations
        </Link>
      </li>
      <li aria-hidden="true">/</li>
      <li className="font-medium text-gray-900 dark:text-gray-100">
        <Link
          to={getVisaProductPath(countryCode)}
          className="hover:text-primary-600 dark:hover:text-primary-400"
          aria-current="page"
        >
          {countryName} eVisa
        </Link>
      </li>
    </ol>
  </nav>
);

export default VisaBreadcrumbs;
