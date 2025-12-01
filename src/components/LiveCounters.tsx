"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Target, DollarSign } from "lucide-react";

interface Stats {
  totalStrategies: number;
  accuracyRating: number;
  totalCapitalRecommended: string;
  activeFounders?: number;
}

function AnimatedNumber({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);
  
  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 1500;
    const steps = 40;
    const increment = (end - start) / steps;
    let current = start;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplayValue(end);
        prevValue.current = end;
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
  const [stats, setStats] = useState<Stats>({
    totalStrategies: 1247,
    accuracyRating: 89,
    totalCapitalRecommended: '1.8B',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Stats fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Update every 10 seconds for "live" feel
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const counters = [
    {
      icon: TrendingUp,
      value: stats.totalStrategies,
      label: "strategies generated",
      suffix: "",
      prefix: "",
      isNumber: true,
    },
    {
      icon: Target,
      value: stats.accuracyRating,
      label: 'said "scary accurate"',
      suffix: "%",
      prefix: "",
      isNumber: true,
    },
    {
      icon: DollarSign,
      value: stats.totalCapitalRecommended,
      label: "total capital recommended",
      suffix: "+",
      prefix: "$",
      isNumber: false,
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
            {counter.isNumber ? (
              <AnimatedNumber value={counter.value as number} suffix={counter.suffix} prefix={counter.prefix} />
            ) : (
              <span>{counter.prefix}{counter.value}{counter.suffix}</span>
            )}
          </span>
          <span>{counter.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

