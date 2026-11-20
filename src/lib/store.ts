/**
 * Scenario persistence. Browser storage for now; a Supabase loader can replace these two
 * functions without touching the screens. Every access is wrapped because storage can be
 * unavailable (private windows, blocked site data).
 *
 * Each value is stored inside an envelope that carries a schema version. When the shape of a
 * saved type changes, the caller raises its version and an older entry is ignored instead of
 * being read into a shape it no longer fits. A value saved before the envelope existed is read
 * as version 1.
 */
type Envelope<T> = { v: number; data: T };

const PREFIX = "revenue-healthcheck:";

function isEnvelope<T>(x: unknown): x is Envelope<T> {
  return typeof x === "object" && x !== null && !Array.isArray(x) && "v" in x && "data" in x && typeof (x as Envelope<T>).v === "number";
}

export function load<T>(key: string, fallback: T, version = 1): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (isEnvelope<T>(parsed)) return parsed.v === version ? parsed.data : fallback;
    return version === 1 ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T, version = 1): void {
  try {
    const envelope: Envelope<T> = { v: version, data: value };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // The app works without storage.
  }
}
