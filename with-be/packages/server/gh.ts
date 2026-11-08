import { exec } from "child_process";
import { createHmac, timingSafeEqual } from "crypto";
import express from "express";

import { githubSecret, stage } from "./config";
import { log } from "./log";

declare global {
  namespace Express {
    interface Request {
      rawBody: string;
    }
  }
}

interface Commit {
  added: string[];
  committer: { username: string };
  message: string;
  modified: string[];
  removed: string[];
}

interface WebHook {
  after: string;
  commits: Commit[];
  compare: string;
  head_commit: Commit;
  ref: string;
  repository: { name: string };
}

export const gh = express.Router();

gh.use((req, _, next) => {
  const chunks: Buffer[] = [];

  req.on("data", (chunk: Buffer) => chunks.push(chunk));

  req.on("end", () => {
    req.rawBody = Buffer.concat(chunks).toString("utf8");
    next();
  });
});

gh.all("/wh", (req, res) => {
  const { headers, rawBody } = req;
  const sigHashAlg = "sha256";

  try {
    // Misc check against the HTTP call
    const { ref } = JSON.parse(rawBody) as WebHook;

    if(! ref) throw new Error("Missing ref in body");

    if(ref !== `refs/heads/${stage}`) {
      res.json({});

      return;
    }

    if(headers["content-type"] !== "application/json") throw new Error("Not application/json");

    // Check the github webhook signature
    const signature = headers["x-hub-signature-256"];

    if(! signature) throw new Error("Missing signature header");
    if(typeof signature !== "string") throw new Error("Signature header is not a string");

    const sig = Buffer.from(signature, "utf8");
    const hmac = createHmac(sigHashAlg, githubSecret);
    const digest = Buffer.from(`${sigHashAlg}=${hmac.update(rawBody).digest("hex")}`, "utf8");

    if(sig.length !== digest.length || ! timingSafeEqual(digest, sig))
      throw new Error(`Bad signature ${sig.toString("utf8")} ${digest.toString("utf8")}`);
  } catch(error) {
    return log("/gh/wh:", error);
  }

  const sock = "/var/run/docker.sock";
  const volumes = [
    `memtime-${stage}_logs:/home/memtime/logs`,
    `memtime-${stage}_ssh:/home/memtime/.ssh`,
    `memtime-${stage}_memtime:/home/memtime/memtime`,
    `${sock}:${sock}`
  ]
    .map(_ => `-v ${_}`)
    .join(" ");

  exec(`docker run --rm -d ${volumes} memtime-cd:${stage} ./cd.sh`, (error, stdout) => {
    if(error) log("Launching CD", error);
    else log(`Launched CD ${stdout.replace(/\s/, "")}`);
  });

  res.json({});
});
