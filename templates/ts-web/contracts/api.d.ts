export interface paths {
    "/api/v1/context": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["getContext"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/normalize": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["normalizeText"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    getContext: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            userId: string;
                            toolId: string;
                            displayName: string;
                            toolName: string;
                            description: string;
                            environment: "development" | "production";
                            portalUrl: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    normalizeText: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    text: string;
                    options: {
                        trimLines: boolean;
                        collapseSpaces: boolean;
                        removeEmptyLines: boolean;
                    };
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        data: {
                            text: string;
                            inputCharacters: number;
                            outputCharacters: number;
                            inputLines: number;
                            outputLines: number;
                            removedEmptyLines: number;
                        };
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
}
