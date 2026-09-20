import { StockfishAdapter } from './StockfishAdapter';
import { ChessSimulator } from './ChessSimulator';
import { engineScoreToPlayerPerspective } from './MoveClassifier';
import { CHALLENGE_POSITIONS, GAME_BENCHMARKS } from './BenchmarkSuite';
import type {
  BenchmarkResult,
  ChallengePosition,
  GameBenchmarkDefinition,
  GameBenchmarkResult,
  PositionBenchmarkResult,
  TacticalPosition,
} from './types';

export const TACTICAL_POSITIONS: TacticalPosition[] = [
  {
    id: 'mate-in-2-1',
    name: 'Back Rank Mate',
    fen: '6k1/5ppp/8/8/8/8/5PPP/5RK1 b - - 0 1',
    category: 'tactics',
    expectedMoves: ['rf1'],
    description: 'Rook to back rank, forced mate',
    difficulty: 3,
  },
  {
    id: 'fork-1',
    name: 'Knight Fork',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    category: 'tactics',
    expectedMoves: ['ng5'],
    description: 'Knight fork on f7',
    difficulty: 2,
  },
  {
    id: 'pin-1',
    name: 'Absolute Pin',
    fen: 'rnbqkb1r/pppp1ppp/4pn2/8/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 0 4',
    category: 'tactics',
    expectedMoves: ['bc4'],
    description: 'Bishop pins knight to queen',
    difficulty: 2,
  },
  {
    id: 'endgame-1',
    name: 'Lucena Position',
    fen: '1K6/8/8/3k4/8/8/4R3/8 w - - 0 1',
    category: 'endgame',
    expectedMoves: ['re4'],
    description: 'Building a bridge with the rook',
    difficulty: 5,
  },
  {
    id: 'middlegame-1',
    name: 'Greek Gift',
    fen: 'r1bq1rk1/pppp1ppp/2n2n2/1Bb1p3/4P3/2PP1N2/PP3PPP/RNBQ1RK1 w - - 0 6',
    category: 'middlegame',
    expectedMoves: ['xh7'],
    description: 'Bxh7+ sacrifice',
    difficulty: 4,
  },
];

export interface BenchmarkReport {
  total: number;
  passed: number;
  failed: number;
  avgTimeMs: number;
  results: BenchmarkResult[];
  timestamp: number;
}

export interface PositionBenchmarkReport {
  total: number;
  pass: number;
  fail: number;
  inconclusive: number;
  avgTimeMs: number;
  results: PositionBenchmarkResult[];
  suiteVersion: string;
  timestamp: number;
}

export interface GameBenchmarkReport {
  total: number;
  pass: number;
  fail: number;
  inconclusive: number;
  avgTimeMs: number;
  results: GameBenchmarkResult[];
  suiteVersion: string;
  timestamp: number;
}

function playUci(simulator: ChessSimulator, uci: string) {
  const match = uci.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);
  if (!match) return null;
  return simulator.playMove(
    match[1] as never,
    match[2] as never,
    match[3] as 'q' | 'r' | 'b' | 'n' | undefined,
  );
}

export class BenchmarkRunner {
  private engine: StockfishAdapter;

  constructor(wasmPath?: string) {
    this.engine = new StockfishAdapter(wasmPath);
  }

  async run(positions = TACTICAL_POSITIONS, depth = 18): Promise<BenchmarkReport> {
    const results: BenchmarkResult[] = [];
    let totalTime = 0;

    for (const pos of positions) {
      try {
        const analysis = await this.engine.analyze(pos.fen, depth, 3);
        totalTime += analysis.timeMs;

        const passed = pos.expectedMoves.some((em) =>
          analysis.bestMove.toLowerCase().startsWith(em.toLowerCase()) ||
          analysis.topMoves.some((tm) => tm.move.toLowerCase().startsWith(em.toLowerCase()))
        );

        results.push({
          positionId: pos.id,
          name: pos.name,
          expectedBestMove: pos.expectedMoves[0],
          actualBestMove: analysis.bestMove,
          evalCp: analysis.evalCp,
          depth: analysis.depth,
          timeMs: analysis.timeMs,
          passed,
        });
      } catch (err) {
        results.push({
          positionId: pos.id,
          name: pos.name,
          expectedBestMove: pos.expectedMoves[0],
          actualBestMove: 'ERROR',
          evalCp: 0,
          depth: 0,
          timeMs: 0,
          passed: false,
        });
      }
    }

    return {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      avgTimeMs: totalTime / (results.length || 1),
      results,
      timestamp: Date.now(),
    };
  }

