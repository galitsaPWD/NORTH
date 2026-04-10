'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChatScreen } from '@/components/ChatScreen';

export default function StartPage() {
  return (
    <motion.main 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full"
    >
      <ChatScreen />
    </motion.main>
  );
}
