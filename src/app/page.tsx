'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { StarField } from '@/components/StarField';
import { ArrowUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <StarField />
      
      <div className="max-w-md w-full flex flex-col items-center gap-12">
        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-2"
        >
          <h1 className="text-6xl md:text-7xl font-sans font-bold tracking-tighter text-text-primary">
            NORTH
          </h1>
          <ArrowUp className="w-12 h-12 md:w-16 md:h-16 text-accent" strokeWidth={3} />
        </motion.div>

        {/* Taglines */}
        <div className="space-y-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="text-lg md:text-xl font-mono text-text-secondary"
          >
            "Find your direction."
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            className="text-sm md:text-base text-text-secondary/80 max-w-[280px] mx-auto"
          >
            Tell us about yourself. We'll show you where to go.
          </motion.p>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
          className="w-full mt-8"
        >
          <Link href="/start" className="group relative inline-flex w-full items-center justify-center rounded-sm bg-accent px-8 py-4 text-sm font-bold text-background transition-all hover:bg-white active:scale-[0.98]">
            Find my path
            <motion.span
              className="ml-2 inline-block"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </div>

      {/* Decorative arrow in corner */}
      <div className="absolute top-8 left-8 text-text-secondary/20 hidden md:block">
        <ArrowUp className="w-8 h-8" />
      </div>
    </main>
  );
}
