#!/bin/bash
cd /home/z/my-project
while true; do
  if ! pgrep -f "standalone/server.js" > /dev/null 2>&1; then
    NODE_ENV=production node .next/standalone/server.js >> /home/z/my-project/dev.log 2>&1 &
    sleep 4
  fi
  sleep 2
done
