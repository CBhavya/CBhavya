/**
 * In-memory LRU cache for storyboard plans
 * Caches by prompt + options to avoid redundant AI calls
 */

const MAX_ENTRIES = 100;

interface CacheEntry {
  data: unknown;
  createdAt: number;
}

const cache = new Map<string, CacheEntry>();
const accessOrder: string[] = [];

function hashKey(input: string): string {
  let h = 0;
  const s = input;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}

function makeCacheKey(prompt: string, improve: boolean, skipImages: boolean, provider: string): string {
  const normalized = prompt.trim().toLowerCase();
  const payload = JSON.stringify({ p: normalized, i: improve, s: skipImages, pr: provider });
  return hashKey(payload);
}

function evictIfNeeded(): void {
  while (accessOrder.length > MAX_ENTRIES && accessOrder.length > 0) {
    const oldest = accessOrder.shift();
    if (oldest) cache.delete(oldest);
  }
}

export function get(
  prompt: string,
  improve: boolean,
  skipImages: boolean,
  provider: string
): unknown | null {
  const key = makeCacheKey(prompt, improve, skipImages, provider);
  const entry = cache.get(key);
  if (!entry) return null;

  // Move to end (most recently used)
  const idx = accessOrder.indexOf(key);
  if (idx >= 0) {
    accessOrder.splice(idx, 1);
  }
  accessOrder.push(key);

  return entry.data;
}

export function set(
  prompt: string,
  improve: boolean,
  skipImages: boolean,
  provider: string,
  data: unknown
): void {
  evictIfNeeded();
  const key = makeCacheKey(prompt, improve, skipImages, provider);
  cache.set(key, { data, createdAt: Date.now() });
  const idx = accessOrder.indexOf(key);
  if (idx >= 0) accessOrder.splice(idx, 1);
  accessOrder.push(key);
}

export function size(): number {
  return cache.size;
}
