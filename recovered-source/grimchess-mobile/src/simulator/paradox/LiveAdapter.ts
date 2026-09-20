import type { EngineAnalysis } from '../types';
import type { EngineCandidate, PositionFeatures } from './types';

export function featuresFromFen(fen: string): PositionFeatures {
  const board = fen.split(' ')[0];
  const expanded = board.replace(/[1-8]/g, (digit) => 'x'.repeat(Number(digit)));
  const whitePieces = (expanded.match(/[KQRBNP]/g) ?? []).length;
  const blackPieces = (expanded.match(/[kqrbnp]/g) ?? []).length;
  const whitePawns = (expanded.match(/P/g) ?? []).length;
  const blackPawns = (expanded.match(/p/g) ?? []).length;
  const centerState = whitePawns + blackPawns >= 10 ? 'locked' : whitePawns + blackPawns >= 6 ? 'semi_open' : 'open';
  const development = whitePieces - blackPieces > 1 ? 'ahead' : blackPieces - whitePieces > 1 ? 'behind' : 'equal';
  const kingSafety = Math.abs(whitePawns - blackPawns) >= 3 ? 'unsafe' : 'balanced';
  const space = whitePawns > blackPawns + 1 ? 'queenside' : blackPawns > whitePawns + 1 ? 'kingside' : 'balanced';
  return { centerState, development, kingSafety, space };
}

type AnalysisLike = EngineAnalysis | { move: string; evalCp: number };

export function candidatesFromAnalysis(analysis: AnalysisLike): EngineCandidate[] {
  const bestMove = 'bestMove' in analysis ? analysis.bestMove : analysis.move;
  const topMoves = 'topMoves' in analysis ? analysis.topMoves : [];
  const candidates = topMoves.map((move) => ({ uci: move.move, evalCp: move.evalCp }));
  if (!candidates.some((candidate) => candidate.uci === bestMove)) {
    candidates.unshift({ uci: bestMove, evalCp: analysis.evalCp });
  }
  return candidates;
}

export function candidatesFromTopMoves(moves: { move: string; evalCp: number }[]): EngineCandidate[] {
  return moves.map((move) => ({ uci: move.move, evalCp: move.evalCp }));
}
