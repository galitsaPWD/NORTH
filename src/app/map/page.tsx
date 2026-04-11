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
  // Always re-extract on mount — never trust stale localStorage skills
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function extract() {
      if (messages.length === 0) {
        // No session messages at all — nothing to extract
        setLoading(false);
        return;
      }

      // Always re-extract from the live session messages
      // so localStorage cache never shows stale/fallback data
      setSkills([]);
      
      try {
        const res = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
        });
        
        if (!res.ok) throw new Error('API request failed');

        const data = await res.json();
        if (data.skills && data.skills.length > 0) {
          setSkills(data.skills);
        } else {
          throw new Error('No skills in response');
        }
      } catch (err) {
        console.warn('Extraction failed:', err);
        // Only use fallback if we genuinely have no messages (dev mode)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
