import type { Request, Response } from "express";
import express from "express";

import { apiBaseUrl, apiKey, rateLimit, rateWindow } from "./config";
import { log } from "./log";

export const api = express.Router();

api.use(express.raw({ limit: "1mb", type: "*/*" }));

const hopByHop = new Set(["connection", "content-encoding", "content-length", "transfer-encoding"]);
const requestTimestamps: string[] = [];

const seconds = (date: Date) => String(Math.floor(date.getTime() / 1000));

const pruneRequestTimestamps = (cutoff: string) => {
  while(requestTimestamps.length > 0 && requestTimestamps[0] <= cutoff) requestTimestamps.shift();
};

api.use(async (req: Request, res: Response) => {
  const now = seconds(new Date());

  pruneRequestTimestamps(String(Number(now) - rateWindow));

  if(requestTimestamps.length >= rateLimit) {
    log("Rate limit: rejecting", req.method, req.originalUrl);
    res.status(429).send("Too many requests, please try again later.");

    return;
  }

  requestTimestamps.push(now);

  const target = `${apiBaseUrl}${req.originalUrl}`;
  const headers: { [key: string]: string } = {
    Authorization: `Bearer ${apiKey}`
  };

  const contentType = req.headers["content-type"];

  if(typeof contentType === "string") headers["Content-Type"] = contentType;

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody && Buffer.isBuffer(req.body) && req.body.length > 0 ? new Uint8Array(req.body) : undefined;

  try {
    const upstream = await fetch(target, { body, headers, method });

    res.status(upstream.status);

    for(const [name, value] of upstream.headers) if(! hopByHop.has(name.toLowerCase())) res.setHeader(name, value);

    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch(error) {
    log("API proxy error:", error);
    res.status(502).json({ error: "Bad Gateway", message: "Upstream API request failed" });
  }
});
