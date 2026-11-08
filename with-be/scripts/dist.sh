#!/bin/bash

for src in $(find packages/web/dist -type f) ; do
  dst=$(echo $src | sed -e 's/web/server/')

  if ! diff $src $dst > /dev/null 2> /dev/null; then
    mkdir -p $(dirname $dst)
    echo cp $src $dst
    cp $src $dst
  fi
done

for dst in $(find packages/server/dist -type f) ; do
  src=$(echo $dst | sed -e 's/server/web/')

  if ! [ -e $src ] ; then
    echo rm $dst
    rm $dst
  fi
done
