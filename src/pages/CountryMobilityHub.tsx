import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getFlagUrl } from '../utils/countries';
import { getPassportMobilityGroups, resolveCountryName } from '../utils/travelScoreEngine';
import { userProfileService } from '../lib/api/userProfile';

const sectionConfig = [
  { key: 'visaFree' as const, title: 'Visa-Free', color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
  { key: 'eta' as const, title: 'ETA / ESTA', color: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50' },
  { key: 'evisa' as const, title: 'eVisa', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  { key: 'visaOnArrival' as const, title: 'Visa on Arrival', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  { key: 'traditional' as const, title: 'Traditional Visa', color: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
];

const CountryMobilityHub: React.FC = () => {
  const { countryCode = '' } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();
  const code = countryCode.toUpperCase();
  const countryName = resolveCountryName(code);
  const groups = useMemo(() => getPassportMobilityGroups(code), [code]);

  const totals = useMemo(
    () => ({
      visaFree: groups.visaFree.length,
      evisa: groups.evisa.length + groups.eta.length,
      traditional: groups.traditional.length,
      voa: groups.visaOnArrival.length,
    }),
    [groups]
  );

  const handleDestinationClick = async (destCode: string) => {
    let userNat = '';
    let userRes = '';
    try {
      const { profile } = await userProfileService.getCurrentUserProfile();
      userNat = profile?.nationality || '';
      userRes = profile?.residency || profile?.nationality || '';
    } catch {
      // Guest — visa checker will prompt
    }

    const params = new URLSearchParams();
    if (userNat) params.set('nationality', userNat.length === 2 ? userNat.toLowerCase() : userNat);
    if (userRes) params.set('residence', userRes.length === 2 ? userRes.toLowerCase() : userRes);
    params.set('destination', destCode.toLowerCase());
    navigate(`/visa-checker?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-900 dark:to-gray-950 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-flex items-center gap-1"
        >
          ← Back to map
        </button>

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <img
              src={getFlagUrl(code.toLowerCase())}
              alt=""
              className="w-20 h-14 object-cover rounded-lg shadow-md"
            />
            <div className="text-center sm:text-left flex-1">
              <p className="text-sm uppercase tracking-wide text-teal-600 font-medium">Passport mobility</p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{countryName}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Where {countryName} passport holders can travel — informational overview only.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Visa-free', value: totals.visaFree, color: 'text-green-600' },
              { label: 'eVisa / ETA', value: totals.evisa, color: 'text-amber-600' },
              { label: 'On arrival', value: totals.voa, color: 'text-blue-600' },
              { label: 'Embassy visa', value: totals.traditional, color: 'text-red-600' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.header>

        <div className="space-y-8">
          {sectionConfig.map((section) => {
            const items = groups[section.key];
            if (!items.length) return null;

            return (
              <motion.section
                key={section.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border border-gray-100 dark:border-gray-700 ${section.bg} dark:bg-gray-800 p-6`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className={`w-3 h-3 rounded-full ${section.color}`} />
                  <h2 className={`text-xl font-semibold ${section.text} dark:text-white`}>
                    {section.title}
                    <span className="ml-2 text-sm font-normal text-gray-500">({items.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((dest) => (
                    <button
                      key={dest.code}
                      type="button"
                      onClick={() => handleDestinationClick(dest.code)}
                      className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 hover:border-teal-400 hover:shadow-md transition-all text-left"
                    >
                      <img
                        src={getFlagUrl(dest.code.toLowerCase())}
                        alt=""
                        className="w-10 h-7 object-cover rounded shadow-sm shrink-0 mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{dest.name}</p>
                        {dest.stay && (
                          <p className="text-xs text-teal-600 mt-0.5">Stay: {dest.stay}</p>
                        )}
                        {dest.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{dest.notes}</p>
                        )}
                        <p className="text-xs text-teal-600 mt-2 font-medium">View for your profile →</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CountryMobilityHub;
