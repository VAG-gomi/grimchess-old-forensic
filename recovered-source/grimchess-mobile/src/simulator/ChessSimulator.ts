import { Chess, type Move, type Square } from 'chess.js';
import type { PositionSnapshot, GameEvent } from './types';

export class ChessSimulator {
  private game: Chess;
  private readonly initialFen: string;
  private events: GameEvent[] = [];
  private moveHistory: Move[] = [];
  private snapshots: PositionSnapshot[] = [];

  constructor(fen?: string) {
    this.initialFen = fen ?? new Chess().fen();
    this.game = new Chess(this.initialFen);
    this.recordSnapshot();
  }

  get startFen(): string { return this.initialFen; }
  get fen(): string { return this.game.fen(); }
  get pgn(): string { return this.game.pgn(); }
  get turn(): 'w' | 'b' { return this.game.turn(); }
  get isGameOver(): boolean { return this.game.isGameOver(); }
  get isCheckmate(): boolean { return this.game.isCheckmate(); }
  get isDraw(): boolean { return this.game.isDraw(); }
  get isCheck(): boolean { return this.game.isCheck(); }
  get moveCount(): number { return this.moveHistory.length; }
  get history(): Move[] { return [...this.moveHistory]; }
  get legalMoves(): string[] { return this.game.moves(); }

  playMove(from: Square, to: Square, promotion?: 'q' | 'r' | 'b' | 'n'): Move | null {
    if (this.game.isGameOver()) return null;
    let move: Move;
    try {
      move = this.game.move({ from, to, promotion });
    } catch {
      return null;
    }
    if (!move) return null;
    this.moveHistory.push(move);
    this.recordSnapshot();
    this.emit({ type: 'move', payload: { san: move.san, from, to, promotion, fen: this.game.fen() }, timestamp: Date.now() });
    return move;
  }

  playSan(san: string): Move | null {
    if (this.game.isGameOver()) return null;
    let move: Move;
    try {
      move = this.game.move(san);
    } catch {
      return null;
    }
    if (!move) return null;
    this.moveHistory.push(move);
    this.recordSnapshot();
    this.emit({ type: 'move', payload: { san: move.san, fen: this.game.fen() }, timestamp: Date.now() });
    return move;
  }

  undo(): Move | null {
    const move = this.game.undo();
    if (move) { this.moveHistory.pop(); this.snapshots.pop(); }
    return move;
  }

  private recordSnapshot(): void {
    this.snapshots.push({
      fen: this.game.fen(), pgn: this.game.pgn(),
      moveNumber: Math.floor(this.moveHistory.length / 2) + 1,
      turn: this.game.turn(), legalMoves: this.game.moves(),
      isCheck: this.game.isCheck(), isCheckmate: this.game.isCheckmate(),
      isDraw: this.game.isDraw(), timestamp: Date.now(),
    });
  }

  getSnapshot(index: number): PositionSnapshot | null {
    return this.snapshots[index] ?? null;
  }

  getCurrentSnapshot(): PositionSnapshot {
    return this.snapshots[this.snapshots.length - 1];
  }

  private emit(event: GameEvent): void { this.events.push(event); }
  getEvents(): GameEvent[] { return [...this.events]; }
  getEventsByType(type: GameEvent['type']): GameEvent[] { return this.events.filter((e) => e.type === type); }

  toJSON(): object {
    return {
      initialFen: this.initialFen,
      fen: this.game.fen(),
      pgn: this.game.pgn(),
      moveHistory: this.moveHistory.map((m) => m.san),
      events: this.events,
      snapshots: this.snapshots,
    };
  }

  static fromJSON(data: { fen: string; moveHistory: string[]; initialFen?: string }): ChessSimulator {
    const sim = new ChessSimulator(data.initialFen ?? (data.moveHistory.length > 0 ? undefined : data.fen));
    for (const san of data.moveHistory) sim.playSan(san);
    return sim;
  }

  static createScenario(name: string): ChessSimulator {
    const scenarios: Record<string, string> = {
      'scholars-mate': 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 4',
      'smothered-mate': 'r1bqk2r/pppp1ppp/2n2n2/1Bb1p3/4P3/2PP1N2/PP3PPP/RNBQ1RK1 w kq - 0 6',
      'fork-practice': 'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3',
      'endgame-rook': '8/8/8/3k4/4R3/8/8/4K3 w - - 0 1',
      'queen-sacrifice': 'rnbqkb1r/pppp1ppp/4pn2/8/4P3/2N2Q2/PPPP1PPP/R1B1KBNR w KQkq - 0 4',
    };
    return new ChessSimulator(scenarios[name] || scenarios['fork-practice']);
  }
}
