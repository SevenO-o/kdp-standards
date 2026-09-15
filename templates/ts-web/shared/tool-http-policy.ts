/** Shared by the platform and template; file limits apply to each direction. Zero disables only the file byte cap. */
export const toolHttp = Object.freeze({ version: '2', jsonMaxBytes: 8 * 1024 * 1024, fileMaxBytes: 256 * 1024 * 1024, timeoutMs: 15_000, fileTimeoutMs: 300_000, maxConcurrentFiles: 4 });
export type ToolHttpPolicy = { version: string; jsonMaxBytes: number; fileMaxBytes: number; timeoutMs: number; fileTimeoutMs: number; maxConcurrentFiles: number };
export function toolHttpPolicy(env: Record<string, string | undefined>): ToolHttpPolicy {
  const integer = (key: string, fallback: number, min: number, max = Number.MAX_SAFE_INTEGER) => {
    const value = env[key]; if (value === undefined) return fallback;
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) throw new Error(`Invalid ${key}`);
    return Number(value);
  };
  return { ...toolHttp, fileMaxBytes: integer('KDP_TOOL_FILE_MAX_BYTES', toolHttp.fileMaxBytes, 0), fileTimeoutMs: integer('KDP_TOOL_FILE_TIMEOUT_MS', toolHttp.fileTimeoutMs, 1, 2_147_483_647), maxConcurrentFiles: integer('KDP_TOOL_FILE_CONCURRENCY', toolHttp.maxConcurrentFiles, 1, 1024) };
}
