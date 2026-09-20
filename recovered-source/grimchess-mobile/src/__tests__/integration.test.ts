import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ChessSimulator } from '../simulator/ChessSimulator';
import { MoveClassifier } from '../simulator/MoveClassifier';
import { ForceModel, INIT_FORCES } from '../simulator/ForceModel';

describe('Integration: Full Game Flow', () => {
  it('simulates a complete game with force tracking', () => {
    const sim = new ChessSimulator();
    const forces = new ForceModel();

    // Scholar's mate attempt
    const moves = [
      { from: 'e2', to: 'e4', expected: 'good' },
      { from: 'e7', to: 'e5', expected: 'good' },
      { from: 'd1', to: 'h5', expected: 'good' },
      { from: 'b8', to: 'c6', expected: 'good' },
      { from: 'f1', to: 'c4', expected: 'good' },
      { from: 'g8', to: 'f6', expected: 'good' },
    ];

    for (const m of moves) {
      const move = sim.playMove(m.from as any, m.to as any);
      assert.ok(move, `Move ${m.from}-${m.to} should be legal`);

      // Simulate classification (in real game, engine provides eval)
      const cls = MoveClassifier.classify(
        move!.san, m.from + m.to,
        0, 0, true, m.from + m.to, false
      );
      forces.apply(cls.classification);
    }

    assert.ok(sim.moveCount >= 6);
    assert.ok(forces.forces.π >= INIT_FORCES.π);
    assert.strictEqual(forces.forceHistory.length, 7); // init + 6 moves
  });

  it('handles scenario-based deterministic testing', () => {
    const sim = ChessSimulator.createScenario('fork-practice');
    assert.ok(sim.legalMoves.includes('Nf3'));
    assert.ok(sim.legalMoves.includes('Nc3'));

    const move = sim.playMove('g1', 'f3');
    assert.ok(move);
    assert.strictEqual(move!.san, 'Nf3');
  });

  it('restores a custom scenario from its original FEN', () => {
    const sim = ChessSimulator.createScenario('endgame-rook');
    sim.playSan('Kf2');
    const json = sim.toJSON() as { initialFen: string; fen: string; moveHistory: string[] };
    const restored = ChessSimulator.fromJSON(json);
    assert.strictEqual(restored.startFen, sim.startFen);
    assert.strictEqual(restored.fen, sim.fen);
  });

  it('verifies force model financial metrics after volatile sequence', () => {
    const forces = new ForceModel();
    const sequence: Array<'brilliant' | 'blunder' | 'best'> = ['brilliant', 'blunder', 'brilliant', 'blunder', 'best'];

    for (const cls of sequence) {
      forces.apply(cls);
    }

    assert.ok(forces.volatility > 0, 'Volatility should be positive after mixed results');
    assert.ok(forces.maxDrawdown >= 0, 'Max drawdown should be non-negative');
    assert.ok(typeof forces.sharpeRatio === 'number', 'Sharpe ratio should be a number');
  });
});
