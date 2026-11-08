# cSpell:ignore buildx getent

PACKAGES=$(shell find packages -maxdepth 1 -type d -exec test -e {}/package.json \; -print | cut -c 10-)

$(foreach var,$(shell cat .env),$(eval export $(var)))
include .env

BUILD_ARGS=$(foreach var,NODEJS_VERSION PORT STAGE,--build-arg ${var})
USER_ARGS=--build-arg GID=$(shell id -g) --build-arg UID=$(shell id -u) --build-arg DOCKER=$(shell getent group docker | cut -d: -f3)

BUILD=docker buildx build
COMPOSE=docker compose -p memtime-${STAGE}

REVISION=$(if $(filter dev,$(STAGE)),dev,$(shell git rev-parse HEAD 2>/dev/null | cut -c1-8 || echo unknown))
ENV_COMMAND=printf "%s\n%s\n" "export const port = $(PORT);" "export const revision = \"$(REVISION)\";"
ENV_FILE=packages/web/src/env.ts
ifneq ($(shell ${ENV_COMMAND}),$(shell cat ${ENV_FILE} 2> /dev/null))
$(info $(shell ${ENV_COMMAND} > ${ENV_FILE}))
endif

all: .build

$(shell bash scripts/deps.sh)
include .deps

packages/%/.tsc: .env
	yarn workspace memtime-$* tsc
	@touch $@

.build: .lint
	yarn workspace memtime-web build
	bash scripts/dist.sh
	@touch $@

.env: .nvmrc .yarn scripts/env.ts
	yarn env

.lint: eslint.config.js .tsc
	yarn lint
	@touch $@

.tsc: $(foreach PACKAGE,${PACKAGES},packages/${PACKAGE}/.tsc)
	@touch $@

.yarn: package.json $(foreach PACKAGE,${PACKAGES},packages/${PACKAGE}/package.json)
ifeq (${IMMUTABLE}, true)
	yarn --immutable
else
	yarn
endif
	@touch $@

build: .build

dev: .env
	bash scripts/dev.sh

docker: .build
	${BUILD} ${BUILD_ARGS} ${USER_ARGS} -t memtime-base:${STAGE} -f Dockerfile.base .
	${BUILD} ${BUILD_ARGS} ${USER_ARGS} -t memtime:${STAGE} .
	${BUILD} ${BUILD_ARGS} ${USER_ARGS} -t memtime-cd:${STAGE} -f Dockerfile.cd .
	docker system prune -f --filter until=8760h
	docker builder prune -af --filter until=720h

lint: .lint

up: docker
	${COMPOSE} up --menu=false $(if $(filter $(STAGE),dev),,-d)

down:
	${COMPOSE} down
