export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

export function ageInSeconds(timestamp: number, referenceTime = nowUnix()): number {
  return Math.max(0, referenceTime - timestamp);
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}
