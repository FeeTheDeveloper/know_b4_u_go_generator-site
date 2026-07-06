function getCrypto(): Crypto {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (!g.crypto || typeof g.crypto.getRandomValues !== "function") {
    throw new Error(
      "Web Crypto API not available in this environment — refusing to fall back to Math.random for regulated selection.",
    );
  }
  return g.crypto;
}

export function newSeedHex(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  getCrypto().getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

function u32FromHex(hex: string, offset: number): number {
  const start = (offset * 8) % Math.max(hex.length, 1);
  const slice =
    start + 8 <= hex.length
      ? hex.slice(start, start + 8)
      : (hex + hex).slice(start, start + 8);
  const parsed = parseInt(slice || "0", 16);
  return Number.isFinite(parsed) ? parsed >>> 0 : 0;
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

function xoshiro128ss(a: number, b: number, c: number, d: number): () => number {
  let s0 = a >>> 0;
  let s1 = b >>> 0;
  let s2 = c >>> 0;
  let s3 = d >>> 0;
  if ((s0 | s1 | s2 | s3) === 0) s1 = 1;
  return () => {
    const result = (rotl(Math.imul(s1, 5), 7) * 9) >>> 0;
    const t = (s1 << 9) >>> 0;
    s2 = (s2 ^ s0) >>> 0;
    s3 = (s3 ^ s1) >>> 0;
    s1 = (s1 ^ s2) >>> 0;
    s0 = (s0 ^ s3) >>> 0;
    s2 = (s2 ^ t) >>> 0;
    s3 = rotl(s3, 11);
    return result / 4294967296;
  };
}

export function seededPrng(seedHex: string): () => number {
  const s0 = u32FromHex(seedHex, 0);
  const s1 = u32FromHex(seedHex, 1);
  const s2 = u32FromHex(seedHex, 2);
  const s3 = u32FromHex(seedHex, 3);
  const rand = xoshiro128ss(s0, s1, s2, s3);
  for (let i = 0; i < 16; i++) rand();
  return rand;
}

export function fisherYates<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
