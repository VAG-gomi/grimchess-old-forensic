import { Chess } from 'chess.js';
import type {
  ChallengeCategory,
  ChallengePosition,
  GameBenchmarkCategory,
  GameBenchmarkDefinition,
} from './types';

const STANDARD_FEN = new Chess().fen();

const OPENING_LINES: string[][] = [
  ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6'],
  ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6'],
  ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3', 'O-O'],
  ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7'],
  ['c4', 'e5', 'Nc3', 'Nf6', 'g3', 'Bb4', 'Bg2', 'O-O'],
  ['Nf3', 'd5', 'g3', 'Nf6', 'Bg2', 'e6', 'O-O', 'Be7'],
  ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Bg5', 'Be7'],
  ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'],
  ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5', 'cxd5', 'Nxd5'],
  ['c4', 'c5', 'Nc3', 'Nc6', 'g3', 'g6', 'Bg2', 'Bg7'],
];

const UNUSUAL_FENS = [
  'r3k2r/ppp2ppp/2n1b3/3pP3/3P1B2/2N5/PPP2PPP/R3K2R w KQkq - 0 12',
  '4k3/pp6/2p5/3pPp2/3P1P2/2P5/PP6/4K3 w - - 0 1',
  '2r3k1/pp2qppp/2np4/3Np3/1P2P3/2P1B3/P2Q1PPP/2R3K1 b - - 0 18',
  'r1b1k2r/ppppqppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 0 8',
  '8/2p5/3p4/1p1Pp3/1P2P1k1/2P3P1/8/6K1 b - - 0 1',
];

const DISADVANTAGE_FENS = [
  '4k3/8/8/8/8/8/4p3/4K3 w - - 0 1',
  '4k3/8/8/8/8/8/4p3/4K3 b - - 0 1',
  '4k3/8/8/8/8/8/8/4K3 w - - 0 1',
];

const ENDGAME_FENS = [
  '8/8/8/3k4/4R3/8/8/4K3 w - - 0 1',
  '8/8/8/3k4/8/8/4P3/4K3 w - - 0 1',
  '7k/8/2b5/8/8/8/4B3/6K1 w - - 0 1',
  '7k/8/2n5/8/8/8/4N3/6K1 w - - 0 1',
  '7k/8/8/8/8/8/R7/6K1 w - - 0 1',
];

function positionAfterMoves(startFen: string, moves: string[]): string {
  const chess = new Chess(startFen);
  for (const san of moves) {
    const move = chess.move(san);
    if (!move) throw new Error(`Invalid benchmark fixture move ${san}`);
  }
  return chess.fen();
}

function generatedPosition(seed: number, plies: number, startFen = STANDARD_FEN): string {
  const chess = new Chess(startFen);
  for (let ply = 0; ply < plies && !chess.isGameOver(); ply += 1) {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) break;
    const index = (seed * 31 + ply * 17 + ply * ply) % moves.length;
    chess.move(moves[index].san);
  }
  return chess.fen();
}

function makePositions(
  category: ChallengeCategory,
  count: number,
  plies: number,
  description: string,
  starts: string[] = [STANDARD_FEN],
): ChallengePosition[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${category}-${String(index + 1).padStart(2, '0')}`,
    category,
    fen: generatedPosition(index + 1, plies + (index % 5), starts[index % starts.length]),
    description: `${description}; deterministic fixture ${index + 1}`,
    difficulty: Math.min(10, 4 + (index % 7)),
    referenceMoves: [],
    referenceSource: null,
  }));
}

function makeCuratedPositions(
  category: 'defensive' | 'endgame',
  starts: string[],
  description: string,
): ChallengePosition[] {
  return Array.from({ length: category === 'defensive' ? 15 : 15 }, (_, index) => ({
    id: `${category}-${String(index + 1).padStart(2, '0')}`,
    category,
    fen: generatedPosition(index + 1, 2 + (index % 7), description === 'defensive' ? starts[index % starts.length] : starts[index % starts.length]),
    description: `${description}; deterministic fixture ${index + 1}`,
    difficulty: Math.min(10, 5 + (index % 6)),
    referenceMoves: [],
    referenceSource: null,
  }));
}

export const CHALLENGE_POSITIONS: ChallengePosition[] = [
  ...makePositions('tactical', 20, 8, 'forcing and calculation fixture'),
  ...makePositions('strategic', 20, 16, 'positional and long-horizon fixture', OPENING_LINES.map((line) => positionAfterMoves(STANDARD_FEN, line))),
  ...makeCuratedPositions('defensive', DISADVANTAGE_FENS, 'defensive survival fixture'),
  ...makeCuratedPositions('endgame', ENDGAME_FENS, 'endgame state-transition fixture'),
  ...makePositions('positional-trap', 10, 12, 'deceptive immediate-evaluation fixture', OPENING_LINES.slice(0, 5).map((line) => positionAfterMoves(STANDARD_FEN, line))),
  ...makePositions('dynamic', 10, 20, 'branching and multi-response fixture', OPENING_LINES.slice(5).map((line) => positionAfterMoves(STANDARD_FEN, line))),
];

export const CHALLENGE_CATEGORY_COUNTS: Record<ChallengeCategory, number> = {
  tactical: 20,
  strategic: 20,
  defensive: 15,
  endgame: 15,
  'positional-trap': 10,
  dynamic: 10,
};

function gameDefinition(
  category: GameBenchmarkCategory,
  index: number,
  startingFen: string,
  description: string,
  playerColor: 'w' | 'b',
  opponentMode: GameBenchmarkDefinition['opponentMode'],
  maxPlies: number,
): GameBenchmarkDefinition {
  return {
    id: `${category}-${String(index + 1).padStart(2, '0')}`,
    category,
    startingFen,
    playerColor,
    opponentMode,
    maxPlies,
    description,
  };
}

export const GAME_BENCHMARKS: GameBenchmarkDefinition[] = [
  ...Array.from({ length: 20 }, (_, index) => gameDefinition(
    'balanced',
    index,
    positionAfterMoves(STANDARD_FEN, OPENING_LINES[index % OPENING_LINES.length]),
    'balanced opening self-play fixture',
    index % 2 === 0 ? 'w' : 'b',
    'stockfish',
    80,
  )),
  ...Array.from({ length: 10 }, (_, index) => gameDefinition(
    'disadvantage',
    index,
    DISADVANTAGE_FENS[index % DISADVANTAGE_FENS.length],
    'objectively worse starting position',
    'w',
    'stockfish',
    60,
  )),
  ...Array.from({ length: 10 }, (_, index) => gameDefinition(
    'unusual',
    index,
    UNUSUAL_FENS[index % UNUSUAL_FENS.length],
    'unusual material or pawn-structure fixture',
    index % 2 === 0 ? 'w' : 'b',
    'stockfish',
    70,
  )),
  ...Array.from({ length: 10 }, (_, index) => gameDefinition(
    'adversarial',
    index,
    CHALLENGE_POSITIONS[70 + index].fen,
    'forcing and branching opponent fixture',
    index % 2 === 0 ? 'w' : 'b',
    'forcing-reference',
    70,
  )),
  ...Array.from({ length: 10 }, (_, index) => gameDefinition(
    'long-conversion',
    index,
    ENDGAME_FENS[index % ENDGAME_FENS.length],
    'advantage-conversion fixture',
    'w',
    'stockfish',
    120,
  )),
];

export const GAME_CATEGORY_COUNTS: Record<GameBenchmarkCategory, number> = {
  balanced: 20,
  disadvantage: 10,
  unusual: 10,
  adversarial: 10,
  'long-conversion': 10,
};