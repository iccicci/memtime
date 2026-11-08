import session from "cookie-session";
import type { Response } from "express";
import express from "express";
import { createServer } from "http";
import morgan from "morgan";
import { join } from "path";

import { api } from "./api";
import { port, sessionSecret } from "./config";
import { gh } from "./gh";
import { log, nowString, rfs } from "./log";

const app = express();
const dist = join(process.cwd(), "dist");

const server = createServer(app);

log("Init");

const sessionMiddleware = session({ keys: [sessionSecret], name: "session" });

app.use(sessionMiddleware);

app.use(
  morgan((tokens, req, res) => [nowString(), tokens.method(req, res), tokens.url(req, res), tokens["remote-addr"](req, res), "begin"].join(" "), {
    immediate: true,
    stream:    rfs
  })
);
app.use(
  morgan(
    (tokens, req, res) =>
      [
        nowString(),
        tokens.method(req, res),
        tokens.url(req, res),
        tokens["remote-addr"](req, res),
        "end",
        tokens.status(req, res),
        `${tokens.res(req, res, "content-length") || 0}b`,
        `${tokens["response-time"](req, res)}ms`
      ].join(" "),
    { stream: rfs }
  )
);

app.use((_, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
  next();
});

app.use("/gh", gh);
app.use("/api/v1", api);

app.use(express.static(dist));

const found = (res: Response) => res.sendFile(join(dist, "index.html"));

const notFound = (res: Response) => {
  res.statusMessage = "Not found";
  res.status(404);
  found(res);
};

app.get("/*unused", (_, res) => notFound(res));

log("Opening HTTP server...");
server.listen(port, () => log("Server started"));

let shuttingDown = false;
const shutDown = () => {
  if(shuttingDown) return;

  shuttingDown = true;

  log("Shutdown request received");

  server.close(error => {
    if(error) log("Error while closing HTTP server", error);

    log("HTTP server closed");

    rfs.end(() => process.exit(0));
  });
};

process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
