#!/bin/bash

> .deps

for package in $(ls packages) ; do
  echo "packages/${package}/.tsc: .env" >> .deps

  for file in $(find packages/${package} -type f | grep -v node_modules | grep -v /dist/ | grep -E '\.(css|html|json|ts|tsx)$') ; do
    echo "packages/${package}/.tsc: ${file}" >> .deps
  done
done
