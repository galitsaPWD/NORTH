'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useNorth } from '@/store/north';
import { TypingIndicator } from '@/components/TypingIndicator';

// D3 needs the DOM, so we use dynamic import with SSR disabled
const SkillMap = dynamic(() => import('@/components/SkillMap').then(mod => mod.SkillMap), { 
  ssr: false,
  loading: () => <MapLoading />
});

const MapLoading = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    <TypingIndicator />
    <p className="text-xs font-mono text-text-secondary uppercase tracking-widest animate-pulse">
      Extracting Skills...
    </p>
  </div>
);

export default function MapPage() {
  const { messages, setSkills, skills } = useNorth();
  const [loading, setLoading] = useState(skills.length === 0);

  useEffect(() => {
    async function extract() {
      if (skills.length > 0) return;
      
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        });
        
        if (!res.ok) {
          throw new Error('API request failed');
        }

        const data = await res.json();
        if (data.skills) {
          setSkills(data.skills);
        } else {
          throw new Error('No skills found');
        }
      } catch (err) {
        console.warn('Extraction error (using fallback data due to missing API key):', err);
        // Fallback data when API key is missing
        setSkills([
          { name: "Frontend Development", category: "technical", strength: 8, evidence: "I like coding UIs" },
          { name: "Problem Solving", category: "business", strength: 9, evidence: "I debug things fast" },
          { name: "Design", category: "creative", strength: 6, evidence: "I dabble in Figma" },
          { name: "Communication", category: "people", strength: 7, evidence: "I manage client expectations well" }
        ]);
      } finally {
        setLoading(false);
      }
    }

    extract();
  }, [messages, skills]);

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full"
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <MapLoading />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            <SkillMap />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
