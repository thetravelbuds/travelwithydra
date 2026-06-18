import React from 'react';
import { DEFAULT_LOGO_PATH } from '../../config/brand';

type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface BrandLogoProps {
  size?: BrandLogoSize;
  /** Invert colors — use on dark or colored backgrounds */
  inverted?: boolean;
  /** Auto-invert when OS dark mode is active */
  adaptToDarkMode?: boolean;
  className?: string;
  alt?: string;
}

const sizeClasses: Record<BrandLogoSize, string> = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
};

/**
 * Brand mark with circular crop and optional inversion for dark surfaces.
 * Prefers transparent asset when available.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  inverted = false,
  adaptToDarkMode = false,
  className = '',
  alt = '',
}) => {
  const filterClass = inverted
    ? 'brightness-0 invert'
    : adaptToDarkMode
      ? 'dark:brightness-0 dark:invert'
      : '';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full overflow-hidden ${sizeClasses[size]} ${filterClass} ${className}`}
      aria-hidden={!alt}
    >
      <img
        src="/logo-transparent.png"
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_LOGO_PATH;
        }}
        alt={alt}
        className="h-full w-full object-contain"
      />
    </span>
  );
};

export default BrandLogo;
