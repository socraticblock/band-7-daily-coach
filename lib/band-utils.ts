import { BAND_NUMERIC, BAND_ORDER, type BandDifficulty } from "./types";

const BAND_SET = new Set<BandDifficulty>(BAND_ORDER);

const NUMERIC_TO_BAND: Record<string, BandDifficulty> = {
  "5.5": "band5_5",
  "6.0": "band6_0",
  "6.5": "band6_5",
  "7.0": "band7_0",
  "7.5": "band7_5",
  "8.0": "band8_0",
};

export function normalizeBandDifficulty(value: unknown): BandDifficulty | null {
  if (typeof value !== "string") return null;

  const stripped = value
    .trim()
    .replace(/^["'<\s]+|[>"'\s]+$/g, "");

  if (BAND_SET.has(stripped as BandDifficulty)) {
    return stripped as BandDifficulty;
  }

  const compact = stripped.toLowerCase().replace(/\s+/g, "");
  const compactBand = compact.replace(
    /^band([5-8])(?:[._])?([05])?$/,
    (_match, whole: string, decimal: string | undefined) => `band${whole}_${decimal ?? "0"}`,
  );

  if (BAND_SET.has(compactBand as BandDifficulty)) {
    return compactBand as BandDifficulty;
  }

  const numericMatch = stripped.match(/(?:band\s*)?([5-8](?:[._][05])?)/i);
  if (!numericMatch) return null;

  const rawNumeric = numericMatch[1]?.replace("_", ".");
  if (!rawNumeric) return null;

  const numeric = rawNumeric.includes(".") ? rawNumeric : `${rawNumeric}.0`;
  return NUMERIC_TO_BAND[numeric] ?? null;
}

export function normalizeBandRange(value: unknown): [BandDifficulty, BandDifficulty] | null {
  if (!Array.isArray(value) || value.length < 2) return null;

  const low = normalizeBandDifficulty(value[0]);
  const high = normalizeBandDifficulty(value[1]);
  if (!low || !high) return null;

  const ordered = [low, high].sort(
    (a, b) => BAND_ORDER.indexOf(a) - BAND_ORDER.indexOf(b),
  ) as [BandDifficulty, BandDifficulty];

  return ordered;
}

export function bandRangeAverage(value: unknown): number | null {
  const range = normalizeBandRange(value);
  if (!range) return null;

  const [low, high] = range;
  return (BAND_NUMERIC[low] + BAND_NUMERIC[high]) / 2;
}

export function formatBandRange(value: unknown): string {
  const range = normalizeBandRange(value);
  if (!range) return "Band estimate unavailable";

  const [low, high] = range;
  return `Band ${BAND_NUMERIC[low].toFixed(1)} – ${BAND_NUMERIC[high].toFixed(1)}`;
}
