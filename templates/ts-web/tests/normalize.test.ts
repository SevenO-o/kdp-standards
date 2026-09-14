import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeText } from "../server/normalize.js";

const all = { trimLines: true, collapseSpaces: true, removeEmptyLines: true };
test("cleans copied multilingual text while preserving words and order", () => {
  const result = normalizeText({ text: "  你好\t\tworld  \r\n\r\n第二行\u3000  内容\r结束  ", options: all });
  assert.equal(result.text, "你好 world\n第二行 内容\n结束");
  assert.equal(result.removedEmptyLines, 1);
  assert.equal(result.inputLines, 4);
  assert.equal(result.outputLines, 3);
});
test("independent rules preserve indentation and blank lines when disabled", () => {
  const input = "  a   b\n\n\tc ";
  assert.equal(normalizeText({ text: input, options: { trimLines: false, collapseSpaces: false, removeEmptyLines: false } }).text, input);
  assert.equal(normalizeText({ text: input, options: { trimLines: false, collapseSpaces: false, removeEmptyLines: true } }).text, "  a   b\n\tc ");
});
test("character counts use Unicode code points and whitespace-only lines are removed", () => {
  const result = normalizeText({ text: "😀\n\t\n文", options: all });
  assert.equal(result.text, "😀\n文");
  assert.equal(result.inputCharacters, 5);
  assert.equal(result.outputCharacters, 3);
  assert.equal(result.removedEmptyLines, 1);
});
