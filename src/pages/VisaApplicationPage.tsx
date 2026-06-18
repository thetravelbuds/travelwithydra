import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import VisaApplicationStepper from '../components/EVisa/VisaApplicationStepper';
import visaApplicationsService from '../lib/api/visaApplications';
import authService from '../lib/api/auth';
import {
  sendVisaApplicationToCompany,
} from '../services/emailService';
import transactionalEmailService from '../lib/api/transactionalEmail';
import { getCountryName } from '../data/countryCodes';

const VisaApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { nationality, destination } = useParams<{ nationality: string; destination: string }>();

  const handleApplicationComplete = async (data: {
    travelers?: unknown[];
    travelDates?: { arrival?: string; departure?: string };
    accommodation?: Record<string, unknown>;
    draftId?: string | null;
  }) => {
    if (!nationality || !destination) {
      navigate('/dashboard');
      return;
    }

    const { application, error } = await visaApplicationsService.createApplication({
      nationalityCode: nationality,
      destinationCode: destination,
      entryDate: data.travelDates?.arrival,
      exitDate: data.travelDates?.departure,
      applicationData: data as Record<string, unknown>,
      paymentStatus: 'pending',
      draftId: data.draftId ?? undefined,
    });

    if (error || !application) {
      console.error('Failed to save visa application:', error);
      alert('Your application could not be saved. Please try again.');
      return;
    }

    try {
      const { user } = await authService.getCurrentUser();
      await sendVisaApplicationToCompany({
        applicationId: application.id,
        nationalityCode: nationality,
        destinationCode: destination,
        userEmail: user?.email,
        userName: user?.full_name || user?.email?.split('@')[0],
        entryDate: data.travelDates?.arrival,
        exitDate: data.travelDates?.departure,
        paymentStatus: 'pending',
      });

      if (user?.email) {
        await transactionalEmailService.sendApplicationSubmitted({
          name: user.full_name || 'there',
          email: user.email,
          destination: getCountryName(destination) || destination.toUpperCase(),
          nationality: nationality.toUpperCase(),
          application_id: application.id,
        });
      }
    } catch (emailError) {
      console.error('Failed to send application notification emails:', emailError);
    }

    navigate(`/payment/${application.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Visa Application</h1>
          <p className="mt-2 text-gray-600">Complete your visa application in 5 easy steps</p>
        </div>

        <VisaApplicationStepper
          destinationCode={destination}
          nationalityCode={nationality}
          searchParams={location.search}
          onComplete={handleApplicationComplete}
        />
      </div>
    </div>
  );
};

export default VisaApplicationPage;
