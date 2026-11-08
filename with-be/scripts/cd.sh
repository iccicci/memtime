#!/bin/bash

set -e

export IMMUTABLE=true

LOG=logs/cd-$(date +%Y-%m-%d_%H-%M-%S).log

{
  cd memtime

  git checkout ${STAGE}
  git fetch --prune
  git reset --hard origin/${STAGE}

  cd with-be

  make docker
  make down
  make up

  sleep 10
  docker rm memtime-${STAGE}-cd-1
} > $LOG
