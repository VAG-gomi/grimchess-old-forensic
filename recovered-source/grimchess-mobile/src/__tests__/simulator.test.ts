import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ChessSimulator } from '../simulator/ChessSimulator';
import { MoveClassifier, engineScoreToPlayerPerspective } from '../simulator/MoveClassifier';
import { ForceModel } from '../simulator/ForceModel';

describe('ChessSimulator', () => {
  it('starts from standard position', () => {
    const sim = new ChessSimulator();
    assert.strictEqual(sim.fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    assert.strictEqual(sim.turn, 'w');
    assert.strictEqual(sim.moveCount, 0);
    assert.strictEqual(sim.isGameOver, false);
  });

  it('plays legal moves', () => {
    const sim = new ChessSimulator();
    const move = sim.playMove('e2', 'e4');
    assert.ok(move);
    assert.strictEqual(move!.san, 'e4');
    assert.strictEqual(sim.moveCount, 1);
    assert.strictEqual(sim.turn, 'b');
  });

  it('allows pieces to move again on later turns, including queen movement', () => {
    const sim = new ChessSimulator();
    assert.ok(sim.playSan('e4'));
    assert.ok(sim.playSan('e5'));
    assert.ok(sim.playSan('Qh5'));
    assert.ok(sim.playSan('Nc6'));
    const queenMove = sim.playSan('Qxe5');
    assert.ok(queenMove);
    assert.strictEqual(queenMove!.san, 'Qxe5+');
  });

  it('rejects illegal moves', () => {
    const sim = new ChessSimulator();
    const move = sim.playMove('e2', 'e5');
    assert.strictEqual(move, null);
    assert.strictEqual(sim.moveCount, 0);
  });

  it('records snapshots', () => {
    const sim = new ChessSimulator();
    sim.playMove('e2', 'e4');
    const snap = sim.getCurrentSnapshot();
    assert.ok(snap);
    assert.strictEqual(snap.turn, 'b');
    assert.ok(snap.legalMoves.length > 0);
  });

  it('undoes moves', () => {
    const sim = new ChessSimulator();
    sim.playMove('e2', 'e4');
    const undone = sim.undo();
    assert.ok(undone);
    assert.strictEqual(sim.moveCount, 0);
    assert.strictEqual(sim.fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  it('serializes and deserializes', () => {
    const sim = new ChessSimulator();
    sim.playMove('e2', 'e4');
    sim.playMove('e7', 'e5');
    const json = sim.toJSON();
    const restored = ChessSimulator.fromJSON({
      fen: (json as any).fen,
      moveHistory: (json as any).moveHistory,
    });
    assert.strictEqual(restored.moveCount, 2);
    assert.strictEqual(restored.fen, sim.fen);
  });

  it('creates scenarios', () => {
    const sim = ChessSimulator.createScenario('fork-practice');
    assert.ok(sim.fen.includes('w'));
    assert.ok(sim.legalMoves.length > 0);
  });

  it('detects checkmate', () => {
    const sim = new ChessSimulator();
    sim.playSan('e4');
    sim.playSan('e5');
    sim.playSan('Qh5');
    sim.playSan('Nc6');
    sim.playSan('Bc4');
    sim.playSan('Nf6');
    sim.playSan('Qxf7');
    assert.strictEqual(sim.isCheckmate, true);
    assert.strictEqual(sim.isGameOver, true);
  });

  it('supports castling', () => {
    const sim = new ChessSimulator();
    for (const san of ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6']) assert.ok(sim.playSan(san));
    assert.strictEqual(sim.playSan('O-O')?.san, 'O-O');
  });

  it('supports en passant', () => {
    const sim = new ChessSimulator();
    for (const san of ['e4', 'a6', 'e5', 'd5']) assert.ok(sim.playSan(san));
    assert.strictEqual(sim.playSan('exd6')?.san, 'exd6');
  });

  it('supports pawn promotion', () => {
    const sim = new ChessSimulator('7k/P7/8/8/8/8/8/7K w - - 0 1');
    assert.strictEqual(sim.playMove('a7', 'a8', 'q')?.san, 'a8=Q+');
  });

  it('recognizes stalemate as game over', () => {
    const sim = new ChessSimulator('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    assert.strictEqual(sim.isDraw, true);
    assert.strictEqual(sim.isGameOver, true);
  });
});

describe('MoveClassifier', () => {
  it('classifies brilliant moves', () => {
    const cls = MoveClassifier.classify('Nf3', 'g1f3', 0, 200, true, 'g1f3', false);
    assert.strictEqual(cls.classification, 'brilliant');
    assert.strictEqual(cls.isBest, true);
  });

  it('classifies blunders', () => {
    const cls = MoveClassifier.classify('h3', 'h2h3', 50, -300, false, 'e4', false);
    assert.strictEqual(cls.classification, 'blunder');
    assert.ok(cls.delta < -2);
  });

  it('classifies best moves without large delta', () => {
    const cls = MoveClassifier.classify('e4', 'e2e4', 30, 35, true, 'e2e4', false);
    assert.strictEqual(cls.classification, 'best');
  });

  it('computes accuracy scores', () => {
    assert.strictEqual(MoveClassifier.accuracyScore('brilliant'), 100);
    assert.strictEqual(MoveClassifier.accuracyScore('blunder'), 0);
    assert.strictEqual(MoveClassifier.accuracyScore('good'), 80);
  });

  it('handles black perspective', () => {
    const cls = MoveClassifier.classify('e5', 'e7e5', 0, -50, true, 'e7e5', true);
    assert.strictEqual(cls.classification, 'best');
    assert.ok(cls.delta > 0);
  });

  it('normalizes side-to-move scores to the player perspective', () => {
    assert.strictEqual(engineScoreToPlayerPerspective(80, 'w', 'w'), 80);
    assert.strictEqual(engineScoreToPlayerPerspective(80, 'b', 'w'), -80);
    assert.strictEqual(engineScoreToPlayerPerspective(80, 'w', 'b'), -80);
    assert.strictEqual(engineScoreToPlayerPerspective(80, 'b', 'b'), 80);
  });
});

describe('ForceModel', () => {
  it('initializes with default forces', () => {
    const model = new ForceModel();
    assert.strictEqual(model.forces.π, 0.1416);
    assert.strictEqual(model.stage, 'FRAGMENTED');
  });

  it('updates forces on brilliant move', () => {
    const model = new ForceModel();
    model.apply('brilliant');
    assert.ok(model.forces.π > 0.28);
    assert.ok(model.forces.h > 0.3);
    assert.ok(model.forces.e < 0.1);
  });

  it('updates forces on blunder', () => {
    const model = new ForceModel();
    model.apply('blunder');
    assert.strictEqual(model.forces.π, 0.1416); // clamped at floor
    assert.ok(model.forces.e > 0.1);
  });

  it('progresses through stages', () => {
    const model = new ForceModel();
    for (let i = 0; i < 3; i++) model.apply('best');
    assert.ok(model.forces.π > 0.425);
    assert.strictEqual(model.stage, 'STRUCTURE');
  });

  it('tracks history', () => {
    const model = new ForceModel();
    model.apply('good');
    model.apply('good');
    assert.strictEqual(model.forceHistory.length, 3); // init + 2 updates
  });

  it('computes Sharpe ratio', () => {
    const model = new ForceModel();
    model.apply('brilliant');
    model.apply('best');
    model.apply('good');
    const sharpe = model.sharpeRatio;
    assert.ok(typeof sharpe === 'number');
    assert.ok(!isNaN(sharpe));
  });

  it('computes max drawdown', () => {
    const model = new ForceModel();
    model.apply('brilliant'); // π up
    model.apply('blunder');   // π down
    const dd = model.maxDrawdown;
    assert.ok(dd >= 0);
  });

  it('computes volatility', () => {
    const model = new ForceModel();
    model.apply('best');
    model.apply('mistake');
    model.apply('best');
    const vol = model.volatility;
    assert.ok(vol >= 0);
  });

  it('clamps forces to valid ranges', () => {
    const model = new ForceModel();
    for (let i = 0; i < 100; i++) model.apply('blunder');
    assert.strictEqual(model.forces.π, 0.1416);
    assert.ok(model.forces.h >= 0 && model.forces.h <= 1);
    assert.ok(model.forces.e >= 0 && model.forces.e <= 1);
  });

  it('serializes and deserializes', () => {
    const model = new ForceModel();
    model.apply('best');
    model.apply('good');
    const json = model.toJSON();
    const restored = ForceModel.fromJSON(json as any);
    assert.strictEqual(restored.forces.π, model.forces.π);
    assert.strictEqual(restored.forceHistory.length, model.forceHistory.length);
  });

  it('clones the complete history instead of restarting metrics', () => {
    const model = new ForceModel();
    model.apply('best');
    model.apply('good');
    const clone = model.clone();
    assert.deepStrictEqual(clone.forces, model.forces);
    assert.strictEqual(clone.forceHistory.length, model.forceHistory.length);
    clone.apply('mistake');
    assert.strictEqual(model.forceHistory.length, 3);
    assert.strictEqual(clone.forceHistory.length, 4);
  });
});
