import type { EngineCandidate, PatternRecord, PositionFeatures, PredictedMove, PredictionSnapshot } from './types';

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

export function patternKey(features: PositionFeatures): string {
  return [features.centerState, features.development, features.kingSafety, features.space].join('|');
}

export class PredictionMap {
  private readonly records: Map<string, PatternRecord>;
  private readonly version: string;
  private sequence = 0;

  constructor(records: PatternRecord[] = [], version = 'v1') {
    this.records = new Map(records.map((record) => [record.patternKey, { ...record, priors: { ...record.priors } }]));
    this.version = version;
  }

  get mapVersion(): string { return this.version; }
  get patterns(): PatternRecord[] { return [...this.records.values()].map((record) => ({ ...record, priors: { ...record.priors } })); }

  predict(fen: string, features: PositionFeatures, engineCandidates: EngineCandidate[], now = Date.now()): PredictionSnapshot {
    if (engineCandidates.length === 0) throw new Error('At least one engine candidate is required');
    const key = patternKey(features);
    const record = this.records.get(key);
    const bestEval = Math.max(...engineCandidates.map((candidate) => candidate.evalCp));
    const engineWeights = engineCandidates.map((candidate) => Math.max(0.01, Math.exp((candidate.evalCp - bestEval) / 200)));
    const engineTotal = engineWeights.reduce((sum, weight) => sum + weight, 0);
    const raw: PredictedMove[] = engineCandidates.map((candidate) => {
      const engineProbability = engineWeights[engineCandidates.indexOf(candidate)] / engineTotal;
      const prior = record?.priors[candidate.uci];
      const probability = prior === undefined ? engineProbability : (engineProbability * 0.7) + (prior * 0.3);
      return { uci: candidate.uci, probability, expectedEvalCp: candidate.evalCp, source: prior === undefined ? 'engine' : 'pattern' };
    });
    const total = raw.reduce((sum, candidate) => sum + candidate.probability, 0);
    const candidates = raw.map((candidate) => ({ ...candidate, probability: candidate.probability / total }));
    const confidence = clamp(Math.max(...candidates.map((candidate) => candidate.probability)), 0, 1);
    return { id: `${this.version}-p${++this.sequence}`, mapVersion: this.version, fen, features, candidates, confidence, createdAt: now };
  }

  applyRevision(revision: { patternKey: string; move: string; priorProposed: number }): PredictionMap {
    const current = this.records.get(revision.patternKey);
    const priors = { ...(current?.priors ?? {}), [revision.move]: revision.priorProposed };
    const nextVersion = `v${Number(this.version.slice(1)) + 1}`;
    const nextRecord: PatternRecord = {
      patternKey: revision.patternKey,
      priors,
      evidenceCount: (current?.evidenceCount ?? 0) + 1,
      confidence: Math.max(current?.confidence ?? 0, revision.priorProposed),
      mapVersion: nextVersion,
    };
    const records = this.patterns.filter((record) => record.patternKey !== revision.patternKey).concat(nextRecord);
    return new PredictionMap(records, nextVersion);
  }
}
