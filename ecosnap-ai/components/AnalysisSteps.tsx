"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, icon: "🔍", label: "Analyzing image…" },
  { id: 2, icon: "🧬", label: "Detecting pollution category…" },
  { id: 3, icon: "⚠️", label: "Calculating urgency…" },
  { id: 4, icon: "💡", label: "Generating recommendations…" },
] as const;

// Each step is visible for this many ms before advancing.
// 4 steps × 550 ms ≈ 2.2 s total, leaving 300 ms for the final fade-out.
const STEP_DURATION_MS = 550;

interface AnalysisStepsProps {
  /** Called after all steps finish so the parent can reveal the result card. */
  onComplete: () => void;
}

export default function AnalysisSteps({ onComplete }: AnalysisStepsProps) {
  const [currentStep, setCurrentStep] = useState(0); // 0-based index

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      // All steps done — notify parent
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCurrentStep((s) => s + 1);
    }, STEP_DURATION_MS);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  return (
    <motion.div
      key="analysis-steps"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="mt-8 rounded-2xl border border-green-200 bg-white shadow-md overflow-hidden"
      aria-live="polite"
      aria-label="AI analysis in progress"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-4 flex items-center gap-3">
        {/* Pulsing brain icon */}
        <motion.span
          className="text-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden="true"
        >
          🤖
        </motion.span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-green-100 mb-0.5">
            AI Analysis
          </p>
          <p className="text-xl font-bold text-white leading-tight">
            Processing your report…
          </p>
        </div>
      </div>

      {/* Steps list */}
      <div className="px-6 py-5 space-y-3">
        {STEPS.map((step, index) => {
          const isDone    = index < currentStep;
          const isActive  = index === currentStep;
          const isPending = index > currentStep;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors
                ${isActive  ? "bg-green-50 border border-green-200" : ""}
                ${isDone    ? "bg-gray-50  border border-gray-100"  : ""}
                ${isPending ? "bg-white    border border-gray-100"  : ""}
              `}
            >
              {/* Status icon */}
              <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.span
                      key="done"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      className="text-green-600 text-lg"
                      aria-hidden="true"
                    >
                      ✅
                    </motion.span>
                  ) : isActive ? (
                    <motion.span
                      key="active"
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      aria-hidden="true"
                    >
                      {/* Spinning ring */}
                      <svg
                        className="w-5 h-5 text-green-600 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12" cy="12" r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="pending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-gray-300 text-lg"
                      aria-hidden="true"
                    >
                      ○
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Step label */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base" aria-hidden="true">{step.icon}</span>
                <span
                  className={`text-sm font-medium truncate ${
                    isDone   ? "text-gray-400 line-through" :
                    isActive ? "text-green-800" :
                               "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Active step: animated dots */}
              {isActive && (
                <motion.div
                  className="ml-auto flex gap-1 shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  aria-hidden="true"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-green-500"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Progress</span>
            <span>{Math.round((currentStep / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
              initial={{ width: "0%" }}
              animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
