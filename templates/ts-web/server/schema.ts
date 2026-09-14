import { Type, type Static } from "@sinclair/typebox";

export const errorSchema = Type.Object({
  error: Type.Object({
    code: Type.String(), message: Type.String(), requestId: Type.String(),
  }, { additionalProperties: false }),
}, { additionalProperties: false });

export const normalizeBody = Type.Object({
  text: Type.String({ minLength: 1, maxLength: 100_000 }),
  options: Type.Object({
    trimLines: Type.Boolean(),
    collapseSpaces: Type.Boolean(),
    removeEmptyLines: Type.Boolean(),
  }, { additionalProperties: false }),
}, { additionalProperties: false });

export const normalizeResponse = Type.Object({
  data: Type.Object({
    text: Type.String(),
    inputCharacters: Type.Integer({ minimum: 0 }),
    outputCharacters: Type.Integer({ minimum: 0 }),
    inputLines: Type.Integer({ minimum: 0 }),
    outputLines: Type.Integer({ minimum: 0 }),
    removedEmptyLines: Type.Integer({ minimum: 0 }),
  }, { additionalProperties: false }),
}, { additionalProperties: false });

export const contextResponse = Type.Object({
  data: Type.Object({
    userId: Type.String(), toolId: Type.String(), displayName: Type.String(),
    toolName: Type.String(), description: Type.String(),
    environment: Type.Union([Type.Literal("development"), Type.Literal("production")]),
    portalUrl: Type.String(),
  }, { additionalProperties: false }),
}, { additionalProperties: false });

export type NormalizeBody = Static<typeof normalizeBody>;
export type NormalizeResult = Static<typeof normalizeResponse>["data"];
