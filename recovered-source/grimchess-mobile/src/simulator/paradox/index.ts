export { PredictionMap, patternKey } from './PredictionMap';
export { ContradictionDetector } from './ContradictionDetector';
export { MapRevisionEngine, featuresForRevision } from './MapRevisionEngine';
export { ParadoxEngine } from './ParadoxEngine';
export { candidatesFromAnalysis, candidatesFromTopMoves, featuresFromFen } from './LiveAdapter';
export type { CognitiveUpdate } from './ParadoxEngine';
export type {
  Bucket, CenterState, ContradictionEvent, ContradictionKind, EngineCandidate,
  ParadoxState, PatternRecord, PositionFeatures, PredictedMove,
  PredictionSnapshot, RevisionProposal, RevisionValidation, SpaceBalance,
} from './types';
