import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';
import Header from '../components/layout/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateTravelScore, getTravelScoreLevel, getScoreBreakdown, getRecommendationLikelihood } from '../utils/travelScore';
import { isPakistanUkFacilitationProfile, PAKISTAN_UK_FACILITATION } from '../data/residenceFacilitation';
import { canApplyOnlineForDestination, isSchengenCountry } from '../utils/schengenCountries';
import VisaRequirementsMap from '../components/Dashboard/SimpleWorldMap'; // Use the renamed map component
import CountryDetailsModal from '../components/Dashboard/CountryDetailsModal';
import { VisaRequirement } from '../types/visa'; // Import from visa.ts
import { getCountryName } from '../data/countryCodes';
import SavedCountries from '../components/Dashboard/SavedCountries';
import useMapLoader from '../hooks/useMapLoader';
import userProfileService, {
  UserProfile,
  normalizeSubscriptionTier,
  SubscriptionDetails,
} from '../lib/api/userProfile';
import documentService from '../lib/api/documentService';
import authService from '../lib/api/auth';
import visaApplicationsService from '../lib/api/visaApplications';
import tripsService from '../lib/api/tripsService';
import CountrySelect from '../components/CountrySelect';
import VisaApplications from '../components/Dashboard/VisaApplications';
import VisaApplicationProgressSteps from '../components/Dashboard/VisaApplicationProgressSteps';
import { VisaApplication } from '../types/visa';
import { isIncompleteDraft, getVisaApplicationProgressLabel } from '../utils/visaApplicationProgress';
import { visaRequirementsService } from '../services/visaRequirementsService';
import type { PassportMobilityStats } from '../services/visaCsvData';
import {
  getFlagUrl,
  getAlternativeFlagUrl,
  getFlagEmoji,
  resolveCountryFlagCode,
} from '../utils/countries';

const CountryFlagImage: React.FC<{ countryValue: string; alt: string }> = ({ countryValue, alt }) => {
  const [fallbackStage, setFallbackStage] = React.useState(0);
  const code = resolveCountryFlagCode(countryValue);

  if (!code) {
    return (
      <div className="w-8 h-6 mr-2 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-500">
        —
      </div>
    );
  }

  if (fallbackStage >= 2) {
    return (
      <div className="w-8 h-6 mr-2 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium">
        {getFlagEmoji(code) || code.toUpperCase()}
      </div>
    );
  }

  const src = fallbackStage === 0 ? getFlagUrl(code, 80) : getAlternativeFlagUrl(code);

  return (
    <div className="w-8 h-6 mr-2 overflow-hidden rounded shadow">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setFallbackStage((stage) => stage + 1)}
      />
    </div>
  );
};

interface DashboardProps {
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
  initialTab?: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  subscription_tier: string;
  nationality: string;
  residency: string;
  travel_history: string[];
  saved_countries: string[];
  travel_score: number;
  recent_checks: {
    country: string;
    date: string;
    result: string;
  }[];
  saved_documents: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploaded: string;
    size?: number;
    category?: string;
  }[];
  upcoming_trips: {
    id: string;
    destination: string;
    departure_date: string;
    return_date: string;
    dates?: string;
    status?: string;
    documents?: {
      id: string;
      name: string;
      type: string;
      uploaded: string;
    }[];
  }[];
}

// Update the UserProfile interface to match the data we're using
interface ExtendedUserProfile extends UserProfile {
  travel_history?: string[];
  saved_countries?: string[];
  saved_documents?: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploaded: string;
    size?: number;
    category?: string;
  }[];
}

// Mock passport strength data (0-500 scale, will be normalized to 0-600 for display)
const mockPassportStrengthData: Record<string, { strength: number }> = {
  'GB': { strength: 380 }, // United Kingdom
  'US': { strength: 375 }, // United States
  'DE': { strength: 385 }, // Germany
  'JP': { strength: 370 }, // Japan
  'CA': { strength: 375 }, // Canada
  'AU': { strength: 370 }, // Australia
  'FR': { strength: 385 }, // France
  'IT': { strength: 380 }, // Italy
  'ES': { strength: 375 }, // Spain
  'NL': { strength: 380 }, // Netherlands
  'SE': { strength: 380 }, // Sweden
  'SG': { strength: 370 }, // Singapore
  'CH': { strength: 385 }, // Switzerland
  'AT': { strength: 380 }, // Austria
  'NO': { strength: 380 }, // Norway
  'NZ': { strength: 370 }, // New Zealand
  'PT': { strength: 375 }, // Portugal
  'DK': { strength: 380 }, // Denmark
  'FI': { strength: 380 }, // Finland
  'LU': { strength: 380 }, // Luxembourg
  'BE': { strength: 380 }, // Belgium
  'IE': { strength: 375 }, // Ireland
  'IS': { strength: 375 }, // Iceland
  'KR': { strength: 365 }, // South Korea
  'MY': { strength: 350 }, // Malaysia
  'AE': { strength: 345 }, // United Arab Emirates
  'HK': { strength: 360 }, // Hong Kong
  'CL': { strength: 340 }, // Chile
  'AR': { strength: 335 }, // Argentina
  'BR': { strength: 330 }, // Brazil
  'MX': { strength: 325 }, // Mexico
  'ZA': { strength: 320 }, // South Africa
  'TH': { strength: 315 }, // Thailand
  'CN': { strength: 310 }, // China
  'IN': { strength: 300 }, // India
  'RU': { strength: 315 }, // Russia
  'TR': { strength: 310 }, // Turkey
  'EG': { strength: 290 }, // Egypt
  'NG': { strength: 280 }, // Nigeria
  'ID': { strength: 295 }, // Indonesia
  // Default value will be 350 for countries not in this list
};

// Define the structure of visa requirements data
interface VisaRequirementData {
  Passport: string;
  Destination: string;
  Requirement: string;
}

const POPULAR_DESTINATION_META: Record<string, { description: string; tags: string[] }> = {
  FR: { description: 'Apply for your Schengen visa to France with guided support from Hydra.', tags: ['Schengen', 'Culture'] },
  DE: { description: 'Schengen visa application support for Germany.', tags: ['Schengen', 'Business'] },
  IT: { description: 'Schengen visa application support for Italy.', tags: ['Schengen', 'Culture'] },
  ES: { description: 'Schengen visa application support for Spain.', tags: ['Schengen', 'Beaches'] },
  JP: { description: 'Explore ancient temples and modern cities', tags: ['Culture', 'Food'] },
  NZ: { description: 'Adventure in breathtaking landscapes', tags: ['Nature', 'Adventure'] },
  TH: { description: 'Relax on pristine beaches', tags: ['Beaches', 'Budget'] },
  PT: { description: 'Discover rich history and coastal beauty', tags: ['Culture', 'Wine'] },
  CR: { description: 'Experience breathtaking biodiversity', tags: ['Nature', 'Wildlife'] },
  ZA: { description: 'Wildlife safari and stunning landscapes', tags: ['Safari', 'Adventure'] },
  AU: { description: 'Discover iconic landmarks and vibrant cities', tags: ['Nature', 'Adventure'] },
  IN: { description: 'Experience rich culture and heritage', tags: ['Culture', 'Food'] },
  TR: { description: 'Fast online Turkish e-Visa — ideal for UK visa holders.', tags: ['eVisa', 'Middle East'] },
  AE: { description: 'UAE pre-arrival e-Visa using your UK visa credentials.', tags: ['eVisa', 'Middle East'] },
  MA: { description: 'Streamlined Morocco e-Visa online application.', tags: ['eVisa', 'Africa'] },
  EG: { description: 'Ancient wonders and Nile adventures', tags: ['History', 'Culture'] },
};

const parseEvisaRequirement = (requirement: string): 'e-visa' | 'eta' | null => {
  const reqType = requirement.toLowerCase().trim();
  if (reqType === 'eta' || reqType === 'esta') return 'eta';
  if (reqType === 'e-visa' || reqType === 'evisa' || reqType === 'electronic visa') return 'e-visa';
  return null;
};

