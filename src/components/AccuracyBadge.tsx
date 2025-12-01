'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AccuracyBadge() {
  const [accuracy, setAccuracy] = useState(89);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.accuracyRating) {
          setAccuracy(data.accuracyRating);
        }
      })
      .catch(() => {
        // Keep default value on error
      });
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="bg-emerald-500/10 border border-emerald-500/30 rounded-full px-3 py-1.5 text-xs text-emerald-400 font-medium"
    >
      {accuracy}% Founders Call It &quot;Scary Accurate&quot;
    </motion.div>
  );
}

