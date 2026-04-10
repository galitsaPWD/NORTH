import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Message, Skill, Path, NorthState, NorthActions } from '../types';

const initialState: NorthState = {
  messages: [],
  questionIndex: 0,
  onboardingComplete: false,
  skills: [],
  skillMapReady: false,
  paths: [],
  pathsReady: false,
  selectedPaths: [null, null],
  deciderMessages: [],
  recommendation: null,
};

export const useNorth = create<NorthState & NorthActions>()(
  persist(
    (set) => ({
      ...initialState,
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      setQuestionIndex: (index) => set({ questionIndex: index }),
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      setSkills: (skills) => set({ skills }),
      setSkillMapReady: (ready) => set({ skillMapReady: ready }),
      setPaths: (paths) => set({ paths }),
      setPathsReady: (ready) => set({ pathsReady: ready }),
      selectPath: (path, slot) => 
        set((state) => {
          const newSelectedPaths = [...state.selectedPaths] as [Path | null, Path | null];
          newSelectedPaths[slot] = path;
          return { selectedPaths: newSelectedPaths };
        }),
      setRecommendation: (rec) => set({ recommendation: rec }),
      removeLastExchange: () => set((state) => ({
        messages: state.messages.slice(0, -2),
        questionIndex: Math.max(0, state.questionIndex - 1),
      })),
      reset: () => set(initialState),
    }),
    {
      name: 'north-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
