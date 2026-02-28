import { z } from "zod";

export const uuidSchema = z.uuid();
export const isoCurrencySchema = z.string().length(3).toUpperCase();

export function parseNumber(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
