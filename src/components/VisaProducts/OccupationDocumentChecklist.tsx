import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaBriefcase,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaClipboardCheck,
  FaGraduationCap,
  FaHome,
  FaPassport,
  FaUserClock,
} from 'react-icons/fa';
import type {
  DocumentSectionKind,
  OccupationChecklistConfig,
  OccupationProfile,
  OccupationProfileId,
} from '../../types/occupationDocuments';

const PROFILE_META: Record<
  OccupationProfileId,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  employed: { icon: FaBriefcase, color: 'text-teal-600' },
  business_owner: { icon: FaBuilding, color: 'text-emerald-600' },
  student: { icon: FaGraduationCap, color: 'text-sky-600' },
  unemployed: { icon: FaHome, color: 'text-amber-600' },
  retired: { icon: FaUserClock, color: 'text-violet-600' },
};

const SECTION_STYLES: Record<
  DocumentSectionKind,
  { border: string; badge: string; dot: string }
> = {
  required: {
    border: 'border-l-teal-500',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200',
    dot: 'bg-teal-500',
  },
  additional: {
    border: 'border-l-amber-400',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
    dot: 'bg-amber-400',
  },
  optional: {
    border: 'border-l-slate-400',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-200',
    dot: 'bg-slate-400',
  },
};

interface OccupationDocumentChecklistProps {
  config: OccupationChecklistConfig;
}

const OccupationDocumentChecklist: React.FC<OccupationDocumentChecklistProps> = ({ config }) => {
  const [activeProfileId, setActiveProfileId] = useState<OccupationProfileId>('employed');
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const activeProfile: OccupationProfile =
    config.profiles.find((p) => p.id === activeProfileId) ?? config.profiles[0];

  const allItemIds = useMemo(
    () => activeProfile.sections.flatMap((section) => section.items.map((item) => item.id)),
    [activeProfile]
  );

  const checkedCount = allItemIds.filter((id) => checkedIds.has(id)).length;
  const progress = allItemIds.length ? Math.round((checkedCount / allItemIds.length) * 100) : 0;

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleProfileChange = (id: OccupationProfileId) => {
    setActiveProfileId(id);
    setCheckedIds(new Set());
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-teal-400 px-6 py-6 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-6 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <FaPassport className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Your document checklist</h2>
              <p className="mt-1 max-w-xl text-sm text-teal-50/90">
                Pick your situation below — we&apos;ll show what to gather for{' '}
                <span className="font-semibold text-white">{config.destinationLabel}</span>.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            {config.sourceNote}
          </span>
        </div>
      </div>

      <div className="p-6">
        {/* Profile selector */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          I am currently…
        </p>
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {config.profiles.map((profile) => {
            const meta = PROFILE_META[profile.id];
            const Icon = meta.icon;
            const isActive = activeProfileId === profile.id;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleProfileChange(profile.id)}
                className={`flex min-w-[7.5rem] shrink-0 flex-col items-center gap-2 rounded-xl border-2 px-3 py-3 text-center transition-all ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 shadow-sm dark:border-primary-400 dark:bg-primary-900/20'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-900/40 dark:hover:border-gray-500'
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isActive ? 'bg-white shadow dark:bg-gray-800' : 'bg-white/80 dark:bg-gray-800'
                  }`}
                >
                  <Icon className={`text-lg ${isActive ? meta.color : 'text-gray-400'}`} />
                </span>
                <span
                  className={`text-xs font-semibold leading-tight ${
                    isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {profile.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active profile summary + progress */}
        <div className="mb-5 rounded-xl bg-gray-50 p-4 dark:bg-gray-900/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{activeProfile.label}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{activeProfile.description}</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <FaClipboardCheck className="text-primary-500" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {checkedCount} of {allItemIds.length} ticked off
              </span>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-teal-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {collapsed ? <FaChevronDown /> : <FaChevronUp />}
          {collapsed ? 'Show document list' : 'Hide document list'}
        </button>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key={activeProfileId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {activeProfile.sections.map((section) => {
                const styles = SECTION_STYLES[section.kind];
                return (
                  <div
                    key={section.kind}
                    className={`rounded-xl border border-gray-100 border-l-4 bg-white pl-1 dark:border-gray-700 dark:bg-gray-800/50 ${styles.border}`}
                  >
                    <div className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}>
                          {section.title}
                        </span>
                        {section.subtitle && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{section.subtitle}</span>
                        )}
                      </div>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                      {section.items.map((item) => {
                        const isChecked = checkedIds.has(item.id);
                        return (
                          <li key={item.id}>
                            <label className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/30">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(item.id)}
                                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className={`h-2 w-2 mt-1.5 shrink-0 rounded-full ${styles.dot}`} />
                              <span className="min-w-0 flex-1">
                                <span
                                  className={`block text-sm font-medium ${
                                    isChecked
                                      ? 'text-gray-400 line-through dark:text-gray-500'
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {item.hint && (
                                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                                    {item.hint}
                                  </span>
                                )}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          This checklist is a planning guide — consulates may request extra documents based on your
          nationality, travel history, and application details. Hydra generates a final tailored list
          when you start your application.
        </p>
      </div>
    </motion.section>
  );
};

export default OccupationDocumentChecklist;
