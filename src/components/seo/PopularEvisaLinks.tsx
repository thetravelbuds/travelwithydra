import React from 'react';
import { Link } from 'react-router-dom';
import { PRIORITY_EVISA_DESTINATIONS } from '../../config/seo';
import { getVisaProductPath } from '../../config/visaSlugs';

interface PopularEvisaLinksProps {
  title?: string;
  className?: string;
  compact?: boolean;
}

const PopularEvisaLinks: React.FC<PopularEvisaLinksProps> = ({
  title = 'Popular eVisa destinations',
  className = '',
  compact = false,
}) => (
  <section className={className} aria-labelledby="popular-evisa-heading">
    <h2
      id="popular-evisa-heading"
      className={
        compact
          ? 'text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3'
          : 'text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2'
      }
    >
      {title}
    </h2>
    {!compact && (
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl">
        Apply online for the most searched eVisa destinations. Fast processing, clear fees, and guided
        applications with Hydra.
      </p>
    )}
    <ul
      className={
        compact
          ? 'space-y-2'
          : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
      }
    >
      {PRIORITY_EVISA_DESTINATIONS.map((dest) => (
        <li key={dest.code}>
          <Link
            to={getVisaProductPath(dest.code)}
            className={
              compact
                ? 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors text-sm'
                : 'block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-semibold text-primary-700 dark:text-primary-400 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-colors'
            }
          >
            {dest.anchor}
          </Link>
        </li>
      ))}
    </ul>
    {!compact && (
      <p className="mt-6">
        <Link
          to="/visa/browse"
          className="text-primary-600 dark:text-primary-400 font-semibold hover:underline"
        >
          Browse all eVisa destinations →
        </Link>
      </p>
    )}
  </section>
);

export default PopularEvisaLinks;
