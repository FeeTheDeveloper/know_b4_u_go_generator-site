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
  const start = (offset * 8) % hex.length;
  const slice =
    start + 8 <= hex.length
      ? hex.slice(start, start + 8)
      : (hex.slice(start) + hex.slice(0, 8 - (hex.length - start))).slice(0, 8);
  return parseInt(slice, 16) >>> 0;
}

function mulberry32(seedU32: number): () => number {
  let a = seedU32 >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededPrng(seedHex: string): () => number {
  const s0 = u32FromHex(seedHex, 0);
  const s1 = u32FromHex(seedHex, 1);
  const s2 = u32FromHex(seedHex, 2);
  const s3 = u32FromHex(seedHex, 3);
  const combined = (s0 ^ s1 ^ s2 ^ s3) >>> 0;
  return mulberry32(combined);
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
