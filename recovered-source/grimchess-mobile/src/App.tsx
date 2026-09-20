import { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { type Square } from 'chess.js';
import type { ChatMessage, MoveClassification } from './types';
import {
  ChessSimulator, StockfishAdapter, MoveClassifier,
  ForceModel, OracleService, ReplayStore, INIT_FORCES, ParadoxEngine,
  candidatesFromAnalysis, candidatesFromTopMoves, engineScoreToPlayerPerspective, featuresFromFen,
  AsyncTaskQueue, SessionEpochGate, predictionMatchesFen, type PendingPrediction,
} from './simulator';
import InitScreen, { DIFFICULTY } from './components/InitScreen';
import ResumeScreen from './components/ResumeScreen';

const BODY_NAMES: Record<string, string> = {
  S: 'SUPPRESSION', O: 'OFFERING', F: 'FEELING', X: 'FRACTURE', H: 'HELD',
};

function playUciMove(simulator: ChessSimulator, uci: string) {
  const match = uci.match(/^([a-h][1-8])([a-h][1-8])([qrbn])?$/);
  if (!match) return null;
  return simulator.playMove(
    match[1] as Square,
    match[2] as Square,
    match[3] as 'q' | 'r' | 'b' | 'n' | undefined,
  );
}

function detectBodyType(moves: { san: string; piece: string; from: string; to: string }[]): string | null {
  if (moves.length < 4) return null;
  let captures = 0, checks = 0, pawnMoves = 0, pieceMoves = 0, passive = 0, contradictory = 0;
  const squares: Record<string, string> = {};

  for (const m of moves) {
    if (m.san.includes('x')) captures++;
    if (m.san.includes('+')) checks++;
    if (m.piece === 'p') pawnMoves++;
    else pieceMoves++;
    if (m.piece !== 'p' && !m.san.includes('x') && !m.san.includes('+')) passive++;
    if (squares[m.to] && squares[m.to] !== m.piece) contradictory++;
    squares[m.from] = m.piece;
  }

  const total = moves.length;
  if (pawnMoves / total > 0.5 && pieceMoves < 4) return 'S';
  if (captures / total > 0.35) return 'O';
  if (checks > 3 && captures > 3) return 'F';
  if (contradictory > 0) return 'X';
  if (passive / total > 0.4) return 'H';
  return 'O';
}

export default function App() {
  const store = useRef(new ReplayStore()).current;
  const engine = useRef<StockfishAdapter | null>(null);
  const engineQueue = useRef(new AsyncTaskQueue()).current;
  const oracle = useRef(new OracleService()).current;
  const paradoxRef = useRef(new ParadoxEngine());
  const pendingPrediction = useRef<PendingPrediction | null>(null);
  const activeFenRef = useRef('');
  const sessionEpoch = useRef(new SessionEpochGate()).current;
  const moveSequenceRef = useRef(0);

  const [phase, setPhase] = useState<'init' | 'resume' | 'session'>('init');
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState(6);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');

  const [simulator, setSimulator] = useState(() => new ChessSimulator());
  const [position, setPosition] = useState(simulator.fen);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);

  const [forceModel, setForceModel] = useState(() => new ForceModel(INIT_FORCES));
  const forceModelRef = useRef(forceModel);
  const [lastClass, setLastClass] = useState<MoveClassification | null>(null);
  const [bodyType, setBodyType] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const [orientation, setOrientation] = useState<'w' | 'b'>('w');
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  const ensureEngine = useCallback(() => {
    if (!engine.current) engine.current = new StockfishAdapter();
    return engine.current;
  }, []);

  const runEngine = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    return engineQueue.enqueue(task);
  }, [engineQueue]);

  // Load saved session
  useEffect(() => {
    store.loadSession().then((saved) => {
      if (!saved) return;
      const sim = ChessSimulator.fromJSON({
        fen: saved.fen,
        initialFen: saved.initialFen,
        moveHistory: saved.moveHistory || [],
      });
      setSimulator(sim);
      setPosition(sim.fen);
      activeFenRef.current = sim.fen;
      setName(saved.name || '');
      setDifficulty(saved.difficulty ?? 6);
      setPlayerColor(saved.playerColor || 'w');
      setMsgs(saved.msgs || []);
      const restoredForces = ForceModel.fromJSON({
        state: saved.forces || INIT_FORCES,
        history: saved.forceHistory || [],
      });
      forceModelRef.current = restoredForces;
      setForceModel(restoredForces);
      setLastClass(saved.lastClass || null);
      setBodyType(saved.bodyType || null);
      if (saved.paradoxState) {
        paradoxRef.current = ParadoxEngine.fromJSON(saved.paradoxState);
        const predictions = saved.paradoxState.predictions;
        const lastPrediction = predictions[predictions.length - 1];
        pendingPrediction.current = lastPrediction
          ? { id: lastPrediction.id, fen: lastPrediction.fen }
          : null;
      }
      setOrientation(saved.playerColor || 'w');
      setPhase('resume');
    });
  }, []);

  // Auto-save
  useEffect(() => {
    if (phase !== 'session') return;
    store.saveSession({
      name, difficulty, playerColor, fen: simulator.fen,
      initialFen: simulator.startFen,
      moveHistory: simulator.history.map((m) => m.san),
      msgs, forces: forceModel.forces, lastClass, bodyType,
      forceHistory: forceModel.forceHistory,
      paradoxState: paradoxRef.current.serialize(),
    });
    store.saveHistory(forceModel.forceHistory);
  }, [phase, name, difficulty, playerColor, simulator, msgs, forceModel, lastClass, bodyType, store]);

  const startGame = useCallback(async (config: { name: string; difficulty: number; playerColor: 'w' | 'b' }) => {
    const epoch = sessionEpoch.begin();
    setName(config.name);
    setDifficulty(config.difficulty);
    setPlayerColor(config.playerColor);

    const sim = new ChessSimulator();
    setSimulator(sim);
    setPosition(sim.fen);
    activeFenRef.current = sim.fen;
    setSelectedSquare(null);
    setSelectedPiece(null);
    setMsgs([]);
    const initialForces = new ForceModel(INIT_FORCES);
    forceModelRef.current = initialForces;
    setForceModel(initialForces);
    setLastClass(null);
    setBodyType(null);
    paradoxRef.current = new ParadoxEngine();
    pendingPrediction.current = null;
    setError(null);
    setPhase('session');
    setOrientation(config.playerColor);

    const engineInstance = ensureEngine();

    // If player is black, engine moves first
    if (config.playerColor === 'b') {
      setBotThinking(true);
      try {
        const diff = DIFFICULTY[config.difficulty];
        const res = await runEngine(() => engineInstance.getBestMove(sim.fen, Math.min(diff.depth, 10)));
        const botMove = sim.playMove(res.move.slice(0, 2) as Square, res.move.slice(2, 4) as Square, res.move[4] as 'q' | 'r' | 'b' | 'n' | undefined);
        if (botMove) {
          setPosition(sim.fen);
          activeFenRef.current = sim.fen;
          const candidates = await runEngine(() => engineInstance.getTopMoves(sim.fen, 8, 3));
          if (sessionEpoch.isCurrent(epoch) && activeFenRef.current === sim.fen) {
            const prediction = paradoxRef.current.beginPosition(
              sim.fen, featuresFromFen(sim.fen), candidatesFromTopMoves(candidates),
            );
            pendingPrediction.current = { id: prediction.id, fen: prediction.fen };
          }
        }
      } catch (err) {
        setError((err as Error).message || 'Engine failed');
      } finally {
        setBotThinking(false);
      }
    }
  }, [ensureEngine, runEngine, sessionEpoch]);

  const handleReset = useCallback(async () => {
    sessionEpoch.invalidate();
    await store.clearAll();
    engine.current?.terminate();
    engine.current = null;
    engineQueue.reset();
    oracle.cleanup();
    setPhase('init');
    setName('');
    setDifficulty(6);
    setPlayerColor('w');
    const resetSimulator = new ChessSimulator();
    setSimulator(resetSimulator);
    setPosition(resetSimulator.fen);
    activeFenRef.current = resetSimulator.fen;
    setSelectedSquare(null);
    setSelectedPiece(null);
    setMsgs([]);
    const resetForces = new ForceModel(INIT_FORCES);
    forceModelRef.current = resetForces;
    setForceModel(resetForces);
    setLastClass(null);
    setBodyType(null);
    paradoxRef.current = new ParadoxEngine();
    pendingPrediction.current = null;
    setError(null);
  }, [store, oracle]);

  const handleResume = useCallback(() => {
    setPhase('session');
  }, []);

  // Async turn processing
  const handleTurnAsync = useCallback(async (san: string, uci: string, fenBefore: string) => {
    const epoch = sessionEpoch.begin();
    const moveId = ++moveSequenceRef.current;
    const fenAfterPlayer = simulator.fen;
    const playerTurn = playerColor;
    setLoading(true);
    setError(null);

    try {
      const engineInstance = ensureEngine();
      const diff = DIFFICULTY[difficulty];
      let botSan = '';
      let fenAfterBot = fenAfterPlayer;

      // The legal bot reply is the only work that blocks the next player turn.
      if (!simulator.isGameOver) {
        setBotThinking(true);
        const immediate = await runEngine(() => engineInstance.getBestMove(
          fenAfterPlayer,
          Math.min(diff.depth, 8),
        ));
        const immediateMove = playUciMove(simulator, immediate.move);
        if (!immediateMove) throw new Error(`Engine returned illegal move: ${immediate.move}`);
        botSan = immediateMove.san;
        fenAfterBot = simulator.fen;
        activeFenRef.current = fenAfterBot;
        setPosition(fenAfterBot);
      }

      setBotThinking(false);
      setLoading(false);

      const historyAfterBot = simulator.history.map((move) => ({
        san: move.san,
        piece: move.piece,
        from: move.from,
        to: move.to,
      }));
      const pgnAfterBot = simulator.pgn;
      const gameOverAfterBot = simulator.isGameOver;
      const existingPrediction = predictionMatchesFen(pendingPrediction.current, fenBefore)
        ? pendingPrediction.current
        : null;
      pendingPrediction.current = null;

      // Analysis is queued after the bot reply and never controls board input.
      void runEngine(async () => {
        const beforeRes = await engineInstance.analyze(fenBefore, 8, 3);
        const afterRes = await engineInstance.getBestMove(fenAfterPlayer, 10);
        const predictionId = existingPrediction?.id ?? paradoxRef.current.beginPosition(
          fenBefore,
          featuresFromFen(fenBefore),
          candidatesFromAnalysis(beforeRes),
        ).id;
        const cognitiveUpdate = paradoxRef.current.observeMove(
          predictionId,
          uci,
          engineScoreToPlayerPerspective(beforeRes.evalCp, playerTurn, playerColor),
          engineScoreToPlayerPerspective(afterRes.evalCp, playerTurn === 'w' ? 'b' : 'w', playerColor),
        );
        const afterTurn = playerTurn === 'w' ? 'b' : 'w';
        const cls = MoveClassifier.classifyFromEngineAnalyses(
          san,
          uci,
          beforeRes,
          afterRes,
          playerColor,
          playerTurn,
          afterTurn,
        );
        const legacyClass = {
          classification: cls.classification,
          delta: cls.delta,
          bestMove: cls.bestMove,
          fenAfter: fenAfterPlayer,
          moveSan: cls.san,
        } satisfies MoveClassification;
        if (!sessionEpoch.isCurrent(epoch)) return null;
        const nextForce = forceModelRef.current.clone();
        nextForce.apply(cls.classification);
        forceModelRef.current = nextForce;
        if (moveSequenceRef.current === moveId) setLastClass(legacyClass);
        setForceModel(nextForce);

        const bt = detectBodyType(historyAfterBot);
        if (bt && moveSequenceRef.current === moveId) setBodyType(BODY_NAMES[bt] || bt);

        if (sessionEpoch.isCurrent(epoch) && activeFenRef.current === fenAfterBot && !gameOverAfterBot) {
          const nextCandidates = await engineInstance.getTopMoves(fenAfterBot, 8, 3);
          const nextPrediction = paradoxRef.current.beginPosition(
            fenAfterBot,
            featuresFromFen(fenAfterBot),
            candidatesFromTopMoves(nextCandidates),
          );
          pendingPrediction.current = { id: nextPrediction.id, fen: nextPrediction.fen };
        }

        return {
          legacyClass,
          forceState: nextForce,
          stage: nextForce.stage,
          bodyType: bt ? BODY_NAMES[bt] || bt : bodyType,
          contradictionKind: cognitiveUpdate.contradiction.kind,
        };
      }).then(async (analysis) => {
        if (!analysis || !sessionEpoch.isCurrent(epoch)) return;
        const reply = await oracle.speak(
          fenAfterBot,
          pgnAfterBot,
          san,
          botSan,
          analysis.legacyClass,
          analysis.forceState.forces,
          analysis.stage,
          analysis.bodyType,
        );
        if (!sessionEpoch.isCurrent(epoch)) return;
        setMsgs((prev) => [
          ...prev,
          {
            role: 'user',
            content: `I played ${san} (${analysis.legacyClass.classification})${analysis.contradictionKind !== 'expected' ? ` [${analysis.contradictionKind}]` : ''}`,
          },
          { role: 'assistant', content: reply },
        ]);
      }).catch((err: unknown) => {
        if (sessionEpoch.isCurrent(epoch)) {
          setError((err as Error).message || 'Optional analysis failed');
        }
      });
    } catch (err) {
      setError((err as Error).message || 'Request failed');
    } finally {
      setLoading(false);
      setBotThinking(false);
    }
  }, [difficulty, playerColor, simulator, bodyType, oracle, ensureEngine, runEngine, sessionEpoch]);

  const commitPlayerMove = useCallback((sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
    if (loading || botThinking || simulator.isGameOver) return false;
    if (simulator.turn !== playerColor) return false;

    const promotion = piece[1].toLowerCase() === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1')
      ? 'q' as const : undefined;

    const fenBefore = simulator.fen;
    const move = simulator.playMove(sourceSquare, targetSquare, promotion);
    if (!move) return false;

    setSelectedSquare(null);
    setSelectedPiece(null);
    setPosition(simulator.fen);
    activeFenRef.current = simulator.fen;
    void handleTurnAsync(move.san, sourceSquare + targetSquare + (promotion || ''), fenBefore);
    return true;
  }, [loading, botThinking, simulator, playerColor, handleTurnAsync]);

  const onDrop = useCallback((sourceSquare: Square, targetSquare: Square, piece: string): boolean => {
    return commitPlayerMove(sourceSquare, targetSquare, piece);
  }, [commitPlayerMove]);

  const onSquareClick = useCallback((square: Square, piece?: string) => {
    if (loading || botThinking || simulator.isGameOver || simulator.turn !== playerColor) return;
    if (!selectedSquare) {
      if (piece && piece[0].toLowerCase() === playerColor) {
        setSelectedSquare(square);
        setSelectedPiece(piece);
      }
      return;
    }
    if (square === selectedSquare) {
      setSelectedSquare(null);
      setSelectedPiece(null);
      return;
    }
    if (selectedPiece && !commitPlayerMove(selectedSquare, square, selectedPiece) && piece && piece[0].toLowerCase() === playerColor) {
      setSelectedSquare(square);
      setSelectedPiece(piece);
    }
  }, [loading, botThinking, simulator, playerColor, selectedSquare, selectedPiece, commitPlayerMove]);

  if (phase === 'init') {
    return <InitScreen onStart={startGame} error={error} loading={loading} />;
  }

  if (phase === 'resume') {
    return (
      <ResumeScreen
        name={name} moveCount={simulator.moveCount} difficulty={difficulty}
        onResume={handleResume} onReset={handleReset}
      />
    );
  }

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'monospace', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        background: '#0f0f1a', borderBottom: '1px solid #1e1e3a',
        padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <span style={{ color: '#a78bfa', fontSize: '0.7rem', letterSpacing: '0.15em' }}>GRIMCHESS</span>
        <span style={{ color: '#334155', fontSize: '0.7rem' }}>|</span>
        <span style={{ color: '#64748b', fontSize: '0.65rem' }}>PLAYING AGAINST THE ORACLE</span>
        <button onClick={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))} aria-label="Flip board"
          style={{ background: 'none', border: '1px solid #334155', color: '#64748b', borderRadius: 3, padding: '0.15rem 0.5rem', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'monospace', outline: 'none' }}>
          FLIP
        </button>
        <button onClick={handleReset} aria-label="End game and purge"
          style={{ background: 'none', border: '1px solid #7f1d1d', color: '#7f1d1d', borderRadius: 3, padding: '0.15rem 0.5rem', fontSize: '0.6rem', cursor: 'pointer', fontFamily: 'monospace', outline: 'none' }}
          onFocus={(e) => { e.target.style.background = '#2a0a0a'; }}
          onBlur={(e) => { e.target.style.background = 'none'; }}>
          END
        </button>
      </div>

      {error && (
        <div style={{ background: '#2a0a0a', borderBottom: '1px solid #7f1d1d', padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#fca5a5' }}>
          <strong>ERROR:</strong> {error}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '100%', maxWidth: 560, aspectRatio: '1', position: 'relative' }}>
              <Chessboard
                position={position}
                onPieceDrop={onDrop}
                onSquareClick={onSquareClick}
                customSquareStyles={selectedSquare ? { [selectedSquare]: { backgroundColor: '#6d28d9' } } : undefined}
                boardOrientation={orientation === 'w' ? 'white' : 'black'}
                customBoardStyle={{ borderRadius: 4, boxShadow: '0 0 20px rgba(124,58,237,0.15)' }}
                customDarkSquareStyle={{ backgroundColor: '#1e1e3a' }}
                customLightSquareStyle={{ backgroundColor: '#2e2e4a' }}
                animationDuration={300}
              />
              {botThinking && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(10,10,15,0.7)', borderRadius: 4,
                  fontSize: '0.8rem', color: '#a78bfa', letterSpacing: '0.15em',
                }}>BOT THINKING...</div>
              )}
            </div>

            {lastClass && (
              <div style={{ width: '100%', maxWidth: 560, display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ color: '#64748b' }}>LAST MOVE:</span>
                <span style={{
                  color: { brilliant: '#fbbf24', best: '#34d399', good: '#60a5fa', inaccuracy: '#94a3b8', mistake: '#f59e0b', blunder: '#f87171' }[lastClass.classification] || '#94a3b8',
                  fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>{lastClass.classification}</span>
                <span style={{ color: '#475569' }}>Δ {lastClass.delta > 0 ? '+' : ''}{Math.round(lastClass.delta * 10000) / 10000}</span>
                <span style={{ color: '#475569', marginLeft: 'auto' }}>best was {lastClass.bestMove}</span>
              </div>
            )}

            <div style={{ width: '100%', maxWidth: 560, background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 4, padding: '0.75rem', maxHeight: 160, overflowY: 'auto' }}>
              <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.15em', marginBottom: '0.5rem' }}>MOVE HISTORY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.75rem' }}>
                {simulator.history.map((m, i) => (
                  <span key={i} style={{ color: m.color === 'w' ? '#e2e8f0' : '#94a3b8' }}>
                    {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}{m.san}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
