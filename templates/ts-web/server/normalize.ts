import type { NormalizeBody, NormalizeResult } from "./schema.js";

/** Only whitespace changes; characters and line order are preserved. No storage or outbound calls. */
export function normalizeText({ text, options }: NormalizeBody): NormalizeResult {
  const inputLines = text.replace(/\r\n?/g, "\n").split("\n");
  let lines = inputLines.map((line) => {
    let output = options.collapseSpaces ? line.replace(/[^\S\r\n]+/gu, " ") : line;
    if (options.trimLines) output = output.trim();
    return output;
  });
  const removedEmptyLines = options.removeEmptyLines ? lines.filter((line) => !line.trim()).length : 0;
  if (options.removeEmptyLines) lines = lines.filter((line) => line.trim().length > 0);
  const output = lines.join("\n");
  return {
    text: output,
    inputCharacters: [...text].length,
    outputCharacters: [...output].length,
    inputLines: text.length ? inputLines.length : 0,
    outputLines: output.length ? lines.length : 0,
    removedEmptyLines,
  };
}
