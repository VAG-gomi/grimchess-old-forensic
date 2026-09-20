import type { MoveClassification } from '../types';

let stockfish: Worker | null = null;
let messageId = 0;
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();

function getWorker(): Worker {
  if (stockfish) return stockfish;
  const path = import.meta.env.VITE_STOCKFISH_PATH || '/stockfish/stockfish-nnue-16.js';
  stockfish = new Worker(path, { type: 'module' });
  stockfish.onmessage = (e) => {
    const data = e.data;
    if (typeof data === 'string') {
      const idMatch = data.match(/\[id:(\d+)\]/);
      if (idMatch) {
        const id = parseInt(idMatch[1], 10);
        const handler = pending.get(id);
        if (handler) {
          pending.delete(id);
          handler.resolve(data.replace(/\[id:\d+\]/, '').trim());
        }
      }
    } else if (data && typeof data === 'object') {
      const handler = pending.get(data.id);
      if (handler) {
        pending.delete(data.id);
        if (data.error) handler.reject(new Error(data.error));
        else handler.resolve(data.result);
      }
    }
  };
  stockfish.onerror = (err) => {
    console.error('Stockfish worker error:', err);
  };
  return stockfish;
}

function sendCommand(cmd: string, timeout = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = ++messageId;
    pending.set(id, { resolve, reject });
    const worker = getWorker();
    worker.postMessage({ cmd: `${cmd} [id:${id}]`, id });
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        reject(new Error('Stockfish command timeout'));
      }
    }, timeout);
  });
}

let initialized = false;
export async function initEngine(): Promise<void> {
  if (initialized) return;
  await sendCommand('uci');
  await sendCommand('setoption name Use NNUE value true');
  await sendCommand('isready');
  initialized = true;
}

export async function analyzePosition(fen: string, depth: number, multiPV = 1): Promise<{
  bestMove: string;
  evalCp: number;
  evalMate: number | null;
  pv: string[];
}> {
  await initEngine();
  await sendCommand(`setoption name MultiPV value ${multiPV}`);
  await sendCommand(`position fen ${fen}`);
  const result = await sendCommand(`go depth ${depth}`, 45000);

  const bestMatch = result.match(/bestmove\s+(\S+)/);
  const bestMove = bestMatch ? bestMatch[1] : '';

  const scoreMatch = result.match(/score\s+(cp|mate)\s+(-?\d+)/);
  let evalCp = 0;
  let evalMate: number | null = null;
  if (scoreMatch) {
    if (scoreMatch[1] === 'cp') evalCp = parseInt(scoreMatch[2], 10);
    else evalMate = parseInt(scoreMatch[2], 10);
  }

  const pvMatch = result.match(/pv\s+([a-h][1-8][a-h][1-8][qrbn]?\S*(?:\s+[a-h][1-8][a-h][1-8][qrbn]?\S*)*)/);
  const pv = pvMatch ? pvMatch[1].trim().split(/\s+/) : [];

  return { bestMove, evalCp, evalMate, pv };
}

export async function getEngineMove(
  fen: string,
  depth: number,
  noise: number,
  topN = 3
): Promise<{ move: string; wasBest: boolean; evalCp: number }> {
  await initEngine();
  await sendCommand(`setoption name MultiPV value ${topN}`);
  await sendCommand(`position fen ${fen}`);
  const result = await sendCommand(`go depth ${depth}`, 45000);

  const lines = result.split('\n');
  const moves: { move: string; evalCp: number }[] = [];
  for (const line of lines) {
    const pvMatch = line.match(/pv\s+([a-h][1-8][a-h][1-8][qrbn]?)/);
    const scoreMatch = line.match(/score\s+cp\s+(-?\d+)/);
    if (pvMatch && scoreMatch) {
      moves.push({ move: pvMatch[1], evalCp: parseInt(scoreMatch[1], 10) });
    }
  }

  if (!moves.length) {
    const bestMatch = result.match(/bestmove\s+(\S+)/);
    return { move: bestMatch ? bestMatch[1] : '', wasBest: true, evalCp: 0 };
  }

  const best = moves[0];
  if (noise > 0 && moves.length > 1 && Math.random() < noise) {
    const sub = moves.slice(1);
    const pick = sub[Math.floor(Math.random() * sub.length)];
    return { move: pick.move, wasBest: false, evalCp: pick.evalCp };
  }

  return { move: best.move, wasBest: true, evalCp: best.evalCp };
}

export function classifyMove(
  evalBeforeCp: number,
  evalAfterCp: number,
  isBest: boolean,
  playerIsBlack: boolean
): MoveClassification['classification'] {
  const pb = playerIsBlack ? -evalBeforeCp : evalBeforeCp;
  const pa = playerIsBlack ? -evalAfterCp : evalAfterCp;
  const delta = (pa - pb) / 100;

  if (isBest && delta > 1.5) return 'brilliant';
  if (isBest) return 'best';
  if (delta > -0.3) return 'good';
  if (delta > -0.9) return 'inaccuracy';
  if (delta > -2.0) return 'mistake';
  return 'blunder';
}

export function terminateEngine(): void {
  if (stockfish) {
    stockfish.terminate();
    stockfish = null;
    initialized = false;
  }
}
