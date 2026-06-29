import React from 'react';
import { LOGO_BLACK_PATH } from '../../config/brand';

type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface BrandLogoProps {
  size?: BrandLogoSize;
  /** black = light surfaces, white = inverted for dark surfaces, auto = follow color scheme */
  variant?: 'black' | 'white' | 'auto';
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
 * Circular brand mark — logo.png on light surfaces, color-inverted on dark surfaces.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'black',
  className = '',
  alt = '',
}) => {
  const wrapperClass = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClasses[size]} ${className}`;
  const imgClass = 'block h-full w-full object-cover';

  if (variant === 'auto') {
    return (
      <span className={wrapperClass} aria-hidden={!alt}>
        <img src={LOGO_BLACK_PATH} alt={alt} className={`${imgClass} dark:hidden`} />
        <img
          src={LOGO_BLACK_PATH}
          alt={alt}
          className={`${imgClass} invert hidden dark:block`}
        />
      </span>
    );
  }

  const invert = variant === 'white';

  return (
    <span className={wrapperClass} aria-hidden={!alt}>
      <img
        src={LOGO_BLACK_PATH}
        alt={alt}
        className={`${imgClass}${invert ? ' invert' : ''}`}
      />
    </span>
  );
};

export default BrandLogo;
