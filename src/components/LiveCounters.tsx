"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, DollarSign } from "lucide-react";

// Simulated base values - in production, fetch from API
const BASE_VALUES = {
  strategies: 1247,
  accuracy: 87,
  capital: 1.8,
};

function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return (
    <span className="tabular-nums">
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

export default function LiveCounters() {
  const [values, setValues] = useState(BASE_VALUES);
  
  // Simulate live updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setValues(prev => ({
        strategies: prev.strategies + Math.floor(Math.random() * 3),
        accuracy: prev.accuracy, // Keep accuracy stable
        capital: +(prev.capital + Math.random() * 0.01).toFixed(2),
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const counters = [
    {
      icon: TrendingUp,
      value: values.strategies,
      label: "strategies generated",
      suffix: "",
      prefix: "",
    },
    {
      icon: Target,
      value: values.accuracy,
      label: 'said "scary accurate"',
      suffix: "%",
      prefix: "",
    },
    {
      icon: DollarSign,
      value: values.capital,
      label: "total capital recommended",
      suffix: "B+",
      prefix: "$",
    },
  ];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm"
    >
      {counters.map((counter, i) => (
        <motion.div
          key={counter.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 1.3 + i * 0.1 }}
          className="flex items-center gap-2 text-gray-400"
        >
          <counter.icon className="h-4 w-4 text-blue-400" />
          <span className="text-white font-semibold">
            <AnimatedNumber value={counter.value} suffix={counter.suffix} prefix={counter.prefix} />
          </span>
          <span>{counter.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

