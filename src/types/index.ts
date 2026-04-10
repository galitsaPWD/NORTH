export type SkillCategory = "technical" | "creative" | "people" | "business";
export type Difficulty = "easy" | "medium" | "hard";
export type PathColor = "teal" | "purple" | "amber";

export interface Skill {
  name: string;
  category: SkillCategory;
  strength: number;       // 1–10
  evidence: string;       // quote from conversation
}

export interface Path {
  id: string;
  name: string;
  why_it_fits: string;
  income_min: number;
  income_max: number;
  income_period: "month" | "year";
  time_to_first_dollar: string;
  difficulty: Difficulty;
  fit_score: number;      // 0–100
  first_steps: string[];
  color: PathColor;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface NorthState {
  // Onboarding
  messages: Message[];
  questionIndex: number;
  onboardingComplete: boolean;

  // Skill Map
  skills: Skill[];
  skillMapReady: boolean;

  // Paths
  paths: Path[];
  pathsReady: boolean;

  // Decider
  selectedPaths: [Path | null, Path | null];
  deciderMessages: Message[];
  recommendation: string | null;
}

export interface NorthActions {
  addMessage: (msg: Message) => void;
  setQuestionIndex: (index: number) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setSkills: (skills: Skill[]) => void;
  setSkillMapReady: (ready: boolean) => void;
  setPaths: (paths: Path[]) => void;
  setPathsReady: (ready: boolean) => void;
  selectPath: (path: Path, slot: 0 | 1) => void;
  setRecommendation: (rec: string) => void;
  removeLastExchange: () => void;
  reset: () => void;
}
