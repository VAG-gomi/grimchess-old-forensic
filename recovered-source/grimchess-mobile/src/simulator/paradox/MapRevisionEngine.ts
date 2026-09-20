import { patternKey } from './PredictionMap';
import type { ContradictionEvent, PositionFeatures, PredictionSnapshot, RevisionProposal, RevisionValidation } from './types';

export class MapRevisionEngine {
  propose(prediction: PredictionSnapshot, contradiction: ContradictionEvent, now = Date.now()): RevisionProposal | null {
    if (contradiction.kind !== 'map_invalidation' && contradiction.kind !== 'rare_but_sound') return null;
    const existing = prediction.candidates.find((candidate) => candidate.uci === contradiction.observedMove);
    const before = existing?.probability ?? 0.01;
    const proposed = Math.min(0.8, Math.max(before + 0.05, before * 2));
    return {
      id: `${prediction.id}-r-${now}`, parentMapVersion: prediction.mapVersion,
      patternKey: patternKey(prediction.features), move: contradiction.observedMove,
      priorBefore: before, priorProposed: proposed,
      reason: `Observed ${contradiction.kind} under the frozen prediction ${prediction.id}.`,
      evidenceIds: [contradiction.id], status: 'candidate',
    };
  }

  validate(result: RevisionValidation): RevisionValidation {
    const accepted = result.triggerGain > 0 && result.relatedGain >= 0.05 && result.retentionLoss >= -0.02 && result.distractorLoss >= -0.03;
    return { ...result, accepted, reason: accepted ? 'Revision generalized within thresholds.' : 'Revision rejected by generalization or retention gate.' };
  }
}

export function featuresForRevision(features: PositionFeatures): string { return patternKey(features); }
