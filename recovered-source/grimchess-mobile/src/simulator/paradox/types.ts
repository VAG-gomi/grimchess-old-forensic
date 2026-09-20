export type CenterState = 'open' | 'semi_open' | 'locked';
export type Bucket = 'behind' | 'equal' | 'ahead';
export type SpaceBalance = 'queenside' | 'balanced' | 'kingside';

export interface PositionFeatures {
  centerState: CenterState;
  development: Bucket;
  kingSafety: 'unsafe' | 'balanced' | 'safe';
  space: SpaceBalance;
}

export interface EngineCandidate {
  uci: string;
  evalCp: number;
}

export interface PredictedMove {
  uci: string;
  probability: number;
  expectedEvalCp: number;
  source: 'engine' | 'pattern' | 'revision';
}

export interface PredictionSnapshot {
  id: string;
  mapVersion: string;
  fen: string;
  features: PositionFeatures;
  candidates: PredictedMove[];
  confidence: number;
  createdAt: number;
}

export type ContradictionKind = 'expected' | 'rare_but_weak' | 'rare_but_sound' | 'map_invalidation' | 'repeated_blind_spot';

export interface ContradictionEvent {
  id: string;
  predictionId: string;
  observedMove: string;
  predictedProbability: number;
  behavioralSurprise: number;
  tacticalImpact: number;
  priorConfidence: number;
  score: number;
  kind: ContradictionKind;
  evalBeforeCp: number;
  evalAfterCp: number;
  createdAt: number;
}

export interface RevisionProposal {
  id: string;
  parentMapVersion: string;
  patternKey: string;
  move: string;
  priorBefore: number;
  priorProposed: number;
  reason: string;
  evidenceIds: string[];
  status: 'candidate' | 'under_test' | 'accepted' | 'rejected';
}

export interface RevisionValidation {
  triggerGain: number;
  relatedGain: number;
  retentionLoss: number;
  distractorLoss: number;
  accepted: boolean;
  reason: string;
}

export interface PatternRecord {
  patternKey: string;
  priors: Record<string, number>;
  evidenceCount: number;
  confidence: number;
  mapVersion: string;
}

export interface ParadoxState {
  schemaVersion: 1;
  activeMapVersion: string;
  patterns: PatternRecord[];
  predictions: PredictionSnapshot[];
  contradictions: ContradictionEvent[];
  revisions: RevisionProposal[];
}

export const DEFAULT_THRESHOLDS = {
  expectedProbability: 0.25,
  meaningfulImpact: 0.5,
  invalidationConfidence: 0.6,
  invalidationImpact: 1,
} as const;