  async runChallengePositions(
    positions: ChallengePosition[] = CHALLENGE_POSITIONS,
    depth = 18,
  ): Promise<PositionBenchmarkReport> {
    const results: PositionBenchmarkResult[] = [];
    let totalTime = 0;

    for (const position of positions) {
      const started = performance.now();
      try {
        const analysis = await this.engine.analyze(position.fen, depth, 3);
        const simulator = new ChessSimulator(position.fen);
        const selectedMove = analysis.bestMove;
        const selected = playUci(simulator, selectedMove);
        const afterResponse = selected
          ? await this.engine.analyze(simulator.fen, depth, 1)
          : null;
        const candidates = analysis.topMoves.length > 0
          ? analysis.topMoves.slice(0, 3)
          : [{ move: analysis.bestMove, evalCp: analysis.evalCp }];
        const playerColor = position.fen.split(' ')[1] === 'b' ? 'b' : 'w';
        const opponentColor = playerColor === 'w' ? 'b' : 'w';
        const bestMoveMatch = position.referenceMoves.includes(analysis.bestMove);
        const topThreeMatch = candidates.some((candidate) => position.referenceMoves.includes(candidate.move));
        const finalResult = position.referenceMoves.length === 0
          ? 'INCONCLUSIVE'
          : bestMoveMatch
            ? 'PASS'
            : topThreeMatch
              ? 'INCONCLUSIVE'
              : 'FAIL';
        const timeMs = Math.round(performance.now() - started);
        totalTime += timeMs;

        results.push({
          testId: position.id,
          positionFen: position.fen,
          playerColor,
          initialState: position.fen,
          candidates,
          selectedMove,
          engineEvaluation: {
            beforeCp: engineScoreToPlayerPerspective(analysis.evalCp, playerColor, playerColor),
            afterResponseCp: afterResponse
              ? engineScoreToPlayerPerspective(afterResponse.evalCp, opponentColor, playerColor)
              : 0,
            depth: analysis.depth,
          },
          prediction: null,
          actualResponse: afterResponse?.bestMove ?? null,
          newState: selected ? simulator.fen : null,
          trajectory: selected ? [position.fen, simulator.fen] : [position.fen],
          finalResult,
          timeMs,
          failureClass: position.referenceMoves.length === 0
            ? 'missing_reference_moves'
            : finalResult === 'FAIL'
              ? 'reference_move_miss'
              : null,
          referenceMoves: position.referenceMoves,
          bestMoveMatch,
          topThreeMatch,
        });
      } catch (error) {
        const timeMs = Math.round(performance.now() - started);
        totalTime += timeMs;
        results.push({
          testId: position.id,
          positionFen: position.fen,
          playerColor: position.fen.split(' ')[1] === 'b' ? 'b' : 'w',
          initialState: position.fen,
          candidates: [],
          selectedMove: '',
          engineEvaluation: { beforeCp: 0, afterResponseCp: 0, depth: 0 },
          prediction: null,
          actualResponse: null,
          newState: null,
          trajectory: [position.fen],
          finalResult: 'FAIL',
          timeMs,
          failureClass: `engine_error:${(error as Error).message}`,
          referenceMoves: position.referenceMoves,
          bestMoveMatch: false,
          topThreeMatch: false,
        });
      }
    }

    return {
      total: results.length,
      pass: results.filter((result) => result.finalResult === 'PASS').length,
      fail: results.filter((result) => result.finalResult === 'FAIL').length,
      inconclusive: results.filter((result) => result.finalResult === 'INCONCLUSIVE').length,
      avgTimeMs: totalTime / (results.length || 1),
      results,
      suiteVersion: 'grimchess-gm-challenge-v1.0',
      timestamp: Date.now(),
    };
  }

  async runGameBenchmarks(
    games: GameBenchmarkDefinition[] = GAME_BENCHMARKS,
    depth = 12,
  ): Promise<GameBenchmarkReport> {
    const results: GameBenchmarkResult[] = [];
    let totalTime = 0;

    for (const game of games) {
      const started = performance.now();
      try {
        const simulator = new ChessSimulator(game.startingFen);
        const selectedMoves: string[] = [];
        const trajectory = [simulator.fen];

        while (!simulator.isGameOver && selectedMoves.length < game.maxPlies) {
          const analysis = await this.engine.analyze(simulator.fen, depth, 1);
          const move = playUci(simulator, analysis.bestMove);
          if (!move) throw new Error(`Illegal engine move ${analysis.bestMove}`);
          selectedMoves.push(analysis.bestMove);
          trajectory.push(simulator.fen);
        }

        const timeMs = Math.round(performance.now() - started);
        totalTime += timeMs;
        results.push({
          testId: game.id,
          startingFen: game.startingFen,
          playerColor: game.playerColor,
          initialState: game.startingFen,
          selectedMoves,
          trajectory,
          finalFen: simulator.fen,
          plies: selectedMoves.length,
          finalResult: 'INCONCLUSIVE',
          timeMs,
          failureClass: null,
        });
      } catch (error) {
        const timeMs = Math.round(performance.now() - started);
        totalTime += timeMs;
        results.push({
          testId: game.id,
          startingFen: game.startingFen,
          playerColor: game.playerColor,
          initialState: game.startingFen,
          selectedMoves: [],
          trajectory: [game.startingFen],
          finalFen: game.startingFen,
          plies: 0,
          finalResult: 'FAIL',
          timeMs,
          failureClass: `game_error:${(error as Error).message}`,
        });
      }
    }

    return {
      total: results.length,
      pass: 0,
      fail: results.filter((result) => result.finalResult === 'FAIL').length,
      inconclusive: results.filter((result) => result.finalResult === 'INCONCLUSIVE').length,
      avgTimeMs: totalTime / (results.length || 1),
      results,
      suiteVersion: 'grimchess-game-benchmark-v1.0',
      timestamp: Date.now(),
    };
  }

  async stressTest(iterations = 10, depth = 15): Promise<{
    avgTimeMs: number;
    minTimeMs: number;
    maxTimeMs: number;
    successRate: number;
  }> {
    const times: number[] = [];
    let successes = 0;

    for (let i = 0; i < iterations; i++) {
      try {
        const start = performance.now();
        await this.engine.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', depth, 1);
        const elapsed = performance.now() - start;
        times.push(elapsed);
        successes++;
      } catch {
        times.push(0);
      }
    }

    const valid = times.filter((t) => t > 0);
    return {
      avgTimeMs: valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0,
      minTimeMs: valid.length ? Math.min(...valid) : 0,
      maxTimeMs: valid.length ? Math.max(...valid) : 0,
      successRate: successes / iterations,
    };
  }

  terminate(): void {
    this.engine.terminate();
  }
}
