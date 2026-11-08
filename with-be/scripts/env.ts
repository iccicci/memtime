import { readFileSync, writeFileSync } from "fs";

const readEnv = (): { [key: string]: string } => {
  try {
    return Object.fromEntries(
      readFileSync(".env", "utf8")
        .split("\n")
        .filter(_ => _ !== "")
        .map(_ => _.split("=") as [string, string])
    );
  } catch(error) {
    return {};
  }
};

const node_js = readFileSync(".nvmrc", "utf8").replace(/[v\s]/g, "");
const { API_BASE_URL, API_KEY, GITHUB_SECRET, PORT, RATE_LIMIT, RATE_WINDOW, SESSION, STAGE } = process.env;
const port = parseInt(PORT || "23000");

const env = {
  ...readEnv(),
  API_BASE_URL:   API_BASE_URL || "https://interview-api.memtime-demo.deno.net",
  API_KEY:        API_KEY || "your_api_key",
  GITHUB_SECRET:  GITHUB_SECRET || "dummy",
  NODEJS_VERSION: node_js,
  PORT:           PORT || port.toString(),
  RATE_LIMIT:     RATE_LIMIT || "15",
  RATE_WINDOW:    RATE_WINDOW || "60",
  SESSION:        SESSION || "session",
  STAGE:          STAGE || "dev"
};

writeFileSync(
  ".env",
  `${Object.entries(env)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")}\n`
);
