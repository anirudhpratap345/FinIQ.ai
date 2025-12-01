'use client';

import { useEffect, useState } from 'react';

interface FormProgressProps {
  /** Current section index (0-3) based on form scroll position or active field */
  currentSection?: number;
}

const steps = ['Info', 'Team', 'Traction', 'Financial'];

export default function FormProgress({ currentSection = 0 }: FormProgressProps) {
  const [activeIndex, setActiveIndex] = useState(currentSection);
  
  useEffect(() => {
    setActiveIndex(currentSection);
  }, [currentSection]);

  // Calculate progress percentage
  const progress = ((activeIndex + 1) / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto mb-8">
      {/* Step labels */}
      <div className="flex justify-between text-sm mb-3">
        {steps.map((step, i) => (
          <span 
            key={step} 
            className={`transition-colors duration-300 ${
              i <= activeIndex 
                ? 'text-zinc-300 font-medium' 
                : 'text-zinc-600'
            }`}
          >
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-1.5 ${
              i < activeIndex 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : i === activeIndex 
                  ? 'bg-white/10 text-white' 
                  : 'bg-zinc-800 text-zinc-600'
            }`}>
              {i < activeIndex ? '✓' : i + 1}
            </span>
            {step}
          </span>
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Step indicator */}
      <p className="text-xs text-zinc-600 mt-2 text-center">
        Step {activeIndex + 1} of {steps.length}
        {activeIndex === steps.length - 1 && (
          <span className="text-emerald-500 ml-2">• Almost done!</span>
        )}
      </p>
    </div>
  );
}

