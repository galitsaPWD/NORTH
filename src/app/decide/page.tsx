'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useNorth } from '@/store/north';
import { Path, Message } from '@/types';
import { ChatBubble } from '@/components/ChatBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { Recommendation } from '@/components/Recommendation';
import { ArrowLeft, Sparkles, Scale, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SYSTEM_PROMPTS } from '@/lib/prompts';

const DECIDER_QUESTIONS = [
  "Would you be okay earning nothing for 6 months?",
  "Do you want to work alone or build something with a team?",
  "Are you optimizing for freedom, money, or impact?",
  "Which would you regret more — trying and failing, or never trying?"
];

export default function DecidePage() {
  const router = useRouter();
  const { paths, selectedPaths, selectPath, skills, messages: userMessages } = useNorth();
  
  const [step, setStep] = useState<'pick' | 'chat' | 'result'>(
    selectedPaths[0] && selectedPaths[1] ? 'chat' : 'pick'
  );
  
  const [deciderMessages, setDeciderMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [deciderMessages, streamingContent, isTyping]);

  // Boot up the chat if we enter the chat step with no messages
  useEffect(() => {
    if (step === 'chat' && deciderMessages.length === 0 && !isTyping) {
      askNextDeciderQuestion(0, []);
    }
  }, [step, deciderMessages.length, isTyping]);

  const askNextDeciderQuestion = async (index: number, currentMessages: Message[]) => {
    if (index >= DECIDER_QUESTIONS.length) {
      getRecommendation(currentMessages);
      return;
    }

    setIsTyping(true);
    setStreamingContent('');

    try {
      const contextStr = `Path A: ${selectedPaths[0]?.name}\nPath B: ${selectedPaths[1]?.name}\nSkills: ${skills.map(s => s.name).join(', ')}`;
      const systemPrompt = `${SYSTEM_PROMPTS.DECISION_QUESTIONING}\n\nCONTEXT:\n${contextStr}\n\nTARGET_QUESTION: "${DECIDER_QUESTIONS[index]}"`;
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          system: systemPrompt,
        }),
      });

      if (!response.ok) throw new Error('Decider chat failed');

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

      const assistantMsg: Message = {
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
      };

      setDeciderMessages([...currentMessages, assistantMsg]);
      setStreamingContent('');
    } catch (error) {
      console.error('Decider chat error:', error);
      // Fallback
      const fallbackText = DECIDER_QUESTIONS[index];
      setDeciderMessages([...currentMessages, {
        role: 'assistant',
        content: fallbackText,
        timestamp: Date.now(),
      }]);
      setIsTyping(false);
    }
  };

  const startSession = async () => {
    setStep('chat');
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping || streamingContent) return;

    const userMsg: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...deciderMessages, userMsg];
    setDeciderMessages(newMessages);
    setInputValue('');
    
    // Determine number of questions asked
    const userMsgCount = newMessages.filter(m => m.role === 'user').length;
    askNextDeciderQuestion(userMsgCount, newMessages);
  };

  const getRecommendation = async (allMessages: Message[]) => {
    setIsTyping(true);
    setStep('result');
    
    try {
      // Artificial thinking delay to feel more "decisive" for the final recommendation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await fetch('/api/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathA: selectedPaths[0],
          pathB: selectedPaths[1],
          profile: { skills, context: userMessages },
          messages: allMessages,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch recommendation');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        setIsTyping(false);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullContent += chunk;
          setStreamingContent(fullContent);
        }
      }

      setRecommendation(fullContent);
      setStreamingContent('');
    } catch (err) {
      console.warn('Recommendation error:', err);
      const recommendedPath = selectedPaths[0] || { name: 'Path A' };
      setRecommendation(`Go with ${recommendedPath.name}.\n\nBased on our session, this path aligns better with your stated goals and risk tolerance.`);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="h-[100dvh] max-w-[420px] mx-auto bg-background flex flex-col relative">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md z-10 shrink-0">
        <button 
          onClick={() => {
            if (step === 'chat' || step === 'result') {
              setStep('pick');
              setDeciderMessages([]);
              selectPath(null as any, 0);
              selectPath(null as any, 1);
            } else {
              router.back();
            }
          }} 
          className="p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">
            {step === 'pick' ? 'Selection' : step === 'chat' ? 'Decision Session' : 'Verdict'}
          </span>
        </div>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'pick' && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full p-6 space-y-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Help me decide.</h1>
                <p className="text-sm text-text-secondary">Pick two paths to compare. We'll find the right one for you.</p>
              </div>

              <div className="space-y-4">
                {paths.map((path) => {
                  const isSelected0 = selectedPaths[0]?.id === path.id;
                  const isSelected1 = selectedPaths[1]?.id === path.id;
                  const isSelected = isSelected0 || isSelected1;

                  return (
                    <button
                      key={path.id}
                      onClick={() => {
                        if (isSelected0) selectPath(null as any, 0);
                        else if (isSelected1) selectPath(null as any, 1);
                        else if (!selectedPaths[0]) selectPath(path, 0);
                        else if (!selectedPaths[1]) selectPath(path, 1);
                      }}
                      className={cn(
                        "w-full p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group text-left",
                        isSelected 
                          ? "bg-accent/10 border-accent shadow-lg shadow-accent/5" 
                          : "bg-surface border-border hover:border-text-secondary/40"
                      )}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn(
                          "text-[10px] font-mono tracking-widest uppercase",
                          isSelected ? "text-accent" : "text-text-secondary"
                        )}>
                          {path.color} Path
                        </span>
                        <span className="font-bold text-lg">{path.name}</span>
                      </div>
                      <div className={cn(
                        "w-6 h-6 rounded-full border flex items-center justify-center transition-colors",
                        isSelected ? "bg-accent border-accent text-background" : "border-border group-hover:border-text-secondary"
                      )}>
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4">
                <button
                  disabled={!selectedPaths[0] || !selectedPaths[1]}
                  onClick={startSession}
                  className="w-full bg-accent text-background font-bold py-4 rounded-sm flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-20 disabled:hover:bg-accent"
                >
                  <Scale className="w-4 h-4" />
                  Compare these paths
                </button>
              </div>
            </motion.div>
          )}

          {step === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 pt-8">
                <div className="flex flex-col gap-2 min-h-full justify-end">
                  {deciderMessages.map((msg, i) => (
                    <ChatBubble key={i} message={msg} />
                  ))}
                  {streamingContent && (
                    <ChatBubble 
                      message={{ role: 'assistant', content: streamingContent, timestamp: Date.now() }} 
                      isStreaming 
                    />
                  )}
                  {isTyping && <TypingIndicator />}
                </div>
              </div>

              <div className="p-4 border-t border-border">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your answer..."
                    disabled={isTyping}
                    className="w-full bg-surface border border-border rounded-xl py-3.5 pl-4 pr-12 text-[15px] focus:outline-none focus:border-accent/50"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className="absolute right-2 p-2 text-accent disabled:opacity-30"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full p-6 pt-12 overflow-y-auto"
            >
              <Recommendation 
                recommendation={streamingContent || recommendation || ''} 
                recommendedPath={
                  (streamingContent || recommendation)?.toLowerCase().includes(selectedPaths[0]?.name.toLowerCase() || '!!!') 
                  ? selectedPaths[0] 
                  : selectedPaths[1]
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
