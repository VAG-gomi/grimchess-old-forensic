import { ContradictionDetector } from './ContradictionDetector';
import { MapRevisionEngine } from './MapRevisionEngine';
import { PredictionMap } from './PredictionMap';
import type { ContradictionEvent, EngineCandidate, ParadoxState, PositionFeatures, PredictionSnapshot, RevisionProposal, RevisionValidation } from './types';

export interface CognitiveUpdate {
  prediction: PredictionSnapshot;
  contradiction: ContradictionEvent;
  revision: RevisionProposal | null;
}

export class ParadoxEngine {
  private map: PredictionMap;
  private readonly detector: ContradictionDetector;
  private readonly reviser: MapRevisionEngine;
  private readonly predictions = new Map<string, PredictionSnapshot>();
  private readonly contradictions: ContradictionEvent[] = [];
  private readonly revisions: RevisionProposal[] = [];

  constructor(map = new PredictionMap(), detector = new ContradictionDetector(), reviser = new MapRevisionEngine()) {
    this.map = map;
    this.detector = detector;
    this.reviser = reviser;
  }

  get mapVersion(): string { return this.map.mapVersion; }
  get pendingRevisions(): RevisionProposal[] { return this.revisions.filter((revision) => revision.status === 'candidate'); }
  get contradictionHistory(): ContradictionEvent[] { return [...this.contradictions]; }

  beginPosition(fen: string, features: PositionFeatures, engineCandidates: EngineCandidate[], now = Date.now()): PredictionSnapshot {
    const prediction = this.map.predict(fen, features, engineCandidates, now);
    this.predictions.set(prediction.id, prediction);
    return prediction;
  }

  observeMove(predictionId: string, observedMove: string, evalBeforeCp: number, evalAfterCp: number, now = Date.now()): CognitiveUpdate {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) throw new Error(`Unknown prediction: ${predictionId}`);
    const contradiction = this.detector.detect(prediction, observedMove, evalBeforeCp, evalAfterCp, now);
    const revision = this.reviser.propose(prediction, contradiction, now);
    this.contradictions.push(contradiction);
    if (revision) this.revisions.push(revision);
    return { prediction, contradiction, revision };
  }

  validateRevision(revisionId: string, result: RevisionValidation): RevisionValidation {
    const revision = this.revisions.find((candidate) => candidate.id === revisionId);
    if (!revision) throw new Error(`Unknown revision: ${revisionId}`);
    const validated = this.reviser.validate(result);
    revision.status = validated.accepted ? 'accepted' : 'rejected';
    if (validated.accepted) this.map = this.map.applyRevision(revision);
    return validated;
  }

  serialize(): ParadoxState {
    return {
      schemaVersion: 1, activeMapVersion: this.map.mapVersion,
      patterns: this.map.patterns, predictions: [...this.predictions.values()],
      contradictions: [...this.contradictions], revisions: [...this.revisions],
    };
  }

  static fromJSON(state: ParadoxState): ParadoxEngine {
    if (state.schemaVersion !== 1) throw new Error(`Unsupported paradox state schema: ${state.schemaVersion}`);
    const engine = new ParadoxEngine(new PredictionMap(state.patterns, state.activeMapVersion));
    for (const prediction of state.predictions) engine.predictions.set(prediction.id, prediction);
    engine.contradictions.push(...state.contradictions);
    engine.revisions.push(...state.revisions);
    return engine;
  }
}
