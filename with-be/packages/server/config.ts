import type { Stage } from "memtime-shared";
import { stages } from "memtime-shared";

const { API_BASE_URL, API_KEY, GITHUB_SECRET, PORT, RATE_LIMIT, RATE_WINDOW, SESSION, STAGE } = process.env;

if(! API_BASE_URL) throw new Error("Missing API_BASE_URL environment variable");
if(! API_KEY) throw new Error("Missing API_KEY environment variable");
if(! GITHUB_SECRET) throw new Error("Missing GITHUB_SECRET environment variable");
if(! PORT) throw new Error("Missing PORT environment variable");
if(! RATE_LIMIT) throw new Error("Missing RATE_LIMIT environment variable");
if(! RATE_WINDOW) throw new Error("Missing RATE_WINDOW environment variable");
if(! SESSION) throw new Error("Missing SESSION environment variable");
if(! STAGE) throw new Error("Missing STAGE environment variable");

if(! stages.includes(STAGE as Stage)) throw new Error(`Not valid STAGE value "${STAGE}"`);

export const apiBaseUrl = API_BASE_URL.replace(/\/$/, "");
export const apiKey = API_KEY;
export const githubSecret = GITHUB_SECRET;
export const port = parseInt(PORT);
export const rateLimit = parseInt(RATE_LIMIT);
export const rateWindow = parseInt(RATE_WINDOW);
export const sessionSecret = SESSION;
export const stage = STAGE as Stage;

if(! Number.isFinite(rateLimit) || rateLimit < 1) throw new Error(`Not valid RATE_LIMIT value "${RATE_LIMIT}"`);
if(! Number.isFinite(rateWindow) || rateWindow < 1) throw new Error(`Not valid RATE_WINDOW value "${RATE_WINDOW}"`);

export const isDev = stage === "dev";
export const isProd = stage === "prod";
export const isTest = stage === "test";
export const isNotProd = ! isProd;
