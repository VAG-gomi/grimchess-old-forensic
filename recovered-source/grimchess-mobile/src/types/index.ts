export interface Forces {
  π: number;
  g: number;
  f: number;
  h: number;
  s: number;
  e: number;
  κ: number;
  o: number;
}

export interface ForceSnapshot {
  t: number;
  π: number;
  h: number;
  e: number;
  f: number;
}

export interface MoveClassification {
  classification: 'brilliant' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  delta: number;
  bestMove: string;
  fenAfter: string;
  moveSan: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SessionData {
  name: string;
  difficulty: number;
  playerColor: 'w' | 'b';
  initialFen?: string;
  fen: string;
  moveHistory: string[];
  msgs: ChatMessage[];
  forces: Forces;
  forceHistory?: ForceSnapshot[];
  lastClass: MoveClassification | null;
  bodyType: string | null;
  paradoxState?: import('../simulator/paradox/types').ParadoxState;
}

export interface DifficultyLevel {
  name: string;
  depth: number;
  noise: number;
  label: string;
}

export type BodyType = 'S' | 'O' | 'F' | 'X' | 'H';
