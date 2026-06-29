// 6-char league join codes. Uppercase letters + digits, excluding ambiguous
// characters (O/0, I/1, L) so codes are easy to read aloud and type.
// ~31^6 ≈ 887M combinations.

export const JOINCODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const JOINCODE_LENGTH = 6;

// Pure generator: takes a random-int source so it's deterministic in tests.
// `rand(n)` must return an integer in [0, n).
export function makeJoinCode(rand: (n: number) => number): string {
  let out = "";
  for (let i = 0; i < JOINCODE_LENGTH; i++) {
    out += JOINCODE_ALPHABET[rand(JOINCODE_ALPHABET.length)];
  }
  return out;
}

export function isValidJoinCode(code: string): boolean {
  if (code.length !== JOINCODE_LENGTH) return false;
  for (const ch of code) {
    if (!JOINCODE_ALPHABET.includes(ch)) return false;
  }
  return true;
}

// Crypto-backed generator for runtime use.
export function genJoinCode(): string {
  const bytes = new Uint8Array(JOINCODE_LENGTH);
  globalThis.crypto.getRandomValues(bytes);
  let i = 0;
  return makeJoinCode(() => bytes[i++] % JOINCODE_ALPHABET.length);
}

// Normalize user input (uppercase, strip spaces) before lookup.
export function normalizeJoinCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
