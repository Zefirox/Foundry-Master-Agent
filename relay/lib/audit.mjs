import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const LOG_PATH = process.env.PI_BRIDGE_AUDIT_LOG || "/root/pi-foundry/relay/audit.jsonl";

let initialized = false;

async function ensureDir() {
  if (!initialized) {
    await mkdir(dirname(LOG_PATH), { recursive: true });
    initialized = true;
  }
}

/**
 * Appends a JSONL audit entry. Never throws — logging is best-effort.
 * @param {object} entry
 */
export async function audit(entry) {
  try {
    await ensureDir();
    const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n";
    await appendFile(LOG_PATH, line, { flag: "a" });
  } catch {
    // best-effort; don't crash the relay on log failure
  }
}
