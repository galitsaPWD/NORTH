'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Sparkles, ArrowUp } from 'lucide-react';
import { useNorth } from '@/store/north';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { SYSTEM_PROMPTS } from '@/lib/prompts';
import { Message } from '@/types';
import { cn } from '@/lib/utils';

const QUESTIONS = [
  "What are you actually good at? Don't filter yourself — just list everything that comes to mind.",
  "What do you genuinely enjoy doing, even if you don't get paid for it?",
  "How much time can you realistically put into something new each week?",
  "What's your money goal — survival, comfort, or wealth?",
  "How do you feel about risk? Scale of 1–10, where 1 is 'I need stability' and 10 is 'I'll bet everything'.",
  "Are you a builder, a connector, a creator, or a solver?",
  "What have people paid you for, or asked you to help with, in the past?",
  "Is there anything you've always wanted to try but talked yourself out of?"
];

export const ChatScreen = () => {
  const router = useRouter();
  const { 
    messages, 
    addMessage, 
    questionIndex, 
    setQuestionIndex, 
    setOnboardingComplete, 
    removeLastExchange,
    setSkills,
    setPaths,
    setPathsReady,
    setSkillMapReady
  } = useNorth();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Initialize first question if no messages
  useEffect(() => {
    if (messages.length === 0 && !initializedRef.current) {
      initializedRef.current = true;
      askNextQuestion(0, []);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isTyping]);

  const processResults = async (finalMessages: Message[]) => {
    setIsProcessing(true);
    setIsTyping(true);
    
    try {
      // 1. Extract Skills
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: finalMessages }),
      });
      const skillData = await extractRes.json();
      if (skillData.skills) setSkills(skillData.skills);
      setSkillMapReady(true);

      // 2. Generate Paths
      const pathsRes = await fetch('/api/paths', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: finalMessages, skills: skillData.skills }),
      });
      const pathData = await pathsRes.json();
      if (pathData.paths) setPaths(pathData.paths);
      setPathsReady(true);

      // Transition to map
      setOnboardingComplete(true);
      router.push('/map');
    } catch (error) {
      console.error('Error processing results:', error);
      // Fallback transition even if AI fails
      router.push('/map');
    } finally {
      setIsProcessing(false);
      setIsTyping(false);
    }
  };

  const askNextQuestion = async (index: number, currentMessages: Message[]) => {
    if (index >= QUESTIONS.length) {
      const finalMsg: Message = {
        role: 'assistant',
        content: "Got it. Let me map out what I'm seeing...",
        timestamp: Date.now(),
      };
      addMessage(finalMsg);
      processResults([...currentMessages, finalMsg]);
      return;
    }

    setIsTyping(true);
    setStreamingContent('');

    try {
      const systemPrompt = `${SYSTEM_PROMPTS.ONBOARDING}\n\nTARGET_QUESTION: "${QUESTIONS[index]}"`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          system: systemPrompt,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      // Artificial thinking delay to feel more "real"
      await new Promise(resolve => setTimeout(resolve, 800));

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      setIsTyping(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullContent += chunk;
          setStreamingContent(fullContent);
        }
      }

      addMessage({
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
      });
      setStreamingContent('');
      setQuestionIndex(index);
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback to static if API fails
      const fallbackText = QUESTIONS[index];
      addMessage({
        role: 'assistant',
        content: fallbackText,
        timestamp: Date.now(),
      });
      setIsTyping(false);
      setQuestionIndex(index);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping || streamingContent || isProcessing) return;

    const userMsg: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    addMessage(userMsg);
    setInputValue('');
    
    // Call the real AI
    askNextQuestion(questionIndex + 1, newMessages);
  };

  const handleBack = () => {
    if (questionIndex > 0) {
      removeLastExchange();
      // Reset and trigger previous
      const previousMessages = messages.slice(0, -2);
      askNextQuestion(questionIndex - 1, previousMessages);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-[420px] mx-auto bg-background relative overflow-hidden ring-1 ring-border shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md z-10 shrink-0">
        <button 
          onClick={handleBack}
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.2em]">Onboarding</span>
          <div className="flex gap-1.5 mt-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-1 h-3 rounded-full transition-all duration-500",
                  i <= questionIndex ? "bg-accent shadow-[0_0_8px_rgba(232,232,255,0.4)]" : "bg-border/30"
                )} 
              />
            ))}
          </div>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth"
      >
        <div className="flex flex-col gap-4 min-h-full justify-end pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <ChatBubble key={msg.timestamp + i} message={msg} />
            ))}
            {streamingContent && (
              <ChatBubble 
                message={{ role: 'assistant', content: streamingContent, timestamp: Date.now() }} 
                isStreaming 
              />
            )}
            {(isTyping || isProcessing) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4"
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Processing Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-t-2 border-r-2 border-accent rounded-full"
              />
              <ArrowUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-accent" />
            </div>
            
            <div className="space-y-4 max-w-xs">
              <h2 className="text-xl font-bold tracking-tight">Locking Direction</h2>
              <div className="space-y-1">
                {[
                  "Analyzing signal...",
                  "Extracting core skills...",
                  "Calculating income paths...",
                  "Mapping your North Star..."
                ].map((text, i) => (
                  <motion.p
                    key={text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.8 }}
                    className="text-[10px] font-mono text-text-secondary uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <span className="w-1 h-1 bg-accent rounded-full animate-pulse" />
                    {text}
                  </motion.p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-background/80 backdrop-blur-md shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isProcessing ? "Processing..." : "Type your answer..."}
            disabled={isTyping || !!streamingContent || isProcessing}
            className={cn(
              "w-full bg-surface border border-border rounded-xl py-4 pl-5 pr-12 text-[15px] focus:outline-none focus:border-accent/40 transition-all placeholder:text-text-secondary/30",
              (isTyping || !!streamingContent || isProcessing) && "opacity-50 grayscale"
            )}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping || !!streamingContent || isProcessing}
            className={cn(
              "absolute right-2 p-2 rounded-lg transition-all",
              inputValue.trim() ? "text-accent" : "text-text-secondary"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-3 text-[10px] text-center font-mono text-text-secondary/40 uppercase tracking-tighter">
          {isProcessing ? "Finalizing your map" : `Question ${Math.min(questionIndex + 1, 8)} / 8`}
        </div>
      </div>
    </div>
  );
};
