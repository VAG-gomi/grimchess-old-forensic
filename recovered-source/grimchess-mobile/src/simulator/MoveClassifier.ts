import type { ClassifiedMove, EngineAnalysis } from './types';

export type ChessColor = 'w' | 'b';

/**
 * Stockfish's UCI score is relative to the side to move. Normalize it before
 * comparing two positions, because a player move changes the side to move.
 */
export function engineScoreToPlayerPerspective(
  evalCp: number,
  sideToMove: ChessColor,
  playerColor: ChessColor,
): number {
  const whitePerspective = sideToMove === 'w' ? evalCp : -evalCp;
  return playerColor === 'w' ? whitePerspective : -whitePerspective;
}

export class MoveClassifier {
  static classify(
    san: string,
    uci: string,
    evalBeforeCp: number,
    evalAfterCp: number,
    isBest: boolean,
    bestMove: string,
    playerIsBlack: boolean
  ): ClassifiedMove {
    const pb = playerIsBlack ? -evalBeforeCp : evalBeforeCp;
    const pa = playerIsBlack ? -evalAfterCp : evalAfterCp;
    const delta = (pa - pb) / 100;

    let classification: ClassifiedMove['classification'];
    if (isBest && delta > 1.5) classification = 'brilliant';
    else if (isBest) classification = 'best';
    else if (delta > -0.3) classification = 'good';
    else if (delta > -0.9) classification = 'inaccuracy';
    else if (delta > -2.0) classification = 'mistake';
    else classification = 'blunder';

    return {
      san, uci, classification, delta,
      evalBeforeCp: pb, evalAfterCp: pa,
      isBest, bestMove, timestamp: Date.now(),
    };
  }

  static classifyFromAnalysis(
    san: string,
    uci: string,
    before: EngineAnalysis,
    after: EngineAnalysis,
    playerIsBlack: boolean
  ): ClassifiedMove {
    const isBest = uci === before.bestMove;
    return MoveClassifier.classify(san, uci, before.evalCp, after.evalCp, isBest, before.bestMove, playerIsBlack);
  }

  static classifyFromEngineAnalyses(
    san: string,
    uci: string,
    before: EngineAnalysis,
    after: Pick<EngineAnalysis, 'evalCp'>,
    playerColor: ChessColor,
    beforeTurn: ChessColor,
    afterTurn: ChessColor,
  ): ClassifiedMove {
    const beforeEval = engineScoreToPlayerPerspective(before.evalCp, beforeTurn, playerColor);
    const afterEval = engineScoreToPlayerPerspective(after.evalCp, afterTurn, playerColor);
    const isBest = uci === before.bestMove;
    return MoveClassifier.classify(san, uci, beforeEval, afterEval, isBest, before.bestMove, false);
  }

  static accuracyScore(classification: ClassifiedMove['classification']): number {
    const scores: Record<string, number> = {
      brilliant: 100, best: 95, good: 80,
      inaccuracy: 50, mistake: 20, blunder: 0,
    };
    return scores[classification] ?? 50;
  }
}
