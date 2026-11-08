import { Console } from "console";
import { setLogger } from "memtime-shared";
import { createStream } from "rotating-file-stream";

import { stage } from "./config";

export const nowString = () => {
  const now = new Date().toISOString();
  const date = now.substring(0, 10);
  const time = now.substring(11, 23);

  return `${date} ${time}`;
};

export const rfs = createStream("memtime.log", {
  maxFiles:    10,
  path:        "logs",
  size:        "100K",
  teeToStdout: stage === "dev"
});

const console = new Console({
  colorMode:      true,
  inspectOptions: { depth: 5 },
  stdout:         rfs
});

export const log = (...args: unknown[]) => console.log(nowString(), ...args);

setLogger({
  debug: log,
  error: log,
  info:  log,
  warn:  log
});
