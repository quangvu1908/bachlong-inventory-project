#!/bin/bash
cd /home/z/my-project
while true; do
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "[$(date)] starting dev server..." >> /home/z/my-project/watchdog.log
    nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
    sleep 8
  fi
  sleep 5
done
