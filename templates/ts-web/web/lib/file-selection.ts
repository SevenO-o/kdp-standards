export interface FileSelectionLimits {maxBytes: number; maxFiles?: number; extensions: readonly string[]}
export function validateFileSelection(files: readonly {name:string;size:number}[], limits: FileSelectionLimits): string | null {
  if (!Number.isSafeInteger(limits.maxBytes) || limits.maxBytes < 1 || !Number.isSafeInteger(limits.maxFiles ?? 1) || (limits.maxFiles ?? 1) < 1 || !limits.extensions.length || limits.extensions.some(x=>!/^\.[a-z0-9]+$/i.test(x))) throw new Error("Invalid file selection limits");
  if (!files.length) return null;
  if (files.length > (limits.maxFiles ?? 1)) return `一次最多选择 ${limits.maxFiles ?? 1} 个文件。`;
  for (const file of files) {
    if (!limits.extensions.some(ext => file.name.toLowerCase().endsWith(ext.toLowerCase()))) return `“${file.name}”格式不支持，请选择 ${limits.extensions.join("、")} 文件。`;
    if (file.size === 0) return `“${file.name}”为空，请选择有内容的文件。`;
    if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > limits.maxBytes) return `“${file.name}”超过大小限制（${limits.maxBytes.toLocaleString()} 字节）。`;
  }
  return null;
}