const normalizeRequirementFromJson = (requirement: string): string => {
  const r = requirement.toLowerCase().trim();
  if (r === 'e-visa' || r === 'evisa' || r === 'electronic visa') return 'evisa';
  if (r === 'eta' || r === 'esta') return 'eta';
  if (r.includes('visa free') || r === 'visa-free') return 'visa-free';
  if (r.includes('on arrival')) return 'visa-on-arrival';
  if (r.includes('visa required')) return 'visa-required';
  return 'unknown';
};

const resolveNationalityCode = (nationality: string): string => {
  if (nationality.length === 2) return nationality.toLowerCase();
  return (visaRequirementsService.getCountryCodeFromName(nationality) || 'gb').toLowerCase();
};

const Dashboard: React.FC<DashboardProps> = ({ isLoggedIn = true, onLoginRequired, initialTab = 'overview' }) => {
  // State for the map loader
  const mapLoaderState = useMapLoader();
  const { isLoaded: isMapLibraryLoaded, hasError: mapLibraryHasError } = mapLoaderState;

  // State for controlling the active tab
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // State for user data and loading/error status
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for user nationality to pass to the map
  const [nationality, setNationality] = useState<string>('');

  // Add state for travel score and its breakdown
  const [travelScore, setTravelScore] = useState<number>(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<{
    passportComponent: number;
    mobilityComponent: number;
    historyComponent: number;
    residencyComponent: number;
  }>({ passportComponent: 0, mobilityComponent: 0, historyComponent: 0, residencyComponent: 0 });

  // State for controlling the upgrade banner visibility
  const [showUpgradeBanner, setShowUpgradeBanner] = useState<boolean>(true);

  // State for new trip form
  const [newTripDestination, setNewTripDestination] = useState<string>('');
  const [newTripDates, setNewTripDates] = useState<string>('');
  const [newTripStartDate, setNewTripStartDate] = useState<string>('');
  const [newTripEndDate, setNewTripEndDate] = useState<string>('');
  const [tripSaveError, setTripSaveError] = useState<string | null>(null);
  const [newDocumentName, setNewDocumentName] = useState<string>('');
  const [newDocumentType, setNewDocumentType] = useState<string>('PDF');
  const [selectedCountry, setSelectedCountry] = useState<{
    code: string;
    name: string;
    visaDetails: VisaRequirement;
  } | null>(null);
  const [showCountryModal, setShowCountryModal] = useState<boolean>(false);
  const [savedCountries, setSavedCountries] = useState<Array<{
    code: string;
    name: string;
    visaType: string;
  }>>([]);
  const navigate = useNavigate();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [tripDocumentName, setTripDocumentName] = useState<string>('');
  const [tripDocumentType, setTripDocumentType] = useState<string>('PDF');
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documentCategory, setDocumentCategory] = useState('General');
  const [recommendationDestinations, setRecommendationDestinations] = useState<Array<{
    name: string;
    code: string;
    description: string;
    serviceType: 'evisa' | 'eta' | 'schengen';
    likelihoodPercent: number;
    tags: string[];
  }>>([]);
  const [visaRequirements, setVisaRequirements] = useState<VisaRequirementData[]>([]);

  // State for editable settings
  const [editableName, setEditableName] = useState<string>('');
  const [editableFullName, setEditableFullName] = useState<string>('');
  const [editableNationality, setEditableNationality] = useState<string>('');
  const [editableResidency, setEditableResidency] = useState<string>('');
  const [editablePhoneNumber, setEditablePhoneNumber] = useState<string>('');
  const [editablePassportNumber, setEditablePassportNumber] = useState<string>('');
  const [editablePassportExpiry, setEditablePassportExpiry] = useState<string>('');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState<boolean>(false);
  
  // Correctly typed extended profile state
  const [currentProfile, setCurrentProfile] = useState<ExtendedUserProfile | null>(null);

  // State for visa applications
  const [visaApplications, setVisaApplications] = useState<VisaApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState<boolean>(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  // Effect to update editable fields when currentProfile changes
  useEffect(() => {
    if (currentProfile) {
        setEditableName(currentProfile.full_name || '');
        setEditableFullName(currentProfile.full_name || ''); // Also set FullName
        setEditableNationality(currentProfile.nationality || ''); // Also set Nationality
        setEditableResidency(currentProfile.residency || ''); // Also set Residency
        setEditablePhoneNumber(currentProfile.phone_number || '');
        setEditablePassportNumber(currentProfile.passport_number || '');
        setEditablePassportExpiry(currentProfile.passport_expiry || '');
    }
  }, [currentProfile]);

  // Update the loadUserData function
  const loadUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { profile, error: profileError } = await userProfileService.getCurrentUserProfile();

      console.log('Loaded User Profile in Dashboard:', profile); // Added log

      if (profileError) {
        // Check if it's just 'Profile not found' which might be okay for new users
        if (profileError.message.includes('Profile not found')) {
          console.warn("User profile not found in Supabase. User might need to complete profile setup.");
          // Handle appropriately, maybe set default values or guide user
          setUserData(null); // Or set a default structure
          setNationality(''); // Ensure nationality is empty/default
        } else {
          throw profileError; // Rethrow other errors
        }
      } else if (profile) {
        // Cast profile to ExtendedUserProfile to satisfy type checking
        const extendedProfile = profile as ExtendedUserProfile;

        setUserData({
          id: extendedProfile.id,
          name: extendedProfile.full_name || 'User',
          email: extendedProfile.email || '',
          subscription_tier: extendedProfile.subscription_tier || 'free',
          nationality: extendedProfile.nationality ?? '',
          residency: extendedProfile.residency ?? '',
          travel_history: extendedProfile.travel_history || [],
          saved_countries: extendedProfile.saved_countries || [],
          travel_score: extendedProfile.travel_score || 0,
          recent_checks: [],
          saved_documents: extendedProfile.saved_documents || [],
          upcoming_trips: [],
        });

        const { trips } = await tripsService.getUserTrips();
        setUserData((prev) => (prev ? { ...prev, upcoming_trips: trips } : prev));

        const profileNationality = extendedProfile.nationality;
        if (profileNationality) {
          const normalizedNationality = profileNationality.length === 2 ?
            profileNationality.toUpperCase() : profileNationality;
          setNationality(normalizedNationality);
        } else {
          setNationality('');
        }

        // Also update editable fields if needed
        setEditableFullName(extendedProfile.full_name || '');
        setEditableNationality(extendedProfile.nationality || '');
        setEditableResidency(extendedProfile.residency || '');
        setCurrentProfile(extendedProfile);

        if (!extendedProfile.questionnaire_completed) {
          setTravelScore(0);
        }

      } else {
        // Handle case where profile is null but no error (shouldn't happen with maybeSingle but good practice)
        console.warn("User profile data is null without specific error.");
        setUserData(null);
        setNationality('');
      }

      // Fetch visa requirements after profile load
      await fetchVisaRequirements();

    } catch (err) {
      console.error("Error loading user data:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setUserData(null);
      setNationality('');
    } finally {
      setIsLoading(false);
    }
  };

  // Use this effect to load user data on component mount
  useEffect(() => {
    loadUserData();
  }, [reloadKey]); // Include reloadKey to trigger reload when needed

  useEffect(() => {
    const handleSubscriptionUpdated = () => {
      loadUserData();
    };
    window.addEventListener('travelwithydra:subscription-updated', handleSubscriptionUpdated);
    return () => window.removeEventListener('travelwithydra:subscription-updated', handleSubscriptionUpdated);
  }, [reloadKey]);

  useEffect(() => {
    if (activeTab !== 'settings' || !userData?.email || !userData?.id) return;

    let cancelled = false;
    userProfileService
      .refreshSubscriptionDetails(userData.email, userData.id)
      .then((details) => {
        if (!cancelled && details) {
          setSubscriptionDetails(details);
        }
      })
      .catch((error) => {
        console.warn('Could not refresh subscription details:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, userData?.email, userData?.id, reloadKey]);

  // Use basic map if there's an error loading the map or if user toggles it
  useEffect(() => {
    if (mapLibraryHasError) {
      // Handle error state
    }
  }, [mapLibraryHasError]);

  // Update the features type to be more specific
  const features: Record<'free' | 'premium' | 'enterprise', string[]> = {
    free: ['Basic Travel Score', 'Limited Visa Checks (5/day)', 'Basic Dashboard Access'],
    premium: ['Advanced Travel Score', 'Unlimited Visa Checks', 'AI Travel Assistant', 'Document Storage', 'Trip Planning'],
    enterprise: ['All Premium Features', 'Priority Visa Processing', 'Personalized Travel Recommendations', 'Lifetime Updates']
  };

  // Header action handlers
  const handleLoginClick = () => navigate('/login');
  const handleSignUpClick = () => navigate('/signup');
  const handleLogoutClick = () => navigate('/');
  const handleDashboardClick = () => navigate('/dashboard');
  const handleHomeClick = () => navigate('/');
  const handleFeaturesClick = () => navigate('/features');
  const handlePricingClick = () => navigate('/pricing');
  const handleContactClick = () => navigate('/contact');

  // Update the handleAddTrip function to match the UserData type
  const handleAddTrip = async () => {
    if (!newTripDestination || !newTripStartDate || !newTripEndDate) return;

    setTripSaveError(null);
    const formattedDates = formatDateRange(newTripStartDate, newTripEndDate);

    const { trip, error } = await tripsService.createTrip({
      destination: newTripDestination,
      departure_date: newTripStartDate,
      return_date: newTripEndDate,
      dates: formattedDates,
      status: 'Planned',
      documents: [],
    });

    if (error || !trip) {
      setTripSaveError(error?.message ?? 'Failed to save trip. Please try again.');
      return;
    }

    const nextTrip = { ...trip, dates: formattedDates };

    setUserData((prevData) => {
      if (!prevData) {
        return {
          id: trip.id,
          name: 'User',
          email: '',
          subscription_tier: 'free',
          nationality: '',
          residency: '',
          travel_history: [],
          saved_countries: [],
          travel_score: 0,
          recent_checks: [],
          saved_documents: [],
          upcoming_trips: [nextTrip],
        };
      }
      return {
        ...prevData,
        upcoming_trips: [...prevData.upcoming_trips, nextTrip],
      };
    });

    setNewTripDestination('');
    setNewTripDates('');
    setNewTripStartDate('');
    setNewTripEndDate('');
  };

  const handleDownloadItinerary = () => {
    const trips = userData?.upcoming_trips ?? [];
    if (trips.length === 0) return;

    const lines = trips.map((trip, index) => {
      const dates = trip.dates ?? `${trip.departure_date} to ${trip.return_date}`;
      return `${index + 1}. ${trip.destination} (${dates}) — ${trip.status ?? 'Planned'}`;
    });

    const content = [
      'travelwithydra Trip Itinerary',
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      ...lines,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'travelwithydra-itinerary.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const startMonth = start.toLocaleString('default', { month: 'short' });
    const endMonth = end.toLocaleString('default', { month: 'short' });
    
    if (startMonth === endMonth && start.getFullYear() === end.getFullYear()) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }
  };
  
  const handleRemoveTrip = async (tripId: string) => {
    const { success, error } = await tripsService.deleteTrip(tripId);
    if (!success) {
      alert(error?.message ?? 'Failed to remove trip.');
      return;
    }

    setUserData((prevData) => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        upcoming_trips: prevData.upcoming_trips.filter((trip) => trip.id !== tripId),
      };
    });
  };
  
  // Document management functions
  const handleAddDocument = () => {
    if (!newDocumentName) return;
    
    const newDocument = {
      id: Date.now().toString(),
      name: newDocumentName,
      type: newDocumentType,
      url: '',
      uploaded: new Date().toISOString().split('T')[0],
      size: 0
    };
    
    setUserData(prevData => {
      if (!prevData) return prevData;
      return {
        ...prevData,
        saved_documents: [...prevData.saved_documents, newDocument]
      };
    });
    
    // Reset form
    setNewDocumentName('');
    setNewDocumentType('PDF');
  };
  
  // Handle document removal
  const handleRemoveDocument = async (documentId: string) => {
    if (!documentId) {
      console.error('Invalid document ID');
      return;
    }

    // Confirm deletion
    if (!window.confirm('Are you sure you want to remove this document?')) {
      return;
    }

    try {
      setIsUploading(true); // Repurpose isUploading state to indicate activity
      
      const { success, error } = await documentService.deleteUserDocument(documentId);
      
      if (error) {
        console.error('Error removing document:', error);
        alert(`Failed to remove document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
      
      if (success) {
        // Reload user data to update UI
        await loadUserData();
        alert('Document removed successfully');
      }
    } catch (error) {
      console.error('Document removal error:', error);
      alert('Failed to remove document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Country management functions
  const handlePassportCountryClick = (countryCode: string, _stats: PassportMobilityStats) => {
    navigate(`/map/passport/${countryCode.toLowerCase()}`);
  };

  const handleSaveCountry = async (countryCode: string) => {
    if (!countryCode) return;
    
    try {
      const { success, error } = await userProfileService.saveCountry(countryCode);
      
      if (error) {
        console.error('Error saving country:', error);
        setError('Failed to save country. Please try again.');
        return;
      }
      
      if (success) {
        // Update local state
        const countryName = getCountryName(countryCode) || countryCode;
        
        // Get visa type from selected country if available
        let visaType = 'unknown';
        if (selectedCountry && selectedCountry.code === countryCode && selectedCountry.visaDetails) {
          visaType = selectedCountry.visaDetails.requirement;
        }
        
        setSavedCountries(prev => {
          // Check if already in the list
          if (prev.some(country => country.code === countryCode)) {
            return prev;
          }
          
          return [...prev, {
            code: countryCode,
            name: countryName,
            visaType: visaType
          }];
        });
        
        // Update user data state
        setUserData(prevData => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            saved_countries: [...(prevData.saved_countries || []), countryCode]
          };
        });
      }
    } catch (err) {
      console.error('Unexpected error saving country:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleRemoveCountry = async (countryCode: string) => {
    if (!countryCode) return;
    
    try {
      const { success, error } = await userProfileService.removeCountry(countryCode);
      
      if (error) {
        console.error('Error removing country:', error);
        setError('Failed to remove country. Please try again.');
        return;
      }
      
      if (success) {
        // Update local state
        setSavedCountries(prev => prev.filter(country => country.code !== countryCode));
        
        // Update user data state
        setUserData(prevData => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            saved_countries: (prevData.saved_countries || []).filter(code => code !== countryCode)
          };
        });
      }
    } catch (err) {
      console.error('Unexpected error removing country:', err);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  // Function to save country from modal
  const handleSaveFromModal = () => {
    if (!selectedCountry) return;
    handleSaveCountry(selectedCountry.code);
    setShowCountryModal(false);
  };

  // Function to generate a gradient color stop for the travel score circle
  const getTravelScoreGradient = (score: number): string => {
    if (score >= 800) return 'url(#gradient-excellent)';
    if (score >= 600) return 'url(#gradient-good)';
    if (score >= 400) return 'url(#gradient-average)';
    return 'url(#gradient-basic)';
  };

  // Add this helper function for travel score color
  const getTravelScoreColor = (score: number): string => {
    if (score >= 900) return '#059669'; // Emerald-600 (excellent)
    if (score >= 750) return '#0D9488'; // Teal-600 (very good)
    if (score >= 600) return '#0F766E'; // Teal-700 (good)
    if (score >= 400) return '#0E7490'; // Cyan-700 (average)
    if (score >= 200) return '#0369A1'; // Sky-700 (below average)
    return '#0284C7'; // Sky-600 (poor)
  };

  // Add document to a specific trip
  const handleAddTripDocument = (tripId: string) => {
    if ((!tripDocumentName && !fileUpload) || !tripId) return;
    
    const documentName = tripDocumentName || (fileUpload ? fileUpload.name : 'Untitled Document');
    const documentType = fileUpload 
      ? fileUpload.name.split('.').pop()?.toUpperCase() || tripDocumentType 
      : tripDocumentType;
    
    const newDocument = {
      id: Date.now().toString(),
      name: documentName,
      type: documentType,
      url: '',
      uploaded: new Date().toISOString().split('T')[0],
      size: 0
    };
    
    setUserData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        upcoming_trips: prevData.upcoming_trips.map(trip => {
          if (trip.id === tripId) {
            return {
              ...trip,
              documents: [...(trip.documents || []), newDocument]
            };
          }
          return trip;
        })
      };
    });
    
    // Reset form
    setTripDocumentName('');
    setTripDocumentType('PDF');
    setFileUpload(null);
  };
  
  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileUpload(e.target.files[0]);
      
      // Auto-fill document name from filename if empty
      if (!tripDocumentName) {
        const fileName = e.target.files[0].name;
        // Remove file extension from name
        const nameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
        setTripDocumentName(nameWithoutExtension || fileName);
      }
      
      // Set document type based on file extension
      const fileExtension = e.target.files[0].name.split('.').pop()?.toUpperCase();
      if (fileExtension) {
        setTripDocumentType(fileExtension);
      }
    }
  };
  
  const handleRemoveTripDocument = (tripId: string, documentId: string) => {
    setUserData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        upcoming_trips: prevData.upcoming_trips.map(trip => {
          if (trip.id === tripId && trip.documents) {
            return {
              ...trip,
              documents: trip.documents.filter(doc => doc.id !== documentId)
            };
          }
          return trip;
        })
      };
    });
  };

  // Function to refresh data after questionnaire completion
  const refreshAfterQuestionnaire = () => {
    setReloadKey(prev => prev + 1);
  };

  useEffect(() => {
    const fromQuestionnaire = sessionStorage.getItem('fromQuestionnaire');
    if (fromQuestionnaire === 'true') {
      sessionStorage.removeItem('fromQuestionnaire');
      refreshAfterQuestionnaire();
    }
  }, []);

  // New useEffect to calculate score breakdown when userData changes
  useEffect(() => {
    if (userData) {
      const currentTotalScore = userData.travel_score || 0;
      const profile = {
        nationality: userData.nationality || '',
        residency: userData.residency || userData.nationality || '',
        travel_history: (userData.travel_history || []).map((code) => ({
          country_id: code,
          visit_date: new Date().toISOString(),
          duration_days: 1,
          purpose: 'tourism',
        })),
      };
      const breakdown = getScoreBreakdown(profile);
      setScoreBreakdown(breakdown);
      setTravelScore(currentTotalScore);
    }
  }, [userData?.travel_score, userData?.nationality, userData?.residency, userData?.travel_history]);

  // Function to render the user's current country profile info
  const renderUserCountryInfo = () => {
    if (!userData) return null;

    const renderCountryField = (label: string, value: string) => {
      const hasValue = Boolean(value?.trim());
      const flagCode = resolveCountryFlagCode(value);
      const displayName = hasValue
        ? (flagCode ? getCountryName(flagCode) : getCountryName(value)) || value
        : 'Not set';

      return (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex-1">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</h3>
          <div className="flex items-center">
            {hasValue ? (
              <CountryFlagImage countryValue={value} alt={`${displayName} flag`} />
            ) : (
              <div className="w-8 h-6 mr-2 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-500">
                —
              </div>
            )}
            <span className="text-gray-900 dark:text-white font-medium">{displayName}</span>
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {renderCountryField('Nationality', userData.nationality)}
        {renderCountryField('Country of Residence', userData.residency)}
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg flex-1">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Travel Statistics</h3>
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Countries Visited:</span>
              <span className="font-bold text-gray-900 dark:text-white">{userData.travel_history?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-gray-600 dark:text-gray-400">Continents Explored:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {getExploredContinentsCount(userData?.travel_history || [])}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Define fetchVisaRequirements outside useEffect
  const fetchVisaRequirements = async () => {
    try {
      // Load all three visa requirement files
      const response1 = await fetch('/visarequirements1.json');
      const response2 = await fetch('/visarequirements2.json');
      const response3 = await fetch('/visarequirements3.json');
      
      if (!response1.ok || !response2.ok || !response3.ok) {
        throw new Error('Failed to load visa requirements data');
      }
      
      const data1 = await response1.json();
      const data2 = await response2.json();
      const data3 = await response3.json();
      
      // Combine all data
      const data = [...data1, ...data2, ...data3];
      
      setVisaRequirements(data);
    } catch (error) {
      console.error('Error fetching visa requirements:', error);
    }
  };

  // Moved from renderRecommendedDestinations
  useEffect(() => {
    // Only fetch if userData is available (specifically nationality)
    if (userData) {
      fetchVisaRequirements();
    }
  }, [userData?.nationality]); // Re-fetch when nationality changes

  // Process recommended destinations when visa requirements are loaded
  useEffect(() => {
    if (visaRequirements.length === 0 || !userData?.nationality?.trim()) {
      setRecommendationDestinations([]);
      return;
    }

    const nationality = userData.nationality;
    const residency = userData.residency || nationality;
    const passportName = getCountryName(nationality) || nationality;
    const score = userData.travel_score || travelScore || 0;
    const natCode = resolveNationalityCode(nationality).toUpperCase();
    const resCode = resolveNationalityCode(residency).toUpperCase();

    const serviceDestinations = visaRequirements
      .filter((req: VisaRequirementData) => {
        if (req.Passport !== passportName) return false;
        const code = visaRequirementsService.getCountryCodeFromName(req.Destination)?.toLowerCase() || '';
        const requirement = normalizeRequirementFromJson(req.Requirement);
        return code && canApplyOnlineForDestination(requirement, code);
      })
      .map((req: VisaRequirementData) => {
        const code =
          visaRequirementsService.getCountryCodeFromName(req.Destination)?.toUpperCase() || '';
        const requirement = normalizeRequirementFromJson(req.Requirement);
        const isSchengen = isSchengenCountry(code.toLowerCase()) && requirement === 'visa-required';
        const evisaParsed = parseEvisaRequirement(req.Requirement);
        const serviceType: 'evisa' | 'eta' | 'schengen' = isSchengen
          ? 'schengen'
          : evisaParsed === 'eta'
            ? 'eta'
            : 'evisa';
        const meta = POPULAR_DESTINATION_META[code] || {
          description: isSchengen
            ? `Apply for your Schengen visa to ${req.Destination} with Hydra guiding you through the process.`
            : `Apply online for travel authorization to ${req.Destination}`,
          tags: [serviceType === 'schengen' ? 'Schengen' : serviceType === 'eta' ? 'ETA' : 'eVisa'],
        };

        return {
          name: req.Destination,
          code,
          description: meta.description,
          serviceType,
          likelihoodPercent: getRecommendationLikelihood(serviceType, score),
          tags: meta.tags,
        };
      })
      .filter((destination) => destination.code);

    if (isPakistanUkFacilitationProfile(natCode, resCode)) {
      for (const entry of PAKISTAN_UK_FACILITATION) {
        if (entry.entryType !== 'evisa' && entry.entryType !== 'eta') continue;
        if (serviceDestinations.some((d) => d.code === entry.countryCode)) continue;
        serviceDestinations.push({
          name: entry.countryName,
          code: entry.countryCode,
          description: entry.notes,
          serviceType: entry.entryType === 'eta' ? 'eta' : 'evisa',
          likelihoodPercent: getRecommendationLikelihood(entry.entryType === 'eta' ? 'eta' : 'evisa', score),
          tags: ['UK visa holder', entry.region],
        });
      }
    }

    const uniqueByCode = new Map<string, typeof serviceDestinations[number]>();
    for (const destination of serviceDestinations) {
      if (!uniqueByCode.has(destination.code)) {
        uniqueByCode.set(destination.code, destination);
      }
    }
    const uniqueDestinations = Array.from(uniqueByCode.values());

    const popularCodes = Object.keys(POPULAR_DESTINATION_META);
    uniqueDestinations.sort((a, b) => {
      const aPopular = popularCodes.indexOf(a.code);
      const bPopular = popularCodes.indexOf(b.code);
      if (aPopular !== -1 && bPopular !== -1) return aPopular - bPopular;
      if (aPopular !== -1) return -1;
      if (bPopular !== -1) return 1;
      return b.name.localeCompare(b.name);
    });

    setRecommendationDestinations(uniqueDestinations.slice(0, 6));
  }, [visaRequirements, userData?.nationality, userData?.residency, userData?.travel_score, travelScore]);

  // Styling for recommended destination cards
  const renderRecommendedDestinations = () => {
    const nationalityCode = userData?.nationality
      ? resolveNationalityCode(userData.nationality)
      : '';

    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Recommended Destinations</h3>
        {!userData?.nationality?.trim() ? (
          <p className="text-gray-500 text-sm">
            Set your nationality and country of residence in Settings to see destinations you can apply for with travelwithydra.
          </p>
        ) : recommendationDestinations.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No online visa services are available for your profile at this time.
          </p>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recommendationDestinations.map((destination) => (
            <div 
              key={destination.code}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <img
                      src={`https://flagcdn.com/${destination.code.toLowerCase()}.svg`}
                      alt={`${destination.name} flag`}
                      className="w-8 h-6 mr-2 object-cover rounded"
                    />
                    <h4 className="font-semibold text-lg">{destination.name}</h4>
                  </div>
                  <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                    destination.likelihoodPercent >= 90
                      ? 'bg-green-100 text-green-700'
                      : destination.likelihoodPercent >= 75
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-orange-100 text-orange-700'
                  }`}>
                    {destination.likelihoodPercent}% likely
                  </span>
                </div>
                
                <span className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${
                  destination.serviceType === 'schengen'
                    ? 'bg-purple-100 text-purple-800'
                    : destination.serviceType === 'eta'
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-blue-100 text-blue-800'
                }`}>
                  {destination.serviceType === 'schengen'
                    ? 'Schengen Visa'
                    : destination.serviceType === 'eta'
                      ? 'ETA Available'
                      : 'eVisa Available'}
                </span>
                
                <p className="text-gray-600 text-sm mb-3">{destination.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {destination.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex} 
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <Link 
                  to={`/visa/${destination.code.toLowerCase()}?nationality=${nationalityCode}`}
                  className="mt-2 text-teal-600 hover:text-teal-800 font-medium text-sm flex items-center"
                >
                  {destination.serviceType === 'schengen' ? 'Apply for Schengen Visa' : 'Apply Now'}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    );
  };

  const renderMembershipBanner = () => {
    const tier = normalizeSubscriptionTier(userData?.subscription_tier);
    const label = tier.charAt(0).toUpperCase() + tier.slice(1);

    return (
      <div
        className={`mb-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
          tier === 'free'
            ? 'border-gray-200 bg-white'
            : tier === 'enterprise'
              ? 'border-primary-300 bg-gradient-to-r from-primary-50 to-white'
              : 'border-primary-200 bg-gradient-to-r from-primary-50/80 to-white'
        }`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your membership</p>
          <p className="text-lg font-bold text-gray-900">
            {tier === 'free' ? 'Free plan' : `${label} member`}
          </p>
          <p className="text-sm text-gray-600">
            {tier === 'free'
              ? 'Upgrade to unlock AI assistant, travel alerts, and eVisa discounts.'
              : tier === 'enterprise'
                ? 'Unlimited AI assistant, dedicated support, and maximum eVisa discounts.'
                : 'AI assistant, priority support, and eVisa fee discounts are active on your account.'}
          </p>
        </div>
        {tier === 'free' ? (
          <Link to="/pricing" className="btn-primary px-5 py-2 text-center text-sm font-semibold">
            Upgrade plan
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white">
            Active
          </span>
        )}
      </div>
    );
  };

  // Update the renderOverview function to include the new recommended destinations
  const renderOverview = () => (
    <div className="space-y-8">
      {renderMembershipBanner()}
      {renderUpgradeSection()}
      {/* Travel Score Overview Card */}
      <div className="card bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Travel Score</h2>
              <p className="text-gray-600 dark:text-gray-400">Based on your questionnaire results</p>
            </div>
            <Link to="/travel-score" className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-2 md:mt-0">
              View Full Details →
            </Link>
          </div>

          {/* Render user nationality and residence information */}
          {renderUserCountryInfo()}

          {!currentProfile?.questionnaire_completed ? (
            <div className="rounded-lg border border-dashed border-teal-200 bg-teal-50 px-6 py-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900">Discover your travel score</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
                Take the questionnaire to calculate your travel score. On your first questionnaire, your
                nationality and country of residence will be saved to your profile (you can change them later
                in Settings).
              </p>
              <Link
                to="/questionnaire"
                className="mt-5 inline-flex items-center rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                onClick={() => sessionStorage.setItem('fromQuestionnaire', 'true')}
              >
                Take Questionnaire
              </Link>
            </div>
          ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-center h-32 md:h-40">
                <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
                  <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
                    <defs>
                      <linearGradient id="gradient-excellent" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#047857" />
                      </linearGradient>
                      <linearGradient id="gradient-good" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#14B8A6" />
                        <stop offset="100%" stopColor="#0F766E" />
                      </linearGradient>
                      <linearGradient id="gradient-average" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06B6D4" />
                        <stop offset="100%" stopColor="#0E7490" />
                      </linearGradient>
                      <linearGradient id="gradient-basic" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0EA5E9" />
                        <stop offset="100%" stopColor="#0284C7" />
                      </linearGradient>
                    </defs>
                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e6e6e6" strokeWidth="12" />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke={getTravelScoreGradient(userData?.travel_score || travelScore)}
                      strokeWidth="12"
                      strokeDasharray="339.292"
                      strokeDashoffset={
                        339.292 - (339.292 * (userData?.travel_score || travelScore)) / 1000
                      }
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">
                      {userData?.travel_score || travelScore}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">/ 1000</span>
                  </div>
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full text-white" 
                  style={{ 
                    background: `linear-gradient(to right, ${getTravelScoreColor(userData?.travel_score || travelScore)}, ${getTravelScoreColor(userData?.travel_score || travelScore)}CC)` 
                  }}>
                  {getTravelScoreLevel(userData?.travel_score || travelScore)}
                </span>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="grid gap-3">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Passport Strength</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {scoreBreakdown.passportComponent} pts
                    </span>
                  </div>
                  {/* Passport strength can contribute up to 60% of total score (60% of 1000 = 600) */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (scoreBreakdown.passportComponent / 600) * 100)}%`,
                        background: 'linear-gradient(to right, #14B8A6, #0F766E)'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Mobility Access</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {scoreBreakdown.mobilityComponent} pts
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (scoreBreakdown.mobilityComponent / 450) * 100)}%`,
                        background: 'linear-gradient(to right, #06b6d4, #0891b2)'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Travel Credibility</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {scoreBreakdown.historyComponent} pts
                    </span>
                  </div>
                  {/* Travel history can contribute up to 30% of total score (30% of 1000 = 300) */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (scoreBreakdown.historyComponent / 300) * 100)}%`,
                        background: 'linear-gradient(to right, #10B981, #047857)'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Residence Bonus</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      {scoreBreakdown.residencyComponent} pts
                    </span>
                  </div>
                  {/* Residence bonus can contribute up to 10% of total score (10% of 1000 = 100) */}
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (scoreBreakdown.residencyComponent / 100) * 100)}%`,
                        background: 'linear-gradient(to right, #06B6D4, #0E7490)'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link 
                  to="/questionnaire" 
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  onClick={() => {
                    // Set a flag to indicate we're going to the questionnaire
                    sessionStorage.setItem('fromQuestionnaire', 'true');
                  }}
                >
                  Retake Questionnaire
                </Link>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      
      {/* Travel Profile Card */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Travel Profile</h2>
          <button
            type="button"
            onClick={() => setActiveTab('world-map')}
            className="text-xs text-teal-600 hover:text-teal-700"
          >
            View on Map →
          </button>
        </div>
        
        {/* Travel History Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-semibold text-gray-800 dark:text-white">Travel History</h3>
          </div>
          
          {userData?.travel_history && userData.travel_history.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {userData.travel_history.slice(0, 10).map((countryCode) => (
                <div key={countryCode} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-4 overflow-hidden rounded shadow">
                    <img 
                      src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`} 
                      alt={`${getCountryName(countryCode)} flag`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm">{getCountryName(countryCode)}</span>
                </div>
              ))}
              {userData.travel_history.length > 10 && (
                <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-500 dark:text-gray-400">+{userData.travel_history.length - 10} more countries</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No travel history recorded</p>
              <Link to="/questionnaire" className="text-sm text-teal-600 hover:text-teal-700 mt-1 inline-block">
                Update your travel history
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Recommended Destinations */}
      {renderRecommendedDestinations()}
      
      {/* Visa Applications overview */}
      <motion.div className="dashboard-card" whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Visa Applications</h3>
            <p className="text-sm text-gray-500">Resume in-progress applications or view submitted ones</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('visa-applications')}
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            View all applications →
          </button>
        </div>

        {isLoadingApplications ? (
          <p className="text-sm text-gray-500 py-4">Loading applications...</p>
        ) : visaApplications.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
            <p className="text-gray-600">No visa applications yet.</p>
            <Link to="/visa/browse" className="mt-2 inline-block text-sm font-medium text-teal-600 hover:text-teal-700">
              Browse visa destinations
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {visaApplications.slice(0, 3).map((application) => (
              <div key={application.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {application.destination_name ||
                        getCountryName(application.destination_code || application.destination_id || '')}
                    </p>
                    <p className="text-sm text-gray-500">{getVisaApplicationProgressLabel(application)}</p>
                  </div>
                  {isIncompleteDraft(application) && application.nationality_code && application.destination_code ? (
                    <Link
                      to={`/visa/apply/${application.nationality_code}/${application.destination_code}`}
                      className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      Resume
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('visa-applications')}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700"
                    >
                      View details
                    </button>
                  )}
                </div>
                <VisaApplicationProgressSteps application={application} compact />
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div 
        className="dashboard-card"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <h3 className="text-xl font-semibold mb-4">Upcoming Trips</h3>
        <div className="space-y-4">
          {userData?.upcoming_trips.map((trip, index) => (
            <motion.div 
              key={index} 
              className="dashboard-stat"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ backgroundColor: "#f9fafb" }}
            >
              <div>
                <p className="font-medium">{trip.destination}</p>
                <p className="text-sm text-gray-500">{trip.dates}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                trip.status === 'Planned' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {trip.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // Helper function to count explored continents
  const getExploredContinentsCount = (countryCodes: string[]): number => {
    // This is a simplified version - in a real app you'd map countries to continents
    // For now, just return a reasonable number based on how many countries they've visited
    if (countryCodes.length >= 50) return 6; // All continents
    if (countryCodes.length >= 30) return 5;
    if (countryCodes.length >= 20) return 4;
    if (countryCodes.length >= 10) return 3;
    if (countryCodes.length >= 5) return 2;
    if (countryCodes.length >= 1) return 1;
    return 0;
  };

  // Create a manual file upload function that works with direct click
  const handleManualFileUpload = () => {
    // Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = `.${newDocumentType.toLowerCase()}`;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    // Add event listener for file selection
    fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        // Set the selected file in state
        setSelectedFile(file);
        
        // Auto-fill document name if not set
        if (!newDocumentName) {
          const fileName = file.name.split('.').slice(0, -1).join('.');
          setNewDocumentName(fileName);
        }
        
        // Start upload process
        handleUploadDocument(file);
      }
      
      // Clean up - remove the input from the DOM
      document.body.removeChild(fileInput);
    });
    
    // Trigger click on the file input
    fileInput.click();
  };

  // Upload a document
  const handleUploadDocument = async (file: File) => {
    if (!file) {
      setUploadError('No file selected');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadError(null);
      
      const { user, error: authError } = await authService.getCurrentUser();
      if (authError || !user) {
        setUploadError('You must be logged in to upload documents');
        return;
      }
      
      const { document, error } = await documentService.uploadUserDocument(
        user.id,
        file,
        newDocumentName || file.name,
        documentCategory
      );
      
      if (error) {
        console.error('Error uploading document:', error);
        setUploadError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
      
      // Reset form
      setNewDocumentName('');
      setSelectedFile(null);
      
      // Clear the file input
      const fileInput = window.document.getElementById('document-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Reload user data to show the new document
      await loadUserData();
      
      // Show success message
      alert('Document uploaded successfully');
    } catch (error) {
      console.error('Document upload error:', error);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Render documents section
  const renderDocuments = () => (
    <div className="card p-6">
      <h3 className="text-xl font-semibold mb-4">Saved Documents</h3>
      
      {/* Add document form */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Add New Document</h4>
        <div className="flex flex-col space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Document name"
            className="input flex-1"
            value={newDocumentName}
            onChange={(e) => setNewDocumentName(e.target.value)}
          />
          <select
            className="input w-full md:w-32"
            value={newDocumentType}
            onChange={(e) => setNewDocumentType(e.target.value)}
          >
            <option value="PDF">PDF</option>
            <option value="JPG">JPG</option>
            <option value="PNG">PNG</option>
            <option value="DOC">DOC</option>
          </select>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <select
              className="input flex-1"
              value={documentCategory}
              onChange={(e) => setDocumentCategory(e.target.value)}
            >
              <option value="General">General</option>
              <option value="Passport">Passport</option>
              <option value="Visa">Visa</option>
              <option value="Insurance">Insurance</option>
              <option value="Tickets">Tickets</option>
              <option value="Booking">Booking Confirmation</option>
              <option value="Other">Other</option>
            </select>
            
          <button
              className={`btn-primary w-full md:w-auto ${isUploading ? 'opacity-50' : ''}`}
              onClick={handleManualFileUpload}
              disabled={isUploading}
          >
              {isUploading ? 'Uploading...' : 'Add Document'}
          </button>
        </div>
        </div>
        
        {selectedFile && (
          <div className="mt-3 text-sm text-gray-600">
            Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </div>
        )}
        {uploadError && (
          <div className="mt-2 text-sm text-red-600">
            {uploadError}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        {userData?.saved_documents && userData.saved_documents.length > 0 ? (
          userData.saved_documents.map((doc, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">{doc.name}</p>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-500">
                      {new Date(doc.uploaded).toLocaleDateString()} • {doc.type}
                      {doc.size ? ` • ${Math.round(doc.size / 1024)} KB` : ''}
                    </p>
                    {doc.category && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                        {doc.category}
                      </span>
                    )}
                  </div>
              </div>
            </div>
            <div className="flex space-x-2">
                {doc.url && (
                  <a 
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 px-2 py-1"
                  >
                Download
                  </a>
                )}
              <button 
                className="text-red-600 hover:text-red-700 px-2 py-1"
                onClick={() => handleRemoveDocument(doc.id)}
              >
                Remove
              </button>
            </div>
          </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No documents saved yet. Add your first document above.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderUpgradeSection = () => {
    const tier = normalizeSubscriptionTier(userData?.subscription_tier);
    if (tier !== 'free' || !showUpgradeBanner) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg text-white relative"
      >
        <button 
          className="absolute top-3 right-3 text-white/90 hover:text-white"
          onClick={() => setShowUpgradeBanner(false)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-xl font-semibold mb-2">Upgrade Your Experience</h3>
        <p className="mb-4">Get access to all premium features and enhance your travel planning.</p>
        <Link 
          to="/pricing"
          className="inline-block bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          View Plans
        </Link>
      </motion.div>
    );
  };

  const renderTravelScore = () => (
    <div className="card p-6">
      <h3 className="text-xl font-semibold mb-4">Travel Score Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Current Score</p>
            <p className="text-2xl font-bold text-primary-600">{travelScore}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Subscription Level</p>
            <p className="text-lg font-medium">
              {(userData?.subscription_tier || 'free').charAt(0).toUpperCase() + 
               (userData?.subscription_tier || 'free').slice(1)}
            </p>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Available Features</h4>
          <ul className="space-y-2">
            {features[userData?.subscription_tier as keyof typeof features || 'free'].map((feature: string, index: number) => (
              <li key={index} className="flex items-center text-sm">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  // Handle saving changes in settings
  const handleSaveChanges = async () => {
    if (!currentProfile && !userData?.id) {
      setSettingsError('User profile not loaded. Please refresh the page and try again.');
      return;
    }

    setIsSavingSettings(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    const updatedProfileData: Partial<UserProfile> = {
      full_name: editableName,
      nationality: editableNationality,
      residency: editableResidency,
      phone_number: editablePhoneNumber,
      passport_number: editablePassportNumber,
      passport_expiry: editablePassportExpiry,
      countries_confirmed: Boolean(editableNationality?.trim() || editableResidency?.trim()),
    };

    try {
      const { profile, error } = await userProfileService.updateProfile(updatedProfileData);

      if (error) {
        console.error('Error updating profile:', error);
        setSettingsError('Failed to save settings. Please try again.');
      } else {
        setSettingsSuccess('Settings saved successfully.');
        if (profile) {
          setCurrentProfile(profile as ExtendedUserProfile);
        }

        setUserData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            name: editableName || prev.name,
            nationality: editableNationality,
            residency: editableResidency,
          };
        });

        if (editableNationality) {
          const normalizedNationality = editableNationality.length === 2
            ? editableNationality.toUpperCase()
            : editableNationality;
          setNationality(normalizedNationality);
        } else {
          setNationality('');
        }
      }
    } catch (err) {
      console.error('Unexpected error saving settings:', err);
      setSettingsError('An unexpected error occurred while saving settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const formatSubscriptionDate = (unixSeconds?: number | null) => {
    if (!unixSeconds) return null;
    return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      'Cancel your subscription? You will keep Premium access until the end of the current billing period.'
    );
    if (!confirmed) return;

    setIsManagingSubscription(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      const result = await userProfileService.cancelSubscription();
      setSettingsSuccess(result.message);
      setReloadKey((key) => key + 1);
    } catch (error) {
      setSettingsError(
        error instanceof Error ? error.message : 'Failed to cancel subscription. Please try again.'
      );
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const handleManageBilling = async () => {
    setIsManagingSubscription(true);
    setSettingsError(null);

    try {
      const url = await userProfileService.openBillingPortal(`${window.location.origin}/dashboard`);
      window.location.href = url;
    } catch (error) {
      setSettingsError(
        error instanceof Error ? error.message : 'Could not open billing portal. Please try again.'
      );
      setIsManagingSubscription(false);
    }
  };

  // Define renderSettings function correctly
  const renderSettings = () => {
    // Initialize editable fields with currentProfile data if available
    // This effect runs when the component mounts or currentProfile changes
    // useEffect(() => { <-- REMOVED FROM HERE
    //     if (currentProfile) {
    //         setEditableName(currentProfile.full_name || '');
    //         setEditablePhoneNumber(currentProfile.phone_number || '');
    //         setEditablePassportNumber(currentProfile.passport_number || '');
    //         setEditablePassportExpiry(currentProfile.passport_expiry || '');
    //     }
    // }, [currentProfile]); <-- REMOVED FROM HERE
      
    return (
        <div className="card p-6">
            <h3 className="text-xl font-semibold mb-6">Account Settings</h3>

            {settingsError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{settingsError}</div>
            )}
            {settingsSuccess && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{settingsSuccess}</div>
            )}
            
            <div className="space-y-6">
                {/* Profile Information Section */}
                <div>
                    <h4 className="font-medium mb-3 text-lg">Profile Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input 
                                type="text" 
                                value={editableName} 
                                onChange={(e) => setEditableName(e.target.value)}
                                className="mt-1 input w-full"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={currentProfile?.email || userData?.email || ''} readOnly className="mt-1 input w-full bg-gray-100 cursor-not-allowed" />
                        </div>
                        <div>
                            <CountrySelect
                              id="settings-nationality"
                              label="Nationality"
                              value={editableNationality}
                              onChange={setEditableNationality}
                              placeholder="Select your nationality"
                            />
                        </div>
                        <div>
                            <CountrySelect
                              id="settings-residency"
                              label="Country of Residence"
                              value={editableResidency}
                              onChange={setEditableResidency}
                              placeholder="Select your country of residence"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input 
                                type="tel" 
                                value={editablePhoneNumber} 
                                onChange={(e) => setEditablePhoneNumber(e.target.value)}
                                className="mt-1 input w-full"
                                placeholder="Enter phone number (optional)"
                            />
                        </div>
                    </div>
                </div>

                {/* Passport Information Section */}
                <div>
                    <h4 className="font-medium mb-3 text-lg">Passport Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                            <input 
                                type="text" 
                                value={editablePassportNumber} 
                                onChange={(e) => setEditablePassportNumber(e.target.value)}
                                className="mt-1 input w-full"
                                placeholder="Enter passport number (optional)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry Date</label>
                            <input 
                                type="date" 
                                value={editablePassportExpiry} 
                                onChange={(e) => setEditablePassportExpiry(e.target.value)}
                                className="mt-1 input w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Subscription Section */}
                <div>
                    <h4 className="font-medium mb-3 text-lg">Subscription</h4>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-500">Current plan</p>
                          <p className="text-xl font-bold text-primary-700">
                            {(normalizeSubscriptionTier(currentProfile?.subscription_tier) || 'free')
                              .charAt(0)
                              .toUpperCase() +
                              (normalizeSubscriptionTier(currentProfile?.subscription_tier) || 'free').slice(1)}
                          </p>
                          {normalizeSubscriptionTier(currentProfile?.subscription_tier) !== 'free' && (
                            <p className="mt-1 text-sm text-gray-600">
                              {currentProfile?.subscription_is_lifetime ||
                              subscriptionDetails?.isLifetime ||
                              currentProfile?.subscription_billing_cycle === 'lifetime'
                                ? 'Lifetime access'
                                : currentProfile?.subscription_billing_cycle === 'annual'
                                  ? 'Billed annually'
                                  : currentProfile?.subscription_billing_cycle === 'monthly'
                                    ? 'Billed monthly'
                                    : 'Active membership'}
                            </p>
                          )}
                        </div>
                        {normalizeSubscriptionTier(currentProfile?.subscription_tier) !== 'free' && (
                          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
                            Benefits active
                          </span>
                        )}
                      </div>
                      {normalizeSubscriptionTier(currentProfile?.subscription_tier) === 'free' ? (
                        <Link to="/pricing" className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline">
                          Upgrade plan
                        </Link>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-gray-600">
                            Includes AI travel assistant
                            {normalizeSubscriptionTier(currentProfile?.subscription_tier) === 'enterprise'
                              ? ' (unlimited)'
                              : ''}
                            , priority support, and eVisa fee discounts.
                          </p>

                          {(currentProfile?.subscription_cancel_at_period_end ||
                            subscriptionDetails?.cancelAtPeriodEnd) && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                              Cancellation scheduled. Premium access continues until{' '}
                              {formatSubscriptionDate(
                                currentProfile?.subscription_period_end ?? subscriptionDetails?.periodEnd
                              ) || 'the end of your billing period'}
                              .
                            </div>
                          )}

                          {currentProfile?.subscription_is_lifetime ||
                          subscriptionDetails?.isLifetime ||
                          currentProfile?.subscription_billing_cycle === 'lifetime' ? (
                            <p className="text-sm text-gray-500">
                              Lifetime memberships do not renew. Contact support if you need billing help.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-3 pt-1">
                              {!currentProfile?.subscription_cancel_at_period_end &&
                                !subscriptionDetails?.cancelAtPeriodEnd && (
                                  <button
                                    type="button"
                                    onClick={handleCancelSubscription}
                                    disabled={isManagingSubscription}
                                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                                  >
                                    {isManagingSubscription ? 'Processing...' : 'Cancel subscription'}
                                  </button>
                                )}
                              <button
                                type="button"
                                onClick={handleManageBilling}
                                disabled={isManagingSubscription}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                Manage billing
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-200 flex justify-end">
                    <button 
                        className={`btn-primary px-6 py-2 ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleSaveChanges}
                        disabled={isSavingSettings}
                    >
                        {isSavingSettings ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
  };

  // Updated function to render the world map - Removed switch logic
  const renderWorldMap = () => {
    return (
      <motion.div 
        className="card overflow-hidden mb-8" // Add margin-bottom for spacing
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {isMapLibraryLoaded ? (
          <VisaRequirementsMap
            userNationality={userData?.nationality || ''}
            highlightedCountryCodes={userData?.travel_history || []}
            onCountrySelect={handlePassportCountryClick}
            navigateToHubOnClick
          />
        ) : mapLibraryHasError ? (
           <div className="p-8 text-center text-red-600">
             <p>Error loading map component. Please try refreshing the page.</p>
           </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading map data...</p>
          </div>
        )}
        
        {/* Saved Countries Section - kept as is */}
        {savedCountries.length > 0 && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Saved Countries</h3>
            <SavedCountries 
              countries={savedCountries}
              onRemoveCountry={handleRemoveCountry}
            />
          </div>
        )}
      </motion.div>
    );
  };

  // Function to render the visa check section
  const renderVisaCheck = () => (
                <motion.div 
                  className="card p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-xl font-semibold mb-4">Visa Check</h3>
                  <p className="text-gray-600 mb-4">Check visa requirements for any country based on your nationality.</p>
      
      <div className="mt-6 text-center">
        <Link 
          to="/visa-checker" 
          className="btn-primary inline-block px-6 py-3"
        >
          Go to Visa Eligibility Checker
        </Link>
      </div>
                </motion.div>
  );

  // Enhanced trip planning section
  const renderTrips = () => (
    <motion.div 
      className="card p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-xl font-semibold">Trip Planning</h3>
        {(userData?.upcoming_trips.length ?? 0) > 0 && (
          <button
            type="button"
            className="btn-secondary text-sm w-full sm:w-auto"
            onClick={handleDownloadItinerary}
          >
            Download Itinerary
          </button>
        )}
      </div>

      {tripSaveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {tripSaveError}
        </div>
      )}
      
      {/* Add trip form */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Add New Trip</h4>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Destination"
            className="input w-full"
            value={newTripDestination}
            onChange={(e) => setNewTripDestination(e.target.value)}
          />
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                className="input w-full"
                value={newTripStartDate}
                onChange={(e) => setNewTripStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                className="input w-full"
                value={newTripEndDate}
                onChange={(e) => setNewTripEndDate(e.target.value)}
              />
            </div>
          </div>
          
          <button
            className="btn-primary w-full md:w-auto self-end"
            onClick={handleAddTrip}
          >
            Add Trip
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {userData?.upcoming_trips.map((trip, index) => (
          <motion.div 
            key={index} 
            className="border rounded-lg overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex justify-between items-start p-4 bg-gray-50">
              <div>
                <h4 className="font-medium text-lg">{trip.destination}</h4>
                <p className="text-gray-500">{trip.dates}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  trip.status === 'Planned' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {trip.status}
                </span>
                <button 
                  className="text-red-600 hover:text-red-700 ml-2"
                  onClick={() => handleRemoveTrip(trip.id)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Trip Documents Section */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium">Trip Documents</h5>
                <button 
                  className="text-sm text-primary-600 hover:text-primary-700"
                  onClick={() => setActiveTripId(activeTripId === trip.id ? null : trip.id)}
                >
                  {activeTripId === trip.id ? 'Close' : 'Add Documents'}
                </button>
              </div>
              
              {/* Add document form */}
              {activeTripId === trip.id && (
                <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Document name"
                        className="input flex-1"
                        value={tripDocumentName}
                        onChange={(e) => setTripDocumentName(e.target.value)}
                      />
                      <select
                        className="input w-full md:w-32"
                        value={tripDocumentType}
                        onChange={(e) => setTripDocumentType(e.target.value)}
                      >
                        <option value="PDF">PDF</option>
                        <option value="JPG">JPG</option>
                        <option value="PNG">PNG</option>
                        <option value="DOC">DOC</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-2 items-center">
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Upload document</label>
                        <input
                          type="file"
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-primary-50 file:text-primary-700
                                    hover:file:bg-primary-100"
                          onChange={handleFileChange}
                        />
                      </div>
                      
                      <button
                        className="btn-primary w-full md:w-auto mt-4 md:mt-0"
                        onClick={() => handleAddTripDocument(trip.id)}
                      >
                        Add Document
                      </button>
                    </div>
                    
                    {fileUpload && (
                      <div className="text-sm text-gray-500 mt-1">
                        Selected file: {fileUpload.name} ({Math.round(fileUpload.size / 1024)} KB)
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Document list */}
              <div className="space-y-2">
                {trip.documents && trip.documents.length > 0 ? (
                  trip.documents.map((doc, docIndex) => (
                    <div key={docIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-1 bg-primary-100 rounded-lg mr-2">
                          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.type} • {doc.uploaded}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-700 text-sm">
                          View
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-700 text-sm"
                          onClick={() => handleRemoveTripDocument(trip.id, doc.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">No documents added for this trip</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        {userData?.upcoming_trips.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No trips planned yet. Add your first trip above.</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  // Fetch visa applications
  useEffect(() => {
    const fetchVisaApplications = async () => {
      if (!userData?.id) return;

      setIsLoadingApplications(true);
      setApplicationsError(null);

      try {
        const { applications, error } = await visaApplicationsService.getUserApplications(userData.id);

        if (error) {
          setApplicationsError('Failed to load visa applications. Please try again.');
        } else {
          setVisaApplications(applications ?? []);
        }
      } catch (err) {
        setApplicationsError('An unexpected error occurred while loading visa applications.');
      } finally {
        setIsLoadingApplications(false);
      }
    };

    fetchVisaApplications();
  }, [userData?.id, reloadKey]);

  // Handle refreshing visa applications
  const handleRefreshApplications = () => {
    setReloadKey(prev => prev + 1);
  };

  // Function to render the visa applications section
  const renderVisaApplications = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold">Visa Applications</h3>
            <p className="text-gray-600">Manage and track your visa applications</p>
          </div>
          <button
            onClick={handleRefreshApplications}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            aria-label="Refresh applications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {isLoadingApplications ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        ) : applicationsError ? (
          <div className="py-6 text-center text-red-600">
            <p>{applicationsError}</p>
            <button
              onClick={handleRefreshApplications}
              className="mt-2 text-primary-600 hover:text-primary-700"
            >
              Try again
            </button>
          </div>
        ) : (
          <VisaApplications
            applications={visaApplications}
            isAdmin={userData?.subscription_tier === 'admin'}
            onRefresh={handleRefreshApplications}
          />
        )}
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-lg font-semibold">Need a new visa?</h4>
              <p className="text-gray-600">
                Check your eligibility and apply for eVisas through our platform
              </p>
            </div>
            <Link
              to="/visa-checker"
              className="btn-primary px-6 py-2"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Correctly define renderActiveTabContent
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'travel-score':
        return renderTravelScore();
      case 'visa-check':
        return renderVisaCheck();
      case 'world-map':
        return renderWorldMap();
      case 'trips':
        return renderTrips();
      case 'documents':
        return renderDocuments();
      case 'settings':
        return renderSettings();
      case 'visa-applications':
        return renderVisaApplications();
      default:
        return renderOverview();
    }
  };

  // Check for loading and error states *after* all hooks have been defined
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600">Error loading dashboard: {error}</div>
      </div>
    );
  }

  // Main return statement for the dashboard UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header 
        isLoggedIn={true}
        userName={userData?.name}
        onLoginClick={handleLoginClick}
        onSignUpClick={handleSignUpClick}
        onLogoutClick={handleLogoutClick}
        onDashboardClick={handleDashboardClick}
        onHomeClick={handleHomeClick}
        onFeaturesClick={handleFeaturesClick}
        onPricingClick={handlePricingClick}
        onContactClick={handleContactClick}
      />
      <div className="flex flex-1 pt-16"> {/* Adjust pt-16 for header height */}
        {/* Fixed Sidebar — desktop */}
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 shadow-md z-10 hidden md:block">
          <Sidebar onNavigate={setActiveTab} currentTab={activeTab} />
        </div>

        {/* Mobile navigation drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="absolute left-0 top-16 bottom-0 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-xl dark:bg-gray-800">
              <Sidebar
                onNavigate={(tab) => {
                  setActiveTab(tab);
                  setMobileNavOpen(false);
                }}
                currentTab={activeTab}
              />
            </div>
          </div>
        )}
        
        {/* Main content area with padding */}
        <main className="flex-1 md:pl-64 pb-20 md:pb-0">
          <div className="container mx-auto py-8 px-4">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm md:hidden dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Dashboard Menu
            </button>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab} // Key change triggers animation
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {/* Render content using the helper function */}
                {renderActiveTabContent()} 
              </motion.div>
            </AnimatePresence>

            {/* Country Details Modal */}
            {showCountryModal && selectedCountry && (
              <CountryDetailsModal
                isOpen={showCountryModal} 
                countryName={selectedCountry.name}
                countryCode={selectedCountry.code}
                visaDetails={selectedCountry.visaDetails}
                onClose={() => setShowCountryModal(false)}
                onSaveToList={handleSaveFromModal} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}; // End of Dashboard component definition

export default Dashboard; 