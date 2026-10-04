export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

export function fixedClock(instant: Date | string): Clock {
  const date = new Date(instant);
  return { now: () => new Date(date) };
}
