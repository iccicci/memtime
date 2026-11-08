#!/bin/bash

cd packages/server
DEV=true ../../node_modules/.bin/tsx watch --clear-screen=false index &
SERVER=$!

cd ../web
sleep 1
../../node_modules/.bin/vite &
WEB=$!

trap echo INT
wait
