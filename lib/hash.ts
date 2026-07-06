function getCrypto(): Crypto {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (!g.crypto || !g.crypto.subtle) {
    throw new Error("Web Crypto Subtle API unavailable for pool hashing.");
  }
  return g.crypto;
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await getCrypto().subtle.digest("SHA-256", enc);
  return bytesToHex(digest);
}

export async function hashPool<T extends { driverId: string; cdlNumber: string }>(
  drivers: readonly T[],
): Promise<string> {
  const canonical = drivers
    .map((d) => `${d.driverId}|${d.cdlNumber}`)
    .slice()
    .sort()
    .join("\n");
  return sha256Hex(canonical);
}
