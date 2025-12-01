"use client";

import { motion } from "framer-motion";
import { MessageSquare, Brain, Users, FileText, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    label: "You type",
    description: "Describe your startup in plain English",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Users,
    label: "6 agents argue",
    description: "Funding, runway, investors, priorities",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: FileText,
    label: "VC-grade strategy",
    description: "Specific numbers, not generic ranges",
    color: "from-emerald-500 to-emerald-600",
  },
];

export default function AnimatedFlow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Glow effect */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-2xl blur-xl opacity-20`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
              
              {/* Card */}
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm w-[200px]">
                {/* Step number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-r from-white/10 to-white/5 border border-white/20 flex items-center justify-center text-white text-sm font-bold">
                  {i + 1}
                </div>
                
                {/* Icon */}
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-4`}
                  animate={i === 1 ? {
                    rotate: [0, -5, 5, -5, 0],
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                >
                  <step.icon className="h-6 w-6 text-white" />
                </motion.div>
                
                {/* Text */}
                <h4 className="text-white font-semibold mb-1">{step.label}</h4>
                <p className="text-gray-400 text-sm">{step.description}</p>
                
                {/* Animated dots for "agents argue" step */}
                {i === 1 && (
                  <div className="flex gap-1 mt-3">
                    {[0, 1, 2].map((dot) => (
                      <motion.div
                        key={dot}
                        className="w-1.5 h-1.5 rounded-full bg-purple-400"
                        animate={{
                          y: [0, -4, 0],
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: dot * 0.15,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
            
            {/* Arrow connector */}
            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, delay: i * 0.2 + 0.3 }}
                viewport={{ once: true }}
                className="hidden md:flex items-center mx-4"
              >
                <div className="w-12 h-[2px] bg-gradient-to-r from-white/20 to-white/5" />
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-4 w-4 text-white/30" />
                </motion.div>
              </motion.div>
            )}
            
            {/* Mobile arrow */}
            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                viewport={{ once: true }}
                className="md:hidden my-2"
              >
                <motion.div
                  animate={{ y: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-5 w-5 text-white/30 rotate-90" />
                </motion.div>
              </motion.div>
            )}
          </div>
        ))}
      </div>
      
      {/* Time indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        viewport={{ once: true }}
        className="text-center mt-8"
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm">
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-emerald-400"
          />
          ~30 seconds total
        </span>
      </motion.div>
    </motion.div>
  );
}

