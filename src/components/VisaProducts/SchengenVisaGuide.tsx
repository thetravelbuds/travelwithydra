import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaExclamationTriangle,
  FaGift,
  FaQuestionCircle,
  FaRoute,
} from 'react-icons/fa';
import { PLATFORM_NAME } from '../../config/brand';
import {
  getSchengenFaqCategories,
  SCHENGEN_APPLICATION_PROCESS,
  SCHENGEN_REJECTION_REASONS,
  SCHENGEN_VISA_QUICK_FACTS,
  SCHENGEN_WHAT_YOU_GET,
} from '../../config/schengenVisaContent';
import SchengenApplicationPacketPreview from './SchengenApplicationPacketPreview';
import OccupationDocumentChecklist from './OccupationDocumentChecklist';
import { getSchengenOccupationChecklist } from '../../config/occupationDocumentContent';

interface SchengenVisaGuideProps {
  countryName: string;
}

const SchengenVisaGuide: React.FC<SchengenVisaGuideProps> = ({ countryName }) => {
  const faqCategories = getSchengenFaqCategories(countryName);
  const occupationChecklist = getSchengenOccupationChecklist(countryName);
  const [activeFaqCategory, setActiveFaqCategory] = useState(faqCategories[0].id);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const activeCategory =
    faqCategories.find((c) => c.id === activeFaqCategory) ?? faqCategories[0];

  return (
    <div className="mb-8 space-y-8">
      {/* Process */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="mb-6 flex items-center gap-3">
          <FaRoute className="text-xl text-primary-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              How to get your {countryName} Schengen visa
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {SCHENGEN_VISA_QUICK_FACTS.applyBeforeTravel}. Processing:{' '}
              {SCHENGEN_VISA_QUICK_FACTS.processingTime}.
            </p>
          </div>
        </div>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SCHENGEN_APPLICATION_PROCESS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </motion.section>

      <OccupationDocumentChecklist config={occupationChecklist} />

      {/* Application packet preview */}
      <SchengenApplicationPacketPreview countryName={countryName} />

      {/* What you get */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="mb-4 flex items-center gap-3">
          <FaGift className="text-xl text-primary-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            What {PLATFORM_NAME} includes
          </h2>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SCHENGEN_WHAT_YOU_GET.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
              <FaCheckCircle className="mt-0.5 shrink-0 text-primary-500" />
              {item}
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Rejection reasons */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rounded-xl border border-red-100 bg-red-50/50 p-6 dark:border-red-900/30 dark:bg-red-950/20"
      >
        <div className="mb-4 flex items-center gap-3">
          <FaExclamationTriangle className="text-xl text-red-600 dark:text-red-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Common rejection reasons
          </h2>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Avoid these pitfalls when preparing your {countryName} Schengen application:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SCHENGEN_REJECTION_REASONS.map((reason) => (
            <div
              key={reason.title}
              className="rounded-lg border border-red-100 bg-white/80 p-3 dark:border-red-900/30 dark:bg-gray-900/40"
            >
              <p className="font-medium text-gray-900 dark:text-white">{reason.title}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{reason.description}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* FAQs */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="mb-4 flex items-center gap-3">
          <FaQuestionCircle className="text-xl text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Frequently asked questions
          </h2>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {faqCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setActiveFaqCategory(category.id);
                setOpenFaqIndex(0);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFaqCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
            <FaClipboardList className="text-primary-500" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {activeCategory.label}
            </span>
          </div>
          {activeCategory.items.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.question}
                className="border-b border-gray-200 last:border-b-0 dark:border-gray-700"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white">{faq.question}</h3>
                  {isOpen ? (
                    <FaChevronUp className="shrink-0 text-gray-500" />
                  ) : (
                    <FaChevronDown className="shrink-0 text-gray-500" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
};

export default SchengenVisaGuide;
