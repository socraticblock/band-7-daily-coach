export type WritingResponseQualityResult =
  | { ok: true }
  | { ok: false; message: string };

const PLACEHOLDER_PATTERN = /\b(?:test|testing|placeholder|dummy|asdf|lorem|ipsum)\b/i;

export function validateWritingResponseQuality(text: string): WritingResponseQualityResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      ok: false,
      message: "Write your response before asking for feedback.",
    };
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const words = trimmed.match(/[A-Za-z]+(?:['’-][A-Za-z]+)?/g) ?? [];
  const normalizedWords = words.map((word) => word.toLowerCase());
  const uniqueWords = new Set(normalizedWords);
  const meaningfulWords = normalizedWords.filter((word) => word.length >= 3);

  const singleCharacterTokens = tokens.filter((token) => /^[A-Za-z]$/.test(token)).length;
  const repeatedSingleCharacterRatio = tokens.length === 0 ? 0 : singleCharacterTokens / tokens.length;
  const uniqueWordRatio = words.length === 0 ? 0 : uniqueWords.size / words.length;
  const repeatedCharacterRun = /(.)\1{8,}/.test(trimmed.replace(/\s+/g, ""));

  const looksLikeLongPlaceholder =
    tokens.length >= 30 &&
    (
      repeatedSingleCharacterRatio > 0.25 ||
      repeatedCharacterRun ||
      uniqueWords.size < 10 ||
      uniqueWordRatio < 0.08 ||
      meaningfulWords.length < Math.max(12, tokens.length * 0.25)
    );

  if (looksLikeLongPlaceholder) {
    return {
      ok: false,
      message:
        "This does not look like a real IELTS writing response yet. Please submit full English sentences, not repeated letters or placeholder text. Your writing was not sent for feedback.",
    };
  }

  if (tokens.length >= 20 && PLACEHOLDER_PATTERN.test(trimmed) && uniqueWords.size < 20) {
    return {
      ok: false,
      message:
        "This looks like placeholder text. Please write a real response before asking for IELTS feedback.",
    };
  }

  return { ok: true };
}
