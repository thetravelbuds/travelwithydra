import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList,
  FaFileAlt,
  FaPlaneDeparture,
  FaQuestionCircle,
  FaRoute,
  FaShieldAlt,
} from 'react-icons/fa';
import {
  MOROCCO_APPLICATION_STEPS,
  MOROCCO_CORE_DOCUMENTS,
  MOROCCO_ENTRY_REQUIREMENTS,
  MOROCCO_EVISA_QUICK_FACTS,
  MOROCCO_FAQ_CATEGORIES,
} from '../../config/moroccoEvisaContent';

const MoroccoEvisaGuide: React.FC = () => {
  const [activeFaqCategory, setActiveFaqCategory] = useState(MOROCCO_FAQ_CATEGORIES[0].id);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const activeCategory =
    MOROCCO_FAQ_CATEGORIES.find((c) => c.id === activeFaqCategory) ?? MOROCCO_FAQ_CATEGORIES[0];

  return (
    <div className="mb-8 space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-primary-100 bg-primary-50/60 p-6 dark:border-primary-900 dark:bg-primary-950/30"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Morocco eVisa requirements at a glance
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          The Morocco eVisa is a fully online tourist authorisation for eligible nationalities.
          Typical conditions: {MOROCCO_EVISA_QUICK_FACTS.entryType.toLowerCase()},{' '}
          {MOROCCO_EVISA_QUICK_FACTS.lengthOfStay}, and validity of{' '}
          {MOROCCO_EVISA_QUICK_FACTS.visaValidity}. {MOROCCO_EVISA_QUICK_FACTS.applyBeforeTravel}.
          Use this page to review documents, travel insurance rules, and apply for your Morocco eVisa
          online with Hydra.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <FaCheckCircle className="mt-0.5 shrink-0 text-primary-600" />
            <span>Apply online — no embassy appointment for the eVisa route</span>
          </li>
          <li className="flex items-start gap-2">
            <FaCheckCircle className="mt-0.5 shrink-0 text-primary-600" />
            <span>Passport, photo, accommodation, return ticket, and insurance</span>
          </li>
          <li className="flex items-start gap-2">
            <FaCheckCircle className="mt-0.5 shrink-0 text-primary-600" />
            <span>Digital approval delivered by email</span>
          </li>
          <li className="flex items-start gap-2">
            <FaCheckCircle className="mt-0.5 shrink-0 text-primary-600" />
            <span>Print your Morocco eVisa before you travel</span>
          </li>
        </ul>
      </motion.section>

      {/* Application process */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="mb-6 flex items-center gap-3">
          <FaRoute className="text-xl text-primary-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How to get your Morocco eVisa</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              100% online — no embassy visit. {MOROCCO_EVISA_QUICK_FACTS.applyBeforeTravel}.
            </p>
          </div>
        </div>
        <ol className="grid gap-4 md:grid-cols-2">
          {MOROCCO_APPLICATION_STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-900/40"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
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

      {/* Requirements grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-5 flex items-center gap-3">
            <FaFileAlt className="text-xl text-primary-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Visa requirements</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Documents commonly required for a Morocco e-Visa application:
          </p>
          <ul className="space-y-3">
            {MOROCCO_CORE_DOCUMENTS.map((doc) => (
              <li
                key={doc.name}
                className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40"
              >
                <FaCheckCircle className="mt-0.5 shrink-0 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{doc.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="mb-5 flex items-center gap-3">
            <FaPlaneDeparture className="text-xl text-primary-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">At the border</h2>
          </div>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Immigration officers may ask to see the following on arrival in Morocco:
          </p>
          <ul className="space-y-2">
            {MOROCCO_ENTRY_REQUIREMENTS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <FaShieldAlt className="mt-0.5 shrink-0 text-primary-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-100">
            <strong>Tip:</strong> Print your e-Visa and carry a digital copy. Tourist visas do not allow
            work or study — only leisure travel and visiting family or friends.
          </div>
        </motion.section>
      </div>

      {/* Categorized FAQs */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="mb-4 flex items-center gap-3">
          <FaQuestionCircle className="text-xl text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Frequently asked questions</h2>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {MOROCCO_FAQ_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setActiveFaqCategory(category.id);
                setOpenFaqIndex(0);
              }}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeFaqCategory === category.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
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

export default MoroccoEvisaGuide;
