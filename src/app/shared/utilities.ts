// Utility functions for Greed

export function formatScore(value: number): string {
  return value.toLocaleString();
}

export function formatDuration(startMs: number, endMs?: number): string {
  const end = endMs ?? Date.now();
  const seconds = Math.floor((end - startMs) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m`;
}

export function calculateRoundNumber(turnNumber: number, playerCount: number): number {
  return Math.floor((turnNumber - 1) / playerCount) + 1;
}
