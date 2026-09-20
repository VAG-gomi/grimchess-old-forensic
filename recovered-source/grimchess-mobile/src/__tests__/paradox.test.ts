import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ParadoxEngine } from '../simulator/paradox/ParadoxEngine';
import type { PositionFeatures } from '../simulator/paradox/types';

const features: PositionFeatures = {
  centerState: 'locked', development: 'ahead', kingSafety: 'balanced', space: 'queenside',
};

const candidates = [
  { uci: 'g1f3', evalCp: 400 },
  { uci: 'b2b4', evalCp: 0 },
  { uci: 'c2c4', evalCp: -400 },
];

describe('ParadoxEngine', () => {
  it('freezes a versioned prediction and detects a strong contradiction', () => {
    const engine = new ParadoxEngine();
    const prediction = engine.beginPosition('fen-a', features, candidates, 1);
    const update = engine.observeMove(prediction.id, 'b2b4', 0, 120, 2);
    assert.equal(prediction.mapVersion, 'v1');
    assert.equal(update.contradiction.kind, 'map_invalidation');
    assert.equal(update.revision?.status, 'candidate');
    assert.equal(engine.mapVersion, 'v1');
  });

  it('does not create a permanent revision for a weak surprise', () => {
    const engine = new ParadoxEngine();
    const prediction = engine.beginPosition('fen-b', features, candidates, 1);
    const update = engine.observeMove(prediction.id, 'b2b4', 0, 20, 2);
    assert.equal(update.contradiction.kind, 'rare_but_weak');
    assert.equal(update.revision, null);
    assert.equal(engine.pendingRevisions.length, 0);
  });

  it('accepts a validated conditional revision and survives serialization', () => {
    const engine = new ParadoxEngine();
    const prediction = engine.beginPosition('fen-c', features, candidates, 1);
    const update = engine.observeMove(prediction.id, 'b2b4', 0, 120, 2);
    assert.ok(update.revision);
    const result = engine.validateRevision(update.revision!.id, {
      triggerGain: 0.2, relatedGain: 0.12, retentionLoss: -0.01, distractorLoss: -0.01,
      accepted: false, reason: '',
    });
    assert.equal(result.accepted, true);
    assert.equal(engine.mapVersion, 'v2');
    const restored = ParadoxEngine.fromJSON(engine.serialize());
    assert.equal(restored.mapVersion, 'v2');
    assert.equal(restored.serialize().revisions[0].status, 'accepted');
  });

  it('rejects a revision that harms retention', () => {
    const engine = new ParadoxEngine();
    const prediction = engine.beginPosition('fen-d', features, candidates, 1);
    const update = engine.observeMove(prediction.id, 'b2b4', 0, 120, 2);
    assert.ok(update.revision);
    const result = engine.validateRevision(update.revision!.id, {
      triggerGain: 0.2, relatedGain: 0.1, retentionLoss: -0.2, distractorLoss: 0,
      accepted: true, reason: '',
    });
    assert.equal(result.accepted, false);
    assert.equal(engine.mapVersion, 'v1');
    assert.equal(engine.serialize().revisions[0].status, 'rejected');
  });
});
