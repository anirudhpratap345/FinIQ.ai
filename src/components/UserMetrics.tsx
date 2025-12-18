"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

interface UserMetricsProps {
  generationCount?: number;
  averageRating?: number;
  accuracyPercentage?: number;
}

export default function UserMetrics({
  generationCount = 0,
  averageRating = 0,
  accuracyPercentage = 89,
}: UserMetricsProps) {
  const { data: session } = useSession();

  // If not signed in, show login CTA
  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-strong rounded-xl p-6 border border-white/10 text-center"
      >
        <p className="text-white/70">
          📊 Sign in to track your strategy generation progress and see personalized metrics.
        </p>
      </motion.div>
    );
  }

  // Signed in - show metrics
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-strong rounded-xl p-6 border border-white/10"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl">📊</span>
        Your Progress
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Generation Count */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-3xl font-bold text-cyan-400 mb-1">
            {generationCount}
          </div>
          <div className="text-xs text-white/60">
            Strategies Generated
          </div>
        </div>

        {/* Average Rating */}
        {averageRating > 0 && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {averageRating.toFixed(1)}/5
            </div>
            <div className="text-xs text-white/60">
              Avg Rating
            </div>
          </div>
        )}

        {/* Accuracy Badge */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="text-3xl font-bold text-purple-400 mb-1">
            {accuracyPercentage}%
          </div>
          <div className="text-xs text-white/60">
            Rated "Scary Accurate"
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-white/50">
          Stats updated in real-time as you generate strategies
        </p>
      </div>
    </motion.div>
  );
}
