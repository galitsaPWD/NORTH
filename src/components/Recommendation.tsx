'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Path } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle2, Share2, Sparkles, Trophy } from 'lucide-react';

interface RecommendationProps {
  recommendation: string;
  recommendedPath: Path | null;
}

export const Recommendation = ({ recommendation, recommendedPath }: RecommendationProps) => {
  // Extract path name from recommendation text if possible, or use the object
  const pathName = recommendedPath?.name || "the recommended path";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full space-y-8"
    >
      <div className="relative p-8 rounded-3xl bg-surface border-2 border-accent/20 shadow-2xl shadow-accent/5 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Trophy className="w-24 h-24" />
        </div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-accent/5 blur-3xl rounded-full" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, delay: 0.2 }}
            className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-8 h-8 text-background" />
          </motion.div>

          <h2 className="text-3xl font-bold tracking-tight mb-2">The Verdict</h2>
          <p className="text-sm font-mono text-text-secondary uppercase tracking-widest mb-8">Recommendation Finalized</p>

          <div className="w-full bg-background/50 border border-border p-6 rounded-2xl mb-8">
            <h3 className="text-xl font-bold text-accent mb-4">Go with {pathName}.</h3>
            <p className="text-sm text-text-primary/80 leading-relaxed font-mono whitespace-pre-wrap text-left">
              {recommendation}
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button 
              className="w-full py-4 bg-accent text-background font-bold rounded-sm flex items-center justify-center gap-2 hover:bg-white transition-colors"
              onClick={() => {
                const shareData = {
                  title: 'My NORTH AI Verdict',
                  text: `I used NORTH AI to find my career path. The verdict: Go with ${pathName}!`,
                  url: window.location.origin
                };

                if (navigator.share) {
                  navigator.share(shareData).catch(console.error);
                } else {
                  navigator.clipboard.writeText(`${shareData.text} Check it out: ${shareData.url}`)
                    .then(() => alert('Link copied to clipboard!'))
                    .catch(console.error);
                }
              }}
            >
              <Share2 className="w-4 h-4" />
              Share my result
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-4 text-text-secondary font-mono text-xs uppercase tracking-widest hover:text-text-primary transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>

      {/* Next steps advice */}
      <div className="p-4 rounded-xl border border-border bg-white/5 flex gap-4">
        <Sparkles className="w-5 h-5 text-accent shrink-0 mt-1" />
        <div>
          <h4 className="text-sm font-bold mb-1">Stay Focused.</h4>
          <p className="text-xs text-text-secondary leading-relaxed">
            The decision assistant uses your risk tolerance and money goals to prioritize 
            sustainability over purely passion-driven paths. Start Small.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
