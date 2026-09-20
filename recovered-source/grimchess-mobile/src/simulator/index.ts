export { ChessSimulator } from './ChessSimulator';
export { StockfishAdapter } from './StockfishAdapter';
export { MoveClassifier, engineScoreToPlayerPerspective } from './MoveClassifier';
export {
  AsyncTaskQueue,
  SessionEpochGate,
  predictionMatchesFen,
  type PendingPrediction,
} from './IntegrityGuards';
export { ForceModel, INIT_FORCES } from './ForceModel';
export { OracleService } from './OracleService';
export { ReplayStore } from './ReplayStore';
export {
  BenchmarkRunner,
  TACTICAL_POSITIONS,
  type BenchmarkReport,
  type GameBenchmarkReport,
  type PositionBenchmarkReport,
} from './BenchmarkRunner';
export {
  CHALLENGE_POSITIONS,
  CHALLENGE_CATEGORY_COUNTS,
  GAME_BENCHMARKS,
  GAME_CATEGORY_COUNTS,
} from './BenchmarkSuite';
export { PredictionMap, patternKey, ContradictionDetector, MapRevisionEngine, ParadoxEngine, candidatesFromAnalysis, candidatesFromTopMoves, featuresFromFen } from './paradox';
export type {
  PositionSnapshot, EngineAnalysis, ClassifiedMove,
  ForceState, ForceSnapshot, GameEvent, ReplayLog,
  BenchmarkResult, PlayerAnalytics, BodyType, TacticalPosition,
} from './types';
export type {
  Bucket, CenterState, ContradictionEvent, ContradictionKind, EngineCandidate,
  ParadoxState, PatternRecord, PositionFeatures, PredictedMove,
  PredictionSnapshot, RevisionProposal, RevisionValidation, SpaceBalance,
} from './paradox';
