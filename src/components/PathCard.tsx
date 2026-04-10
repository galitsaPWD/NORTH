'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Path, PathColor } from '@/types';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  Clock, 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface PathCardProps {
  path: Path;
  index: number;
}

const COLOR_MAP: Record<PathColor, { border: string, bg: string, text: string, accent: string }> = {
  teal: { 
    border: 'border-skill-technical/30', 
    bg: 'bg-skill-technical/5', 
    text: 'text-skill-technical',
    accent: 'bg-skill-technical'
  },
  purple: { 
    border: 'border-skill-creative/30', 
    bg: 'bg-skill-creative/5', 
    text: 'text-skill-creative',
    accent: 'bg-skill-creative'
  },
  amber: { 
    border: 'border-skill-people/30', 
    bg: 'bg-skill-people/5', 
    text: 'text-skill-people',
    accent: 'bg-skill-people'
  },
};

export const PathCard = ({ path, index }: PathCardProps) => {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const colors = COLOR_MAP[path.color] || COLOR_MAP.teal;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300",
        isExpanded ? cn(colors.border, colors.bg, "shadow-2xl shadow-black") : "border-border bg-surface hover:border-text-secondary/30"
      )}
    >
      {/* Fit Score Badge */}
      <div className={cn(
        "absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest",
        colors.accent,
        "text-background"
      )}>
        {path.fit_score}% Match
      </div>

      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-6"
      >
        <div className="flex flex-col gap-1 pr-16">
          <span className={cn("text-[10px] font-mono uppercase tracking-widest opacity-60", colors.text)}>Path {index + 1}</span>
          <h3 className="text-xl font-bold tracking-tight">{path.name}</h3>
        </div>

        <p className={cn("mt-3 text-sm text-text-secondary leading-relaxed transition-all", !isExpanded && "line-clamp-2")}>
          {path.why_it_fits}
        </p>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-text-secondary">
            <DollarSign className="w-3.5 h-3.5" />
            <span>${path.income_min.toLocaleString()} - ${path.income_max.toLocaleString()}/{path.income_period === 'month' ? 'mo' : 'yr'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-text-secondary">
            <Clock className="w-3.5 h-3.5" />
            <span>{path.time_to_first_dollar}</span>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 text-text-secondary group-hover:text-text-primary transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="p-6 pt-2 space-y-6">
              {/* Difficulty */}
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div className="flex items-center gap-2 text-xs font-mono text-text-secondary uppercase">
                  <BarChart3 className="w-4 h-4" />
                  Difficulty
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                  path.difficulty === 'easy' ? "bg-success text-success-neon" : 
                  path.difficulty === 'medium' ? "bg-amber-500/10 text-amber-500" :
                  "bg-red-500/10 text-red-500"
                )}>
                  {path.difficulty}
                </div>
              </div>

              {/* Steps */}
              <div>
                <h4 className="flex items-center gap-2 text-xs font-mono text-text-secondary uppercase tracking-widest mb-4">
                  <TrendingUp className="w-4 h-4" />
                  What to do this week
                </h4>
                <div className="space-y-3">
                  {path.first_steps.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start group/step">
                      <div className={cn("mt-1 p-0.5 rounded-full", colors.text)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-sm text-text-primary/90 group-hover/step:translate-x-1 transition-transform">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alert - Long Game */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex gap-3">
                <AlertCircle className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />
                <p className="text-[11px] text-text-secondary leading-normal">
                  This path has been calculated based on your reported risk tolerance (Q5) and 
                  time availability (Q3). Proceed with focus.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
