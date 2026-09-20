export interface PendingPrediction {
  id: string;
  fen: string;
}

export class SessionEpochGate {
  private epoch = 0;

  begin(): number {
    this.epoch += 1;
    return this.epoch;
  }

  invalidate(): number {
    return this.begin();
  }

  isCurrent(epoch: number): boolean {
    return epoch === this.epoch;
  }
}

export class AsyncTaskQueue {
  private tail: Promise<void> = Promise.resolve();

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    const queued = this.tail.then(task, task);
    this.tail = queued.then(() => undefined, () => undefined);
    return queued;
  }

  reset(): void {
    this.tail = Promise.resolve();
  }
}

export function predictionMatchesFen(
  prediction: PendingPrediction | null | undefined,
  fen: string,
): prediction is PendingPrediction {
  return prediction?.fen === fen;
}