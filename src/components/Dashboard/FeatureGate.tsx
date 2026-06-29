import React from 'react';
import { Link } from 'react-router-dom';
import {
  getMinimumTierForFeature,
  hasSubscriptionFeature,
  type SubscriptionFeature,
} from '../../config/subscriptionFeatures';

interface FeatureGateProps {
  feature: SubscriptionFeature;
  subscriptionTier?: string | null;
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  subscriptionTier,
  children,
  title,
  description,
}) => {
  if (hasSubscriptionFeature(subscriptionTier, feature)) {
    return <>{children}</>;
  }

  const requiredTier = getMinimumTierForFeature(feature);
  const tierLabel = requiredTier === 'enterprise' ? 'Enterprise' : 'Premium';

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-900/20">
      <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
        {title || `${tierLabel} feature`}
      </h3>
      <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
        {description ||
          `Upgrade to ${tierLabel} to unlock this feature and get the most from Hydra.`}
      </p>
      <Link
        to="/pricing"
        className="mt-4 inline-flex rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        View plans
      </Link>
    </div>
  );
};

export default FeatureGate;
