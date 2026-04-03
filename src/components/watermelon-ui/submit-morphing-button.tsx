"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { Loader2 } from "lucide-react";

interface SubmitMorphingButtonProps {
  loading: boolean;
  disabled?: boolean;
}

const springConfig = {
  type: "spring",
  stiffness: 240,
  damping: 18,
  mass: 1.1,
} as const;

export function SubmitMorphingButton({ loading, disabled }: SubmitMorphingButtonProps) {
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Collapse hover state when loading starts
  useEffect(() => {
    if (loading) setHovered(false);
  }, [loading]);

  const isExpanded = hovered && !loading && !disabled;

  return (
    <motion.div
      ref={containerRef}
      layout
      transition={springConfig}
      style={{ borderRadius: 32 }}
      className={`relative flex items-center overflow-hidden border-[1.1px] transition-colors duration-300 ${
        disabled
          ? "border-slate-200 opacity-50 cursor-not-allowed"
          : "border-[#e7e6e6a6] cursor-pointer"
      } ${
        isExpanded
          ? "bg-indigo-600 p-1 shadow-lg shadow-indigo-200"
          : loading
          ? "bg-indigo-100 p-0"
          : "bg-indigo-600 p-0"
      }`}
      onMouseEnter={() => { if (!disabled && !loading) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Expanded label */}
      <AnimatePresence mode="popLayout">
        {isExpanded && (
          <motion.div
            key="label"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={springConfig}
            className="flex flex-1 items-center pl-5 pr-2"
          >
            <span className="text-lg font-semibold text-white whitespace-nowrap">
              Optimize My Resume
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The morphing button itself */}
      <motion.button
        layout
        type="submit"
        disabled={disabled || loading}
        transition={springConfig}
        className={`relative flex items-center justify-center gap-2.5 rounded-full font-bold whitespace-nowrap transition-colors duration-300 ${
          isExpanded
            ? "bg-white/95 px-5 py-3 text-indigo-700 shadow-sm hover:bg-white"
            : loading
            ? "bg-indigo-100 px-7 py-4 text-indigo-500"
            : "bg-indigo-600 px-7 py-4 text-white hover:bg-indigo-700"
        } disabled:cursor-not-allowed`}
      >
        {/* Icon */}
        <AnimatePresence mode="popLayout" initial={false}>
          {loading ? (
            <motion.span
              key="spinner"
              initial={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
              transition={springConfig}
            >
              <Loader2 size={20} className="animate-spin text-indigo-500" />
            </motion.span>
          ) : (
            <motion.span
              key="wand"
              initial={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
              transition={springConfig}
              className="origin-right"
            >
              <FaWandMagicSparkles
                className={`h-5 w-5 ${isExpanded ? "text-indigo-600" : "text-white"}`}
              />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Text */}
        <motion.span layout="position" className="text-lg tracking-tight">
          {loading ? "Running Pipeline…" : isExpanded ? "Go!" : "Optimize"}
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
