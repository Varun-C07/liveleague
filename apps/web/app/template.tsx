"use client";
import { MotionConfig, motion } from "framer-motion";

// Runs per route navigation — a subtle fade/rise on each page. MotionConfig
// honors the OS "reduce motion" setting for everything beneath it.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
