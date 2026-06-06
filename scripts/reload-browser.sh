#!/bin/bash
# Reload the browser page at localhost:5173 via CDP
TAB_WS=$(curl -s http://127.0.0.1:9222/json | python3 -c "
import sys, json
tabs = json.load(sys.stdin)
for t in tabs:
    if 'localhost:5173' in t.get('url', '') and t.get('type') == 'page':
        print(t['webSocketDebuggerUrl'])
        break
")

if [ -z "$TAB_WS" ]; then
  # No tab with the page, create one
  curl -s 'http://127.0.0.1:9222/json/new?http://localhost:5173/' > /dev/null
  echo "Created new tab at localhost:5173"
  sleep 3
else
  # Reload via CDP
  NODE_PATH=/tmp/node_modules node -e "
    const WebSocket = require('ws');
    const ws = new WebSocket('$TAB_WS');
    ws.on('open', () => {
      ws.send(JSON.stringify({id:1, method:'Page.reload', params:{}}));
      setTimeout(() => { ws.close(); console.log('Page reloaded'); }, 1000);
    });
  "
fi
