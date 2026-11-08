ARG STAGE=latest

FROM memtime-base:${STAGE}

COPY package.json package.json
COPY yarn.lock yarn.lock

RUN yarn --immutable --production

COPY packages/web/ packages/web
COPY packages/server/ packages/server
COPY packages/shared/ packages/shared

EXPOSE ${PORT}

WORKDIR /home/memtime/packages/server

USER memtime

CMD ["node", "--import", "file:///home/memtime/node_modules/tsx/dist/loader.mjs", "index"]
