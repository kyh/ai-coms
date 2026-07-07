import { createGateway } from "ai";

/** Single place for model wiring — agents import from here. */
export const MODEL_ID = "openai/gpt-5.1-instant";

export const createModel = (apiKey: string) => createGateway({ apiKey })(MODEL_ID);
