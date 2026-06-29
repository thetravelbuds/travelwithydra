import React from 'react';
import { motion } from 'framer-motion';
import { FaFileAlt, FaFolderOpen } from 'react-icons/fa';
import {
  SCHENGEN_PACKET_PREVIEW_DOCUMENTS,
  type SchengenPacketDocument,
} from '../../config/schengenVisaContent';
import { PLATFORM_NAME } from '../../config/brand';

interface SchengenApplicationPacketPreviewProps {
  countryName: string;
  className?: string;
}

function PacketSheet({
  doc,
  index,
  total,
}: {
  doc: SchengenPacketDocument;
  index: number;
  total: number;
}) {
  const depth = total - index - 1;
  const offsetY = depth * 28;
  const offsetX = depth * 4;
  const scale = 1 - depth * 0.03;
  const opacity = Math.max(0.35, 1 - depth * 0.12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="absolute left-0 right-0 mx-auto w-full max-w-sm"
      style={{
        top: offsetY,
        transform: `translateX(${offsetX}px) scale(${scale})`,
        zIndex: index,
      }}
    >
      <div
        className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md dark:border-gray-600 dark:bg-gray-800"
        style={{ borderTopWidth: 4, borderTopColor: doc.accent }}
      >
        <div className="flex items-start gap-3 px-4 py-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white"
            style={{ backgroundColor: doc.accent }}
          >
            <FaFileAlt className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {doc.label}
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{doc.subtitle}</p>
          </div>
          <span className="shrink-0 text-xs font-medium text-gray-400">{index + 1}</span>
        </div>
        <div className="space-y-1.5 border-t border-gray-100 bg-gray-50/80 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="h-1.5 w-full rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-1.5 w-4/5 rounded bg-gray-200 dark:bg-gray-600" />
          <div className="h-1.5 w-3/5 rounded bg-gray-100 dark:bg-gray-700" />
        </div>
      </div>
    </motion.div>
  );
}

const SchengenApplicationPacketPreview: React.FC<SchengenApplicationPacketPreviewProps> = ({
  countryName,
  className = '',
}) => {
  const visibleStack = SCHENGEN_PACKET_PREVIEW_DOCUMENTS.slice(0, 6);
  const remaining = SCHENGEN_PACKET_PREVIEW_DOCUMENTS.slice(6);
  const stackHeight = 56 + visibleStack.length * 28;

  return (
    <section
      className={`rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-white p-6 shadow-sm dark:border-indigo-900/40 dark:from-indigo-950/30 dark:to-gray-800 ${className}`}
    >
      <div className="mb-6 flex items-start gap-3">
        <FaFolderOpen className="mt-1 text-2xl text-indigo-600 dark:text-indigo-400" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your final application preview
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {PLATFORM_NAME} prepares a complete {countryName} Schengen application packet with all
            necessary documents arranged for your appointment.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            What you get
          </p>
          <ul className="space-y-2">
            {[
              'Completed Schengen application form',
              'Cover letter tailored to your trip',
              'Documents sorted in visa officer review order',
              'Appointment confirmation',
              'Checklist so nothing is missing on the day',
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-lg border border-indigo-100 bg-white/70 px-3 py-2 text-xs text-gray-500 dark:border-indigo-900/30 dark:bg-gray-900/40 dark:text-gray-400">
            For illustrative purposes only. Your actual packet will reflect your personal details,
            destination ({countryName}), and document checklist.
          </p>
        </div>

        <div className="flex flex-col items-center">
          <p className="mb-3 self-start text-sm font-semibold text-gray-700 dark:text-gray-300">
            Application packet
          </p>
          <div className="relative w-full" style={{ height: stackHeight, maxWidth: 320 }}>
            {visibleStack.map((doc, index) => (
              <PacketSheet key={doc.id} doc={doc} index={index} total={visibleStack.length} />
            ))}
          </div>
          {remaining.length > 0 && (
            <ul className="mt-3 w-full max-w-sm space-y-1 text-xs text-gray-600 dark:text-gray-400">
              {remaining.map((doc, i) => (
                <li key={doc.id} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: doc.accent }}
                  />
                  {doc.label}
                  <span className="text-gray-400">· {i + visibleStack.length + 1}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
            {SCHENGEN_PACKET_PREVIEW_DOCUMENTS.length} documents · arranged for submission
          </p>
        </div>
      </div>
    </section>
  );
};

export default SchengenApplicationPacketPreview;
