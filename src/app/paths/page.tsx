'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useNorth } from '@/store/north';
import { PathCard } from '@/components/PathCard';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ArrowLeft, Sparkles, Wand2 } from 'lucide-react';

const PathsLoading = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-8">
    <div className="relative">
      <Wand2 className="w-12 h-12 text-accent animate-pulse" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-accent/20 blur-2xl rounded-full"
      />
    </div>
    <div className="space-y-2">
      <h2 className="text-xl font-bold tracking-tight">Calculating Paths</h2>
      <p className="text-sm font-mono text-text-secondary uppercase tracking-widest">
        Running simulation across 42 scenarios...
      </p>
    </div>
    <TypingIndicator />
  </div>
);

export default function PathsPage() {
  const router = useRouter();
  const { messages, skills, paths, pathsReady, setPaths, setPathsReady } = useNorth();
  // If paths already set by processResults — skip generation, no double loading
  const [loading, setLoading] = useState(!pathsReady || paths.length === 0);

  useEffect(() => {
    async function generate() {
      // Paths already set by ChatScreen's processResults — skip
      if (pathsReady && paths.length > 0) {
        setLoading(false);
        return;
      }

      // No messages = no session
      if (messages.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/paths', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, skills }),
        });
        
        if (!res.ok) throw new Error('API request failed');

        const data = await res.json();
        if (data.paths && data.paths.length > 0) {
          const sorted = [...data.paths].sort((a: any, b: any) => b.fit_score - a.fit_score);
          setPaths(sorted);
          setPathsReady(true);
        } else {
          throw new Error('No paths found');
        }
      } catch (err) {
        console.error('Path generation failed:', err);
        setPaths([]);
        setPathsReady(true);
      } finally {
        setLoading(false);
      }
    }

    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-full overflow-y-auto">
    <main className="max-w-[420px] mx-auto bg-background p-6 pb-32">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-right">
          <h1 className="text-2xl font-bold tracking-tight">Your 3 Paths</h1>
          <p className="text-xs font-mono text-text-secondary uppercase tracking-widest">Generated for you</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PathsLoading />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6"
          >
            {paths.map((path, i) => (
              <PathCard key={path.id} path={path} index={i} />
            ))}
            
            {/* Decider CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 space-y-4"
            >
              <div className="p-4 rounded-xl border border-dashed border-border text-center">
                <p className="text-xs text-text-secondary mb-4">
                  Stuck between options? Use the Decider to find the one.
                </p>
                <button 
                  onClick={() => router.push('/decide')}
                  className="w-full py-4 px-6 rounded-sm bg-surface border border-border flex items-center justify-center gap-2 font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  Take me to the decider
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
    </div>
  );
}
