import { clamp } from "../utils/time.ts";

export function calculateDecay(ageSeconds: number, decayWindowSeconds: number): number {
  if (decayWindowSeconds <= 0) {
    return 0;
  }

  return clamp(ageSeconds / decayWindowSeconds);
}
