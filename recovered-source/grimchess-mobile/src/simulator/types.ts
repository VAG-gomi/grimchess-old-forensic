export interface PositionSnapshot {
  fen: string;
  pgn: string;
  moveNumber: number;
  turn: 'w' | 'b';
  legalMoves: string[];
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  timestamp: number;
}

export interface EngineAnalysis {
  bestMove: string;
  evalCp: number;
  evalMate: number | null;
  pv: string[];
  depth: number;
  timeMs: number;
  topMoves: { move: string; evalCp: number }[];
}

export interface ClassifiedMove {
  san: string;
  uci: string;
  classification: 'brilliant' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
  delta: number;
  evalBeforeCp: number;
  evalAfterCp: number;
  isBest: boolean;
  bestMove: string;
  timestamp: number;
}

export interface ForceState {
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

export interface GameEvent {
  type: 'move' | 'engine_reply' | 'classification' | 'force_update' | 'oracle_speak' | 'error';
  payload: unknown;
  timestamp: number;
}

export interface ReplayLog {
  id: string;
  startedAt: number;
  endedAt: number | null;
  events: GameEvent[];
  finalFen: string;
  finalForces: ForceState;
  outcome: 'win' | 'loss' | 'draw' | 'abandoned' | null;
}

export interface BenchmarkResult {
  positionId: string;
  name: string;
  expectedBestMove: string;
  actualBestMove: string;
  evalCp: number;
  depth: number;
  timeMs: number;
  passed: boolean;
}

export interface PlayerAnalytics {
  totalGames: number;
  winRate: number;
  avgAccuracy: number;
  blunderRate: number;
  forceVolatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  bodyTypeDistribution: Record<string, number>;
  stageProgression: { stage: string; durationMs: number }[];
}

export type BodyType = 'S' | 'O' | 'F' | 'X' | 'H';

export interface TacticalPosition {
  id: string;
  name: string;
  fen: string;
  category: 'tactics' | 'endgame' | 'opening' | 'middlegame';
  expectedMoves: string[];
  description: string;
  difficulty: number;
}

export type BenchmarkStatus = 'PASS' | 'FAIL' | 'INCONCLUSIVE';

export type ChallengeCategory =
  | 'tactical'
  | 'strategic'
  | 'defensive'
  | 'endgame'
  | 'positional-trap'
  | 'dynamic';

export interface ChallengePosition {
  id: string;
  category: ChallengeCategory;
  fen: string;
  description: string;
  difficulty: number;
  /**
   * UCI moves from an external reference set. Empty means that the harness
   * records engine evidence but must return INCONCLUSIVE for strength claims.
   */
  referenceMoves: string[];
  referenceSource: string | null;
}

export interface PositionEvidence {
  testId: string;
  positionFen: string;
  playerColor: 'w' | 'b';
  initialState: string;
  candidates: { move: string; evalCp: number }[];
  selectedMove: string;
  engineEvaluation: { beforeCp: number; afterResponseCp: number; depth: number };
  prediction: string | null;
  actualResponse: string | null;
  newState: string | null;
  trajectory: string[];
  finalResult: BenchmarkStatus;
  timeMs: number;
  failureClass: string | null;
}

export interface PositionBenchmarkResult extends PositionEvidence {
  referenceMoves: string[];
  bestMoveMatch: boolean;
  topThreeMatch: boolean;
}

export type GameBenchmarkCategory =
  | 'balanced'
  | 'disadvantage'
  | 'unusual'
  | 'adversarial'
  | 'long-conversion';

export interface GameBenchmarkDefinition {
  id: string;
  category: GameBenchmarkCategory;
  startingFen: string;
  playerColor: 'w' | 'b';
  opponentMode: 'stockfish' | 'forcing-reference' | 'external';
  maxPlies: number;
  description: string;
}

export interface GameBenchmarkResult {
  testId: string;
  startingFen: string;
  playerColor: 'w' | 'b';
  initialState: string;
  selectedMoves: string[];
  trajectory: string[];
  finalFen: string;
  plies: number;
  finalResult: BenchmarkStatus;
  timeMs: number;
  failureClass: string | null;
}
