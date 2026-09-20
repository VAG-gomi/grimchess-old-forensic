import { DEFAULT_THRESHOLDS } from './types';
import type { ContradictionEvent, PredictionSnapshot } from './types';

export class ContradictionDetector {
  constructor(private readonly thresholds = DEFAULT_THRESHOLDS) {}

  detect(prediction: PredictionSnapshot, observedMove: string, evalBeforeCp: number, evalAfterCp: number, now = Date.now()): ContradictionEvent {
    const candidate = prediction.candidates.find((move) => move.uci === observedMove);
    const probability = candidate?.probability ?? 0.01;
    const surprise = 1 - probability;
    const impact = Math.min(1, Math.abs(evalAfterCp - evalBeforeCp) / 100);
    const score = surprise * impact * prediction.confidence;
    let kind: ContradictionEvent['kind'];
    if (probability >= this.thresholds.expectedProbability) kind = 'expected';
    else if (impact < this.thresholds.meaningfulImpact) kind = 'rare_but_weak';
    else if (prediction.confidence >= this.thresholds.invalidationConfidence && impact >= this.thresholds.invalidationImpact) kind = 'map_invalidation';
    else kind = 'rare_but_sound';
    return {
      id: `${prediction.id}-c`, predictionId: prediction.id, observedMove,
      predictedProbability: probability, behavioralSurprise: surprise,
      tacticalImpact: impact, priorConfidence: prediction.confidence,
      score, kind, evalBeforeCp, evalAfterCp, createdAt: now,
    };
  }
}
