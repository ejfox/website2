#!/bin/bash

echo "=== Testing Robot APIs ==="
echo ""
echo "1. /api/robot/meta (identity):"
curl -s http://localhost:3000/api/robot/meta | jq '.identity'
echo ""
echo "2. /api/robot/meta (endpoints count):"
curl -s http://localhost:3000/api/robot/meta | jq '.capabilities.endpoints | length'
echo ""
echo "3. /api/robot/mind (thought count):"
curl -s http://localhost:3000/api/robot/mind | jq '.meta.count'
echo ""
echo "4. /api/robot/mind (first thought):"
curl -s http://localhost:3000/api/robot/mind | jq '.thoughts[0] | {type, timestamp, title}'
echo ""
echo "5. /api/robot/timeline (event count):"
curl -s http://localhost:3000/api/robot/timeline?limit=20 | jq '.meta.count'
echo ""
echo "6. /api/robot/timeline (first event):"
curl -s http://localhost:3000/api/robot/timeline?limit=20 | jq '.events[0] | {type, timestamp, title}'
echo ""
echo "7. /api/robot/timeline (stats):"
curl -s http://localhost:3000/api/robot/timeline?limit=100 | jq '.stats.byType'
