import React from 'react';
import { useNavigate } from 'react-router-dom';
import VisaRequirementsMap from '../components/Dashboard/SimpleWorldMap';
import { useMapLoader } from '../hooks/useMapLoader';

interface WorldMapProps {
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

const WorldMap: React.FC<WorldMapProps> = () => {
  const navigate = useNavigate();
  const { isLoaded: isMapLibraryLoaded, hasError: mapLibraryHasError } = useMapLoader();

  const handleCountrySelect = (countryCode: string) => {
    navigate(`/map/passport/${countryCode.toLowerCase()}`);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">World Travel Map</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Click any country to explore where its passport holders can travel. Destinations link to your personal visa requirements.
        </p>
      </div>

      {isMapLibraryLoaded ? (
        <VisaRequirementsMap navigateToHubOnClick onCountrySelect={handleCountrySelect} />
      ) : mapLibraryHasError ? (
        <div className="p-8 text-center text-red-600">Error loading map. Please refresh.</div>
      ) : (
        <div className="p-8 text-center text-gray-500">Loading map...</div>
      )}
    </div>
  );
};

export default WorldMap;
