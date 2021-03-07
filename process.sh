#!/usr/bin/env bash

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

source $DIR/photo-organizer.env

LOCKFILE=$DIR/photo-organizer.lock
SHASUM_FILE=$DIR/source-photos.sha256

touch $SHASUM_FILE

EXISTING_SHASUM=`cat $SHASUM_FILE 2>/dev/null`
CURRENT_SHASUM=`ls -laR $ACTUAL_SOURCE_DIRECTORY | sha256sum | cut -f1 -d\ `

echo $CURRENT_SHASUM > $SHASUM_FILE

if [ -f $LOCKFILE ]; then
  echo photo organizer process already running, exiting...
  exit 0;
fi

if [ "$EXISTING_SHASUM" != "$CURRENT_SHASUM" ]; then
  echo some files have changed since last time, exiting to until things have settled...
  exit 0;
fi

touch $LOCKFILE
cd $DIR && docker-compose exec -T app /bin/bash -c "yarn start"
rm -f $LOCKFILE
