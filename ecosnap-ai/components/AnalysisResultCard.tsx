"use client";

import { motion } from "framer-motion";
import UrgencyBadge from "@/components/UrgencyBadge";
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  WASTE_TYPE_ICON,
  WASTE_TYPE_LABEL,
} from "@/lib/pollution-meta";
import type { PollutionCategory, WasteType, UrgencyLevel } from "@/types/report";

export interface AnalysisResult {
  category:   PollutionCategory;
  waste_type: WasteType | null;
  confidence: number;
  urgency:    UrgencyLevel;
  actions:    string[];
}

interface AnalysisResultCardProps {
  result: AnalysisResult;
}

const containerVariants = {
  hidden:   {},
  visible:  { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden:   { opacity: 0, y: 16 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function AnalysisResultCard({ result }: AnalysisResultCardProps) {
  const { category, waste_type, confidence, urgency, actions } = result;

  const primaryLabel   = CATEGORY_LABEL[category] ?? category;
  const categoryIcon   = CATEGORY_ICON[category]  ?? "⚠️";
  const wasteLabel     = (category === "waste_pollution" && waste_type)
    ? WASTE_TYPE_LABEL[waste_type]
    : null;
  const wasteIcon      = (category === "waste_pollution" && waste_type)
    ? WASTE_TYPE_ICON[waste_type]
    : null;

  return (
    <motion.div
      key="result-card"
      initial={{ opacity: 0, scale: 0.97, y: 20 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="mt-8 rounded-2xl border border-green-200 bg-white shadow-md overflow-hidden"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-4"
      >
        <div className="flex items-start gap-3">
          <motion.span
            className="text-3xl mt-0.5 shrink-0"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.15 }}
            aria-hidden="true"
          >
            {wasteIcon ?? categoryIcon}
          </motion.span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-green-100 mb-0.5">
              Analysis Complete
            </p>
            <h2 className="text-xl font-bold text-white leading-tight">
              {primaryLabel}
            </h2>
            {wasteLabel && (
              <p className="text-sm text-green-100 mt-0.5">
                {wasteLabel}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <motion.div
        className="px-6 py-5 space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Confidence + Urgency row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          {/* Confidence tile */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Confidence
            </p>
            <span className="text-2xl font-bold text-gray-900">{confidence}%</span>
            <div
              role="progressbar"
              aria-valuenow={confidence}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Confidence: ${confidence}%`}
              className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden"
            >
              <motion.div
                className="h-full rounded-full bg-green-500"
                initial={{ width: "0%" }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>

          {/* Urgency tile */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Urgency Level
            </p>
            <div className="mt-1">
              <UrgencyBadge level={urgency} />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {urgency === "Critical" && "Immediate action required"}
              {urgency === "High"     && "Act as soon as possible"}
              {urgency === "Medium"   && "Address within a few days"}
              {urgency === "Low"      && "Schedule a community response"}
            </p>
          </div>
        </motion.div>

        {/* Recommended Actions */}
        <motion.div variants={itemVariants}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Recommended Actions
          </p>
          <ol className="space-y-2">
            {actions.map((action, index) => (
              <motion.li
                key={action}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: 0.35 + index * 0.08,
                  ease: "easeOut",
                }}
                className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-100 px-4 py-3"
              >
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-green-600 text-white
                             text-xs font-bold flex items-center justify-center mt-0.5"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{action}</span>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
